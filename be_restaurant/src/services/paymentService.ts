import crypto from "crypto";
import qs from "qs";
import paymentRepository, {
  PaymentFilters,
  PaymentWithDetails,
} from "../repositories/paymentRepository";
import { BaseService } from "./baseService";
import { Payment } from "../models";
import { FindOptions, Op, WhereOptions } from "sequelize";

class PaymentService extends BaseService<Payment> {
  constructor() {
    super(Payment);
  }
  buildSearchWhere(q: any): WhereOptions | undefined {
    if (!q) return undefined;
    const where: WhereOptions = {};
    if (q.status) where.status = q.status;
    if (q.method) where.method = q.method;
    if (q.order_id) where.order_id = q.order_id;
    if (q.reservation_id) where.reservation_id = q.reservation_id;
    if (q.from || q.to) {
      where.created_at = {
        ...(q.from ? { [Op.gte]: new Date(q.from) } : {}),
        ...(q.to ? { [Op.lte]: new Date(q.to) } : {}),
      } as any;
    }
    return where;
  }

  async search(q: any, options?: FindOptions) {
    const where = this.buildSearchWhere(q);
    return await this.findAll({
      ...options,
      where: { ...(options?.where || {}), ...(where || {}) },
    });
  }
  private formatLocalDateYYYYMMDDHHmmss(date: Date) {
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  private sortObject(obj: Record<string, any>) {
    // Follow VNPay sample: encode keys and values, replace space with '+', sort by encoded keys
    const encoded: Record<string, any> = {};
    const encodedKeys: string[] = [];
    const mapEncodedToOriginal: Record<string, string> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const encKey = encodeURIComponent(key);
        encodedKeys.push(encKey);
        mapEncodedToOriginal[encKey] = key;
      }
    }
    encodedKeys.sort();
    for (let i = 0; i < encodedKeys.length; i++) {
      const encKey = encodedKeys[i];
      const originalKey = mapEncodedToOriginal[encKey];
      const value = obj[originalKey];
      encoded[encKey] = encodeURIComponent(String(value)).replace(/%20/g, "+");
    }
    return encoded;
  }

  private buildVnpUrl(params: Record<string, any>, returnUrl: string) {
    const baseUrl = process.env.VNP_URL || (process.env as any).vnp_Url;
    params.vnp_Version = "2.1.0";
    params.vnp_Command = "pay";
    params.vnp_TmnCode =
      process.env.VNP_TMN_CODE || (process.env as any).vnp_TmnCode;
    params.vnp_CurrCode = "VND";
    params.vnp_Locale = "vn";
    params.vnp_ReturnUrl = returnUrl;
    params.vnp_CreateDate = this.formatLocalDateYYYYMMDDHHmmss(new Date());

  // VNPay expects vnp_SecureHashType to be present and equal to 'HMACSHA512'
  // (see VNPay docs). Include it before signing so that the signing string
  // excludes it but the final query contains it as required.
  params.vnp_SecureHashType = 'HMACSHA512';

    if (params.vnp_IpAddr === "::1") params.vnp_IpAddr = "127.0.0.1";

    // ⚠️ KHÔNG encode trước khi sign
    const sortedParams = this.sortObject(params);

    const signData = qs.stringify(sortedParams, { encode: false });

    const secureHash = crypto
      .createHmac(
        "sha512",
        process.env.VNP_HASH_SECRET || (process.env as any).vnp_HashSecret || ""
      )
      .update(signData, "utf-8")
      .digest("hex");

    // ✅ Theo sample: không encode thêm khi build URL (đã encoded ở sortObject)
    const queryString = qs.stringify(sortedParams, { encode: false });

    // Add hash type per VNPay recommendation
    return `${baseUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  generateVnpayOrderUrl(
    order: { id: string; final_amount: number },
    bankCode?: string,
    clientIp: string = "127.0.0.1"
  ): { url: string; txnRef: string } {
    const txnRef = `ORD_${order.id}`;
    const params: Record<string, any> = {
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(Number(order.final_amount) * 100),
      vnp_IpAddr: clientIp,
    };

    if (bankCode) params.vnp_BankCode = bankCode;

    const url = this.buildVnpUrl(
      params,
      process.env.VNP_RETURN_URL_ORDER || ""
    );
    return { url, txnRef };
  }

  generateVnpayReservationUrl(
    id: string,
    amount: number,
    bankCode?: string,
    clientIp: string = "127.0.0.1"
  ): { url: string; txnRef: string } {
    const txnRef = `RES_${id}_${Date.now()}`;
    const params: Record<string, any> = {
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Dat coc reservation ${id}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(Number(amount) * 100),
      vnp_IpAddr: clientIp,
    };

    if (bankCode) params.vnp_BankCode = bankCode;

    const url = this.buildVnpUrl(
      params,
      process.env.VNP_RETURN_URL_RESERVATION || ""
    );
    return { url, txnRef };
  }

  verifyVnpayReturn(paramsRaw: Record<string, any>) {
    const params = { ...paramsRaw };
    const receivedSecureHash = params.vnp_SecureHash as string | undefined;
    delete (params as any).vnp_SecureHash;
    delete (params as any).vnp_SecureHashType;

    const sortedParams = this.sortObject(params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const expectedHash = crypto
      .createHmac(
        "sha512",
        process.env.VNP_HASH_SECRET || (process.env as any).vnp_HashSecret || ""
      )
      .update(signData, "utf-8")
      .digest("hex");

    const isValid = expectedHash === receivedSecureHash;
    const isSuccess = paramsRaw.vnp_ResponseCode === "00";

    const txnRef: string = String(paramsRaw.vnp_TxnRef || "");
    let kind: "order" | "reservation" | undefined;
    let targetId: string | undefined;
    if (txnRef.startsWith("ORD_")) {
      kind = "order";
      targetId = txnRef.replace(/^ORD_/, "");
    } else if (txnRef.startsWith("RES_")) {
      kind = "reservation";
      // format RES_<reservationId>_<timestamp>
      const parts = txnRef.split("_");
      targetId = parts[1];
    }

    return { isValid, isSuccess, kind, targetId };
  }

  // CRUD Operations
  async getAllPayments(filters: PaymentFilters = {}) {
    return await paymentRepository.findAll(filters);
  }

  async getPaymentById(id: string): Promise<PaymentWithDetails | null> {
    return await paymentRepository.findById(id);
  }

  async createPayment(data: any) {
    return await paymentRepository.create(data);
  }

  async updatePayment(id: string, data: any) {
    return await paymentRepository.update(id, data);
  }

  async deletePayment(id: string) {
    return await paymentRepository.delete(id);
  }

  async getPaymentByTransactionId(transactionId: string) {
    return await paymentRepository.findByTransactionId(transactionId);
  }

  async updatePaymentStatusByTxnRef(
    transactionId: string,
    status: "pending" | "completed" | "failed"
  ) {
    return await paymentRepository.updateStatusByTxnRef(transactionId, status);
  }

  // Statistics methods
  async getPaymentStats(startDate?: Date, endDate?: Date) {
    return await paymentRepository.getPaymentStats(startDate, endDate);
  }

  async getRevenueByTable(startDate?: Date, endDate?: Date) {
    return await paymentRepository.getRevenueByTable(startDate, endDate);
  }

  async getCustomerSpendingStats(startDate?: Date, endDate?: Date) {
    return await paymentRepository.getCustomerSpendingStats(startDate, endDate);
  }

  async getDailyRevenue(startDate: Date, endDate: Date) {
    return await paymentRepository.getDailyRevenue(startDate, endDate);
  }

  async getMonthlyRevenue(startDate: Date, endDate: Date) {
    return await paymentRepository.getMonthlyRevenue(startDate, endDate);
  }

  // VNPay specific methods
  async createPendingPayment(data: {
    order_id?: string;
    reservation_id?: string;
    amount: number;
    method: "cash" | "vnpay";
    transaction_id?: string;
  }) {
    return await paymentRepository.createPendingPayment(data);
  }
}

export default new PaymentService();
