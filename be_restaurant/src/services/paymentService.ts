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
    // Validate return URL - must not be empty
    if (!returnUrl || returnUrl.trim() === "") {
      throw new Error(
        "VNPay return URL is required. Please set VNP_RETURN_URL_ORDER, VNP_RETURN_URL, or CLIENT_URL environment variable."
      );
    }

    const baseUrl = process.env.VNP_URL || (process.env as any).vnp_Url;
    if (!baseUrl) {
      throw new Error(
        "VNPay base URL is required. Please set VNP_URL environment variable."
      );
    }

    params.vnp_Version = "2.1.0";
    params.vnp_Command = "pay";
    params.vnp_TmnCode =
      process.env.VNP_TMN_CODE || (process.env as any).vnp_TmnCode;
    params.vnp_CurrCode = "VND";
    params.vnp_Locale = "vn";
    params.vnp_ReturnUrl = returnUrl.trim();
    params.vnp_CreateDate = this.formatLocalDateYYYYMMDDHHmmss(new Date());

    if (params.vnp_IpAddr === "::1") params.vnp_IpAddr = "127.0.0.1";

    // ⚠️ VNPay: vnp_SecureHashType và vnp_SecureHash KHÔNG được include trong signing string
    // Tạo copy của params để sign (loại bỏ vnp_SecureHashType)
    const paramsForSign = { ...params };
    delete (paramsForSign as any).vnp_SecureHashType;
    delete (paramsForSign as any).vnp_SecureHash;

    // Sort và encode params để sign
    const sortedParams = this.sortObject(paramsForSign);
    const signData = qs.stringify(sortedParams, { encode: false });

    // Tính hash
    const secureHash = crypto
      .createHmac(
        "sha512",
        process.env.VNP_HASH_SECRET || (process.env as any).vnp_HashSecret || ""
      )
      .update(signData, "utf-8")
      .digest("hex");

    // Build query string từ params gốc (bao gồm vnp_SecureHashType)
    const paramsForQuery = { ...params };
    paramsForQuery.vnp_SecureHashType = "HMACSHA512";
    const sortedParamsForQuery = this.sortObject(paramsForQuery);
    const queryString = qs.stringify(sortedParamsForQuery, { encode: false });

    // Thêm hash vào cuối
    return `${baseUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  generateVnpayOrderUrl(
    order: { id: string; final_amount: number },
    bankCode?: string,
    clientIp: string = "127.0.0.1",
    client: "admin" | "user" = "user"
  ): { url: string; txnRef: string } {
    const clientTag = client === "admin" ? "ADM" : "USR";
    // Ensure unique TxnRef for each attempt to avoid "transaction already processed" at VNPay
    const txnRef = `ORD_${order.id}_${clientTag}_${Date.now()}`;
    const params: Record<string, any> = {
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(Number(order.final_amount) * 100),
      vnp_IpAddr: clientIp,
    };

    if (bankCode) params.vnp_BankCode = bankCode;

    // Build return URL with fallback - ensure it's never empty
    let returnUrl = process.env.VNP_RETURN_URL_ORDER || "";
    if (!returnUrl || returnUrl.trim() === "") {
      // Fallback: use VNP_RETURN_URL or construct from CLIENT_URL
      returnUrl =
        process.env.VNP_RETURN_URL ||
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/api/payments/vnpay/return`;
    }

    // Final validation - ensure returnUrl is not empty
    if (!returnUrl || returnUrl.trim() === "") {
      throw new Error(
        "VNPay return URL cannot be empty. Please set VNP_RETURN_URL_ORDER, VNP_RETURN_URL, or CLIENT_URL environment variable."
      );
    }

    const url = this.buildVnpUrl(params, returnUrl.trim());
    return { url, txnRef };
  }

  generateVnpayReservationUrl(
    id: string,
    amount: number,
    bankCode?: string,
    clientIp: string = "127.0.0.1",
    client: "admin" | "user" = "user"
  ): { url: string; txnRef: string } {
    const clientTag = client === "admin" ? "ADM" : "USR";
    const txnRef = `RES_${id}_${clientTag}_${Date.now()}`;
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
      // Format: ORD_<orderId>_<ADM|USR>
      const parts = txnRef.split("_");
      targetId = parts[1]; // Extract orderId (second part)
    } else if (txnRef.startsWith("RES_")) {
      kind = "reservation";
      // Format: RES_<reservationId>_<ADM|USR>_<timestamp>
      const parts = txnRef.split("_");
      targetId = parts[1]; // Extract reservationId (second part)
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
