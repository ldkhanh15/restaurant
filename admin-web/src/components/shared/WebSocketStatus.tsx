import { useWebSocket } from '@/providers/WebSocketProvider';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export interface WebSocketStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function WebSocketStatus({ showDetails = false, className }: WebSocketStatusProps) {
  const { isConnected, connectionStatus } = useWebSocket();

  if (!showDetails) {
    return (
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className={className}
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 mr-1" />
            Kết nối
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 mr-1" />
            Mất kết nối
          </>
        )}
      </Badge>
    );
  }

  // Count connected modules
  const connectedCount = Object.values(connectionStatus).filter(Boolean).length;
  const totalModules = Object.keys(connectionStatus).length;

  return (
    <div className={`space-y-2 ${className}`}>
      <Badge 
        variant={isConnected ? "default" : "destructive"}
        className="mb-2"
      >
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 mr-1" />
            Kết nối ({connectedCount}/{totalModules})
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 mr-1" />
            Mất kết nối
          </>
        )}
      </Badge>

      {showDetails && (
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span>Chat:</span>
            <span className={connectionStatus.chat ? "text-green-600" : "text-red-600"}>
              {connectionStatus.chat ? "✓" : "✗"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Đơn hàng:</span>
            <span className={connectionStatus.order ? "text-green-600" : "text-red-600"}>
              {connectionStatus.order ? "✓" : "✗"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Đặt bàn:</span>
            <span className={connectionStatus.reservation ? "text-green-600" : "text-red-600"}>
              {connectionStatus.reservation ? "✓" : "✗"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Thông báo:</span>
            <span className={connectionStatus.notification ? "text-green-600" : "text-red-600"}>
              {connectionStatus.notification ? "✓" : "✗"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}