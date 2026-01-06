import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo, onValue, update } from 'firebase/database';
import { database } from '../firebase/config';
import { useCustomerAuth } from './CustomerAuthContext';

export interface TicketAttachment {
  name: string;
  size: number;
  type: string;
  data: string; // base64
}

export interface TicketMessage {
  id: string;
  senderType: 'customer' | 'staff';
  senderId: string;
  senderName: string;
  message: string;
  attachments?: TicketAttachment[];
  createdAt: string;
  isInternal?: boolean; // Internal notes not visible to customer
}

export interface Ticket {
  id: string;
  ticketCode: string;
  customerId: string;
  customerEmail: string;
  customerUsername: string;
  robloxUsername: string;
  category: 'problem' | 'report' | 'technical' | 'fraud';
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'under_review' | 'awaiting_customer' | 'resolved' | 'closed';
  assignedToStaffId?: string;
  assignedToStaffName?: string;
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
  createdAt: string;
  updatedAt: string;
  lastCustomerMessageAt?: string;
  lastStaffMessageAt?: string;
  closedAt?: string;
  closedBy?: string;
  resolutionSummary?: string;
  customerCanReply: boolean;
}

interface TicketContextType {
  tickets: Ticket[];
  isLoading: boolean;
  createTicket: (data: CreateTicketData) => Promise<{ success: boolean; ticketCode?: string; error?: string }>;
  addMessage: (ticketId: string, message: string, attachments?: TicketAttachment[]) => Promise<boolean>;
  getTicketByCode: (code: string, email: string) => Promise<Ticket | null>;
  refreshTickets: () => void;
}

interface CreateTicketData {
  category: Ticket['category'];
  subject: string;
  description: string;
  priority?: Ticket['priority'];
  attachments?: TicketAttachment[];
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

// Generate unique ticket code like MM2-A7K4Q9
const generateTicketCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MM2-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const TicketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { customer, isLoggedIn } = useCustomerAuth();

  // Load customer tickets
  useEffect(() => {
    if (!isLoggedIn || !customer?.email) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    const ticketsRef = ref(database, 'tickets');
    const customerTicketsQuery = query(
      ticketsRef,
      orderByChild('customerEmail'),
      equalTo(customer.email)
    );

    const unsubscribe = onValue(customerTicketsQuery, (snapshot) => {
      if (snapshot.exists()) {
        const ticketsData = snapshot.val();
        const ticketsList = Object.entries(ticketsData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
          messages: data.messages ? Object.values(data.messages).filter((m: any) => !m.isInternal) : []
        }));
        ticketsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setTickets(ticketsList);
      } else {
        setTickets([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isLoggedIn, customer?.email]);

  const createTicket = async (data: CreateTicketData): Promise<{ success: boolean; ticketCode?: string; error?: string }> => {
    if (!isLoggedIn || !customer) {
      return { success: false, error: 'يجب تسجيل الدخول أولاً' };
    }

    try {
      const ticketCode = generateTicketCode();
      const ticketsRef = ref(database, 'tickets');
      const newTicketRef = push(ticketsRef);
      
      const now = new Date().toISOString();
      const ticket: Omit<Ticket, 'id' | 'messages'> & { messages: Record<string, TicketMessage> } = {
        ticketCode,
        customerId: customer.id,
        customerEmail: customer.email,
        customerUsername: customer.username,
        robloxUsername: customer.robloxUsername,
        category: data.category,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'normal',
        status: 'open',
        attachments: data.attachments || [],
        createdAt: now,
        updatedAt: now,
        lastCustomerMessageAt: now,
        customerCanReply: true,
        messages: {}
      };

      // Add initial message
      const messageId = 'msg_' + Date.now();
      ticket.messages[messageId] = {
        id: messageId,
        senderType: 'customer',
        senderId: customer.id,
        senderName: customer.username,
        message: data.description,
        attachments: data.attachments,
        createdAt: now
      };

      await set(newTicketRef, ticket);
      return { success: true, ticketCode };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return { success: false, error: 'حدث خطأ أثناء إنشاء التذكرة' };
    }
  };

  const addMessage = async (ticketId: string, message: string, attachments?: TicketAttachment[]): Promise<boolean> => {
    if (!isLoggedIn || !customer) return false;

    try {
      // Check if ticket is closed
      const ticketRef = ref(database, `tickets/${ticketId}`);
      const ticketSnapshot = await get(ticketRef);
      
      if (!ticketSnapshot.exists()) return false;
      
      const ticketData = ticketSnapshot.val();
      if (ticketData.status === 'closed' || !ticketData.customerCanReply) {
        return false;
      }

      const now = new Date().toISOString();
      const messageId = 'msg_' + Date.now();
      const messagesRef = ref(database, `tickets/${ticketId}/messages/${messageId}`);
      
      await set(messagesRef, {
        id: messageId,
        senderType: 'customer',
        senderId: customer.id,
        senderName: customer.username,
        message,
        attachments: attachments || [],
        createdAt: now
      });

      // Update ticket
      await update(ticketRef, {
        updatedAt: now,
        lastCustomerMessageAt: now,
        status: ticketData.status === 'awaiting_customer' ? 'under_review' : ticketData.status
      });

      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      return false;
    }
  };

  const getTicketByCode = async (code: string, email: string): Promise<Ticket | null> => {
    try {
      const ticketsRef = ref(database, 'tickets');
      const ticketQuery = query(ticketsRef, orderByChild('ticketCode'), equalTo(code.toUpperCase()));
      const snapshot = await get(ticketQuery);

      if (!snapshot.exists()) return null;

      const ticketsData = snapshot.val();
      const ticketId = Object.keys(ticketsData)[0];
      const ticketData = ticketsData[ticketId];

      // Verify email matches
      if (ticketData.customerEmail.toLowerCase() !== email.toLowerCase()) {
        return null;
      }

      return {
        id: ticketId,
        ...ticketData,
        messages: ticketData.messages 
          ? Object.values(ticketData.messages).filter((m: any) => !m.isInternal)
          : []
      };
    } catch (error) {
      console.error('Error getting ticket:', error);
      return null;
    }
  };

  const refreshTickets = () => {
    setIsLoading(true);
    // The useEffect will handle the refresh
  };

  return (
    <TicketContext.Provider value={{
      tickets,
      isLoading,
      createTicket,
      addMessage,
      getTicketByCode,
      refreshTickets
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
};
