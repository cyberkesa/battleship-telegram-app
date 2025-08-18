import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(baseUrl?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = baseUrl || (import.meta.env.VITE_API_URL || '').replace(/\/api$/, '') + '/ws';
    const s = io(url, { transports: ['websocket'], withCredentials: false });
    socketRef.current = s;
    return () => { s.close(); };
  }, [baseUrl]);

  return socketRef;
}

