'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/chat';

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: ChatSocket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user) return;

    const user = session.user as any;
    const newSocket: ChatSocket = io({
      auth: {
        userId: user.id,
        username: user.name,
        roleLevel: user.roleLevel,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
