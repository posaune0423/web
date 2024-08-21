import { ColoredCell } from "@/components/PixelViewer/types";
import { useCallback, useEffect, useRef, useState } from "react";

const useWebSocket = (url: string) => {
  const [data, setData] = useState<ColoredCell[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    socketRef.current.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { data, isConnected, sendMessage };
};

export { useWebSocket };
