import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { getTickets, Ticket } from '../lib/api';

export const TicketList: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getTickets(language);
        setTickets(data);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      }
    };
    fetchTickets();
  }, [language]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('tickets.list')}</h2>
        <Button onClick={() => navigate('/tickets/new')}>
          {t('tickets.create')}
        </Button>
      </div>
      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/tickets/${ticket.id}`)}>
            <CardHeader>
              <CardTitle>{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{ticket.description}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
                <span className="px-2 py-1 rounded-full text-sm" style={{
                  backgroundColor: ticket.status === 'open' ? 'rgb(220 252 231)' :
                                 ticket.status === 'in_progress' ? 'rgb(254 249 195)' :
                                 ticket.status === 'resolved' ? 'rgb(219 234 254)' :
                                 'rgb(229 231 235)',
                  color: ticket.status === 'open' ? 'rgb(22 163 74)' :
                         ticket.status === 'in_progress' ? 'rgb(161 98 7)' :
                         ticket.status === 'resolved' ? 'rgb(29 78 216)' :
                         'rgb(107 114 128)'
                }}>
                  {t(`tickets.status.${ticket.status.toLowerCase()}`)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
