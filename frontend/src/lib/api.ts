import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  id: number;
  username: string;
  role: string;
  status: string;
  language: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  created_by: number;
  assigned_to?: number;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export const loginUser = async (username: string, password: string) => {
  try {
    const response = await api.post('/users/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const err = new Error('Invalid credentials');
      err.name = 'AuthenticationError';
      throw err;
    }
    throw new Error('Login failed');
  }
};

export interface VisitorInfo {
  name: string;
  email: string;
}

export const createTicket = async (
  title: string,
  description: string,
  visitorInfo?: VisitorInfo,
  userId?: number
) => {
  const response = await api.post('/tickets/', {
    title,
    description,
    status: 'open',
    created_at: new Date().toISOString(),
    created_by: userId,
    visitor_info: visitorInfo
  });
  return response.data;
};

export const getTickets = async (language: string = 'en'): Promise<Ticket[]> => {
  const response = await api.get(`/tickets/?lang=${language}`);
  return response.data.map((ticket: Ticket) => ({
    ...ticket,
    status: ticket.status.toLowerCase() as Ticket['status']
  }));
};

export const getTicketDetails = async (ticketId: number, language: string = 'en') => {
  const response = await api.get(`/tickets/${ticketId}?lang=${language}`);
  return response.data;
};

export const getTicketMessages = async (ticketId: number) => {
  const response = await api.get(`/tickets/${ticketId}/messages/`);
  return response.data;
};

export const sendMessage = async (ticketId: number, content: string, senderId: number) => {
  const response = await api.post(`/tickets/${ticketId}/messages/`, { 
    content,
    sender_id: senderId
  });
  return response.data;
};

export const updateTicketStatus = async (ticketId: number, status: Ticket['status']) => {
  try {
    const response = await api.put(`/tickets/${ticketId}/status`, { 
      status: status.toUpperCase()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};

export const assignTicket = async (ticketId: number, supervisorId: number) => {
  const response = await api.put(`/tickets/${ticketId}/assign/${supervisorId}`);
  return response.data;
};

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users/');
  return response.data;
};

export const createUser = async (user: {
  username: string;
  password: string;
  role: string;
  status: string;
  language: string;
}): Promise<User> => {
  const response = await api.post('/users/', user);
  return response.data;
};
