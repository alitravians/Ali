import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getTicketDetails, getTicketMessages, sendMessage, updateTicketStatus, Ticket, TicketMessage } from '../lib/api';

export const TicketDetail: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const [ticketData, messagesData] = await Promise.all([
          getTicketDetails(Number(id), language),
          getTicketMessages(Number(id))
        ]);
        setTicket(ticketData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Failed to fetch ticket data:', error);
      }
    };
    if (id) {
      fetchTicketData();
    }
  }, [id, language]);

  const handleStatusChange = async (status: Ticket['status']) => {
    try {
      const updatedTicket = await updateTicketStatus(Number(id), status);
      setTicket(updatedTicket);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    try {
      const message = await sendMessage(Number(id), newMessage, user.id);
      setMessages([...messages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!ticket) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>{ticket.title}</CardTitle>
          <div className="flex items-center space-x-4">
            <Select value={ticket.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40">
                <SelectValue>{t(`tickets.status.${ticket.status.toLowerCase()}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`tickets.status.${status.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => navigate('/tickets')}>
              {t('common.back')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{ticket.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('messages.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">User {message.user_id}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p>{message.content}</p>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSendMessage} className="space-y-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('messages.placeholder')}
              required
            />
            <Button type="submit">{t('messages.send')}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
