"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  QrCode,
  Download,
  Copy,
  CheckCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { tableService } from "@/services/tableService";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

interface TableQRGeneratorProps {
  tableId: string;
  tableNumber?: string;
  onClose?: () => void;
}

export function TableQRGenerator({
  tableId,
  tableNumber,
  onClose,
}: TableQRGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const response = await tableService.getQRCode(tableId);
        if (response.status === "success" && response.data) {
          setQrCodeUrl(response.data.qr_code_url);
        } else {
          toast.error("Không thể lấy QR code");
        }
      } catch (error: any) {
        console.error("Error fetching QR code:", error);
        toast.error(error.response?.data?.message || "Không thể lấy QR code");
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      fetchQRCode();
    }
  }, [tableId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      setCopied(true);
      toast.success("Đã sao chép link!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Không thể sao chép link");
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-code-${tableId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Ban-${tableNumber || tableId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("Đã tải xuống QR code!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const frontendUrl =
    process.env.NEXT_PUBLIC_USER_WEB_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:3000";

  const fullUrl = qrCodeUrl || `${frontendUrl}/table/${tableId}`;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code - Bàn {tableNumber || tableId}
        </CardTitle>
        <CardDescription>
          Quét mã QR để khách hàng có thể đặt món tại bàn này
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* QR Code Display */}
            <div className="flex justify-center p-4 bg-white rounded-lg border-2 border-amber-200">
              <div id={`qr-code-${tableId}`}>
                <QRCodeSVG
                  value={fullUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <Separator />

            {/* Table Info */}
            <div className="space-y-2">
              <Label>Thông tin bàn</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  Bàn: {tableNumber || tableId}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {tableId}
                </p>
              </div>
            </div>

            {/* QR Code URL */}
            <div className="space-y-2">
              <Label>Link QR Code</Label>
              <div className="flex gap-2">
                <Input value={fullUrl} readOnly className="font-mono text-xs" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  title="Sao chép link"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadQR}
                className="flex-1"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Tải xuống
              </Button>
              <Button
                onClick={() => window.open(fullUrl, "_blank")}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Mở link
              </Button>
            </div>

            {/* Preview Link */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground text-center">
                Khách hàng sẽ được chuyển đến trang đặt món khi quét QR code
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Dialog wrapper for easy integration
export function TableQRGeneratorDialog({
  tableId,
  tableNumber,
  trigger,
}: {
  tableId: string;
  tableNumber?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            Xem QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - Bàn {tableNumber || tableId}</DialogTitle>
          <DialogDescription>
            Quét mã QR để khách hàng có thể đặt món tại bàn này
          </DialogDescription>
        </DialogHeader>
        <TableQRGenerator
          tableId={tableId}
          tableNumber={tableNumber}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
