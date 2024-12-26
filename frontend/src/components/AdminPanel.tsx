import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Send } from 'lucide-react';
import { User, Ticket, updateTicketStatus, getUsers, getTickets, createUser, sendMessage } from '../lib/api';

export const AdminPanel: React.FC = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState('1');
  const [banReason, setBanReason] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [responses, setResponses] = useState<{[key: number]: string}>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current user info
    const getCurrentUser = async () => {
      try {
        const users = await getUsers();
        const supervisor = users.find(u => u.role === 'supervisor');
        if (supervisor) {
          setCurrentUser(supervisor);
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users and tickets from API
        const [usersData, ticketsData] = await Promise.all([
          getUsers(),
          getTickets()
        ]);
        setUsers(usersData);
        setTickets(ticketsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleBanUser = async () => {
    if (!selectedUser) return;
    try {
      // TODO: Implement ban user API call
      // await api.post(`/users/${selectedUser.id}/ban`, {
      //   duration: parseInt(banDuration),
      //   reason: banReason
      // });
      console.log('User banned:', selectedUser.id);
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
              <TabsTrigger value="tickets">{t('admin.tabs.tickets')}</TabsTrigger>
              <TabsTrigger value="reports">{t('admin.tabs.reports')}</TabsTrigger>
              <TabsTrigger value="ads">{t('admin.tabs.ads')}</TabsTrigger>
              <TabsTrigger value="moderators">{t('admin.tabs.moderators')}</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label>{t('admin.users.select')}</label>
                  <Select onValueChange={(value) => {
                    const user = users.find(u => u.id.toString() === value);
                    setSelectedUser(user || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.users.selectPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.username} - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUser && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label>{t('admin.users.banDuration')}</label>
                      <Select value={banDuration} onValueChange={setBanDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 {t('admin.time.day')}</SelectItem>
                          <SelectItem value="3">3 {t('admin.time.days')}</SelectItem>
                          <SelectItem value="7">7 {t('admin.time.days')}</SelectItem>
                          <SelectItem value="30">30 {t('admin.time.days')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label>{t('admin.users.banReason')}</label>
                      <Input
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value)}
                        placeholder={t('admin.users.banReasonPlaceholder')}
                      />
                    </div>

                    <Button onClick={handleBanUser} variant="destructive">
                      {t('admin.users.banButton')}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tickets">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.tabs.tickets')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tickets.map((ticket) => (
                        <Card key={ticket.id}>
                          <CardHeader>
                            <CardTitle>{ticket.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p>{ticket.description}</p>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <span>{t(`tickets.status.${ticket.status.toLowerCase()}`)}</span>
                                <Select
                                  value={ticket.status}
                                  onValueChange={async (value: Ticket['status']) => {
                                    try {
                                      await updateTicketStatus(ticket.id, value);
                                      setTickets(tickets.map(t => 
                                        t.id === ticket.id ? { ...t, status: value } : t
                                      ));
                                    } catch (error) {
                                      console.error('Failed to update ticket status:', error);
                                      setError(t('tickets.responseError'));
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">{t('tickets.status.open')}</SelectItem>
                                    <SelectItem value="in_progress">{t('tickets.status.in_progress')}</SelectItem>
                                    <SelectItem value="resolved">{t('tickets.status.resolved')}</SelectItem>
                                    <SelectItem value="closed">{t('tickets.status.closed')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {ticket.status === 'open' && (
                                <div className="space-y-2">
                                  <Textarea
                                    value={responses[ticket.id] || ''}
                                    onChange={(e) => setResponses(prev => ({
                                      ...prev,
                                      [ticket.id]: e.target.value
                                    }))}
                                    placeholder={t('tickets.responsePlaceholder')}
                                    className="min-h-[100px]"
                                  />
                                  <Button
                                    onClick={async () => {
                                      const ticketResponse = responses[ticket.id];
                                      if (!ticketResponse?.trim() || !currentUser) {
                                        setError(t('tickets.responseRequired'));
                                        return;
                                      }
                                      setIsSubmitting(true);
                                      setError('');
                                      setSuccess('');
                                      try {
                                        await sendMessage(ticket.id, ticketResponse, currentUser.id);
                                        await updateTicketStatus(ticket.id, 'resolved');
                                        setSuccess(t('tickets.responseSuccess'));
                                        setResponses(prev => ({
                                          ...prev,
                                          [ticket.id]: ''
                                        }));
                                        const updatedTickets = await getTickets();
                                        setTickets(updatedTickets);
                                      } catch (err) {
                                        setError(t('tickets.responseError'));
                                      } finally {
                                        setIsSubmitting(false);
                                      }
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-2"
                                  >
                                    <Send className="w-4 h-4" />
                                    {t('tickets.sendResponse')}
                                  </Button>
                                </div>
                              )}

                              {error && (
                                <Alert variant="destructive">
                                  <AlertDescription>{error}</AlertDescription>
                                </Alert>
                              )}

                              {success && (
                                <Alert>
                                  <AlertDescription>{success}</AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.reports.status')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { id: 1, title: 'Spam messages', status: 'PENDING', reporter: 'user1', reportedUser: 'user2' },
                        { id: 2, title: 'Inappropriate content', status: 'RESOLVED', reporter: 'user3', reportedUser: 'user4' }
                      ].map((report) => (
                        <Card key={report.id}>
                          <CardHeader>
                            <CardTitle>{report.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div>
                                <p>Reporter: {report.reporter}</p>
                                <p>Reported User: {report.reportedUser}</p>
                              </div>
                              <Select
                                value={report.status}
                                onValueChange={(value) => {
                                  // TODO: Implement status update
                                  console.log('Update report status:', report.id, value);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PENDING">{t('admin.reports.pending')}</SelectItem>
                                  <SelectItem value="RESOLVED">{t('admin.reports.resolved')}</SelectItem>
                                  <SelectItem value="DISMISSED">{t('admin.reports.dismissed')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ads">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.ads.create')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <label>{t('admin.ads.title')}</label>
                        <Input />
                      </div>
                      <div className="space-y-2">
                        <label>{t('admin.ads.content')}</label>
                        <Textarea rows={4} />
                      </div>
                      <div className="space-y-2">
                        <label>{t('admin.ads.duration')}</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 {t('admin.time.day')}</SelectItem>
                            <SelectItem value="7">7 {t('admin.time.days')}</SelectItem>
                            <SelectItem value="30">30 {t('admin.time.days')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit">{t('common.submit')}</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="moderators">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('admin.moderators.add')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                      e.preventDefault();
                      try {
                        const newUser = await createUser({
                          username: newUsername,
                          password: newPassword,
                          role: 'supervisor',
                          status: 'active',
                          language: 'en'
                        });
                        setUsers([...users, newUser]);
                        setNewUsername('');
                        setNewPassword('');
                      } catch (error) {
                        console.error('Failed to create supervisor:', error);
                      }
                    }}>
                      <div className="space-y-2">
                        <label>{t('admin.moderators.username')}</label>
                        <Input
                          value={newUsername}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUsername(e.target.value)}
                          placeholder={t('admin.moderators.usernamePlaceholder')}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label>{t('admin.moderators.password')}</label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                          placeholder={t('admin.moderators.passwordPlaceholder')}
                          required
                        />
                      </div>
                      <Button type="submit">{t('admin.moderators.create')}</Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
