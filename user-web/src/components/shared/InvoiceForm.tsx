"use client";

import React, { useRef } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Receipt,
  Calendar,
  User,
  CreditCard,
  Gift,
  Utensils,
  FileText,
  Printer,
} from "lucide-react";
import type { Order, OrderItem } from "@/services/orderService";

interface InvoiceFormProps {
  order: Order;
  vatAmount?: number;
  pointsUsed?: number;
  finalPaymentAmount?: number;
  storeInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxCode?: string;
  };
}

export default function InvoiceForm({
  order,
  vatAmount = 0,
  pointsUsed = 0,
  finalPaymentAmount,
  storeInfo = {},
}: InvoiceFormProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const subtotal = Number(order.total_amount || 0);
  const voucherDiscount = Number(order.voucher_discount_amount || 0);
  const eventFee = Number(order.event_fee || 0);
  const depositAmount = Number(order.deposit_amount || 0);
  const calculatedVat = vatAmount || subtotal * 0.1; // 10% VAT
  const calculatedFinalAmount =
    finalPaymentAmount ||
    subtotal +
      calculatedVat -
      voucherDiscount +
      eventFee -
      depositAmount -
      pointsUsed;

  const storeName = storeInfo.name || "Nhà Hàng Fine Dining";
  const storeAddress = storeInfo.address || "123 Đường ABC, Quận XYZ, TP.HCM";
  const storePhone = storeInfo.phone || "0123 456 789";
  const storeEmail = storeInfo.email || "info@restaurant.com";
  const storeTaxCode = storeInfo.taxCode || "0123456789";

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Hóa đơn ${order.id.slice(0, 8).toUpperCase()}</title>
              <style>
                @page {
                  size: A4;
                  margin: 15mm;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                body {
                  font-family: 'Times New Roman', serif;
                  font-size: 12pt;
                  line-height: 1.6;
                  color: #000;
                  background: #fff;
                }
                .invoice-container {
                  max-width: 210mm;
                  margin: 0 auto;
                  padding: 20px;
                  background: white;
                }
                .invoice-header {
                  border-bottom: 3px solid #000;
                  padding-bottom: 20px;
                  margin-bottom: 20px;
                }
                .store-info {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .store-name {
                  font-size: 24pt;
                  font-weight: bold;
                  margin-bottom: 10px;
                  text-transform: uppercase;
                }
                .store-details {
                  font-size: 11pt;
                  line-height: 1.8;
                }
                .invoice-title {
                  text-align: center;
                  font-size: 18pt;
                  font-weight: bold;
                  margin: 20px 0;
                  text-transform: uppercase;
                }
                .invoice-info {
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: 20px;
                  padding: 15px;
                  background: #f5f5f5;
                  border: 1px solid #ddd;
                }
                .info-section {
                  flex: 1;
                }
                .info-label {
                  font-weight: bold;
                  margin-bottom: 5px;
                  font-size: 10pt;
                }
                .info-value {
                  font-size: 11pt;
                }
                .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                .items-table th,
                .items-table td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                }
                .items-table th {
                  background: #f0f0f0;
                  font-weight: bold;
                  text-align: center;
                }
                .items-table td {
                  font-size: 11pt;
                }
                .text-right {
                  text-align: right;
                }
                .text-center {
                  text-align: center;
                }
                .summary-section {
                  margin-top: 20px;
                  padding: 15px;
                  background: #f9f9f9;
                  border: 1px solid #ddd;
                }
                .summary-row {
                  display: flex;
                  justify-content: space-between;
                  padding: 5px 0;
                  font-size: 11pt;
                }
                .summary-row.total {
                  border-top: 2px solid #000;
                  margin-top: 10px;
                  padding-top: 10px;
                  font-weight: bold;
                  font-size: 14pt;
                }
                .footer {
                  margin-top: 30px;
                  text-align: center;
                  font-size: 10pt;
                  border-top: 1px solid #ddd;
                  padding-top: 15px;
                }
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              </style>
            </head>
            <body>
              ${invoiceRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Button */}
      <div className="flex justify-end no-print">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          In Hóa Đơn
        </Button>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="invoice-print-content">
        {/* Store Header - Professional Invoice Style */}
        <div className="invoice-header bg-white border-2 border-gray-800 p-8">
          <div className="store-info text-center mb-6">
            <h2 className="text-3xl font-bold mb-3 uppercase tracking-wide">
              {storeName}
            </h2>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{storeAddress}</p>
              <p>
                <span className="font-semibold">Điện thoại:</span> {storePhone}{" "}
                | <span className="font-semibold">Email:</span> {storeEmail}
              </p>
              {storeTaxCode && (
                <p>
                  <span className="font-semibold">Mã số thuế:</span>{" "}
                  {storeTaxCode}
                </p>
              )}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 uppercase tracking-wider">
              HÓA ĐƠN THANH TOÁN
            </h3>
            <p className="text-sm font-semibold">
              Mã đơn:{" "}
              <span className="text-lg">
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Order Information - Compact Layout */}
        <div className="invoice-info bg-gray-50 border border-gray-300 p-4 rounded">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-semibold mb-1">Ngày đặt:</p>
              <p className="font-bold">
                {order.created_at
                  ? format(new Date(order.created_at), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">Trạng thái:</p>
              <Badge
                variant={
                  order.status === "paid"
                    ? "default"
                    : order.status === "cancelled"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs"
              >
                {order.status === "paid"
                  ? "Đã thanh toán"
                  : order.status === "cancelled"
                  ? "Đã hủy"
                  : order.status}
              </Badge>
            </div>
            <div>
              <p className="text-gray-600 font-semibold mb-1">Thanh toán:</p>
              <p className="font-bold">
                {order.payment_method === "vnpay"
                  ? "VNPay"
                  : order.payment_method === "cash"
                  ? "Tiền mặt"
                  : order.payment_method || "Chưa thanh toán"}
              </p>
            </div>
            {order.table && (
              <div>
                <p className="text-gray-600 font-semibold mb-1">Bàn:</p>
                <p className="font-bold">Bàn {order.table.table_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information - Compact */}
        {order.user && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              Khách hàng:
            </p>
            <p className="font-bold text-base">
              {order.user.full_name || order.user.username || "Khách vãng lai"}
            </p>
            {(order.user.email || order.user.phone) && (
              <div className="text-xs text-gray-600 mt-1">
                {order.user.email && <span>{order.user.email}</span>}
                {order.user.email && order.user.phone && <span> | </span>}
                {order.user.phone && <span>{order.user.phone}</span>}
              </div>
            )}
          </div>
        )}

        {/* Order Items - Professional Table */}
        <div className="border-2 border-gray-800">
          <div className="bg-gray-800 text-white p-3">
            <h4 className="font-bold text-lg uppercase">Chi tiết món ăn</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-bold border-r border-gray-300">
                    STT
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bold border-r border-gray-300">
                    Tên món
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-bold border-r border-gray-300">
                    SL
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-bold border-r border-gray-300">
                    Đơn giá
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-bold">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: OrderItem, index: number) => {
                    const itemPrice = Number(
                      item.price || item.dish?.price || 0
                    );
                    const itemQuantity = Number(item.quantity || 1);
                    const itemTotal = itemPrice * itemQuantity;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-300 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium border-r border-gray-200">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium border-r border-gray-200">
                          {item.dish?.name || "Món ăn"}
                        </td>
                        <td className="py-3 px-4 text-sm text-center border-r border-gray-200">
                          {itemQuantity}
                        </td>
                        <td className="py-3 px-4 text-sm text-right border-r border-gray-200">
                          {itemPrice.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="py-3 px-4 text-sm text-right font-bold">
                          {itemTotal.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-gray-500 font-medium"
                    >
                      Không có món nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Breakdown - Professional Style */}
        <div className="border-2 border-gray-800 bg-white">
          <div className="bg-gray-800 text-white p-3">
            <h4 className="font-bold text-lg uppercase">Tổng kết thanh toán</h4>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm py-2 border-b border-gray-200">
              <span className="text-gray-700">Tổng tiền món:</span>
              <span className="font-semibold">
                {subtotal.toLocaleString("vi-VN")}đ
              </span>
            </div>

            {eventFee > 0 && (
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-700">Phí sự kiện:</span>
                <span className="font-semibold text-blue-600">
                  +{eventFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}

            {voucherDiscount > 0 && (
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-700">Giảm giá voucher:</span>
                <span className="font-semibold text-green-600">
                  -{voucherDiscount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}

            {depositAmount > 0 && (
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-700">Tiền đặt cọc đã trả:</span>
                <span className="font-semibold text-blue-600">
                  -{depositAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm py-2 border-b border-gray-200">
              <span className="text-gray-700">VAT (10%):</span>
              <span className="font-semibold">
                +{calculatedVat.toLocaleString("vi-VN")}đ
              </span>
            </div>

            {pointsUsed > 0 && (
              <div className="flex justify-between text-sm py-2 border-b border-gray-200">
                <span className="text-gray-700">Điểm tích lũy đã dùng:</span>
                <span className="font-semibold text-purple-600">
                  -{pointsUsed.toLocaleString("vi-VN")}đ
                </span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-4 border-t-2 border-gray-800 mt-4">
              <span className="uppercase">Tổng thanh toán:</span>
              <span className="text-red-600">
                {calculatedFinalAmount.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Professional */}
        <div className="border-t-2 border-gray-800 pt-6 mt-6 text-center space-y-2">
          <p className="font-bold text-base">
            Cảm ơn quý khách đã sử dụng dịch vụ của chúng tôi!
          </p>
          <p className="text-sm text-gray-600">
            Hóa đơn được tạo tự động vào{" "}
            {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: vi })}
          </p>
          <p className="text-xs text-gray-500 italic">
            Hóa đơn này có giá trị pháp lý và có thể được sử dụng để xuất hóa
            đơn VAT
          </p>
        </div>
      </div>
    </div>
  );
}
