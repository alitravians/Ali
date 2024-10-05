import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, VStack, Heading, Input, Textarea, Button, Select, Table, Thead, Tbody, Tr, Th, Td, Flex, HStack, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CustomerTrackingPage from './CustomerTrackingPage';
import CustomerTicketSubmission from './CustomerTicketSubmission';
import SectionManagement from './SectionManagement';
import AdminDashboard from './AdminDashboard';

const API_URL = 'http://localhost:8000';  // Updated to use the local backend URL for testing
function App() {
  const [tickets, setTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', status: 'open' });

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    ws.onmessage = (event) => {
      console.log('Received message:', event.data);
      fetchTickets(); // Refresh tickets when a new update is received
    };
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTimeout(setupWebSocket, 5000); // Attempt to reconnect after 5 seconds
    };
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setTimeout(setupWebSocket, 5000); // Attempt to reconnect after 5 seconds
    };

    return () => {
      ws.close();
    };
  };

  useEffect(() => {
    fetchTickets();
    setupWebSocket();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };
  const createTicket = async () => {
    try {
      await axios.post(`${API_URL}/tickets`, newTicket);
      setNewTicket({ title: '', description: '', status: 'open' });
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { ...tickets.find(t => t.id === id), status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const [language, setLanguage] = useState('en');
  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en');

  const translations = {
    en: {
      title: 'Customer Ticket System',
      createTicket: 'Create New Ticket',
      ticketTitle: 'Title',
      description: 'Description',
      status: 'Status',
      open: 'Open',
      inProgress: 'In Progress',
      closed: 'Closed',
      create: 'Create Ticket',
      ticketList: 'Ticket List',
      id: 'ID',
      actions: 'Actions',
      respond: 'Respond',
      close: 'Close Ticket',
      responseLabel: 'Your Response',
      settings: 'Settings',
      language: 'Language',
      trackTicket: 'Track Ticket',
    },
    ar: {
      title: 'نظام تذاكر العملاء',
      createTicket: 'إنشاء تذكرة جديدة',
      ticketTitle: 'العنوان',
      description: 'الوصف',
      status: 'الحالة',
      open: 'مفتوح',
      inProgress: 'قيد التنفيذ',
      closed: 'مغلق',
      create: 'إنشاء التذكرة',
      ticketList: 'قائمة التذاكر',
      id: 'الرقم التعريفي',
      actions: 'الإجراءات',
      respond: 'الرد',
      close: 'إغلاق التذكرة',
      responseLabel: 'ردك',
      settings: 'الإعدادات',
      language: 'اللغة',
      trackTicket: 'تتبع التذكرة',
    },
  };

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');

  const handleRespond = async (ticketId) => {
    try {
      await axios.post(`${API_URL}/tickets/${ticketId}/respond`, { response });
      fetchTickets();
      setResponse('');
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error responding to ticket:', error);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      await updateTicketStatus(ticketId, 'closed');
      fetchTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  return (
    <Router>
      <ChakraProvider>
        <Box p={5}>
          <VStack spacing={5} align="stretch">
            <Flex justifyContent="space-between" alignItems="center">
              <Heading>{translations[language].title}</Heading>
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                  {translations[language].settings}
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={toggleLanguage}>
                    {translations[language].language}: {language === 'en' ? 'English' : 'العربية'}
                  </MenuItem>
                  <MenuItem as={Link} to="/customer-tracking">
                    {translations[language].trackTicket}
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>

            <Routes>
              <Route path="/" element={
                <>
                  <Box>
                    <Heading size="md">{translations[language].createTicket}</Heading>
                    <Input
                      placeholder={translations[language].ticketTitle}
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                    />
                    <Textarea
                      placeholder={translations[language].description}
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                    />
                    <Select
                      value={newTicket.status}
                      onChange={(e) => setNewTicket({...newTicket, status: e.target.value})}
                    >
                      <option value="open">{translations[language].open}</option>
                      <option value="in_progress">{translations[language].inProgress}</option>
                      <option value="closed">{translations[language].closed}</option>
                    </Select>
                    <Button onClick={createTicket}>{translations[language].create}</Button>
                  </Box>

                  <Box>
                    <Heading size="md">{translations[language].ticketList}</Heading>
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>{translations[language].code}</Th>
                          <Th>{translations[language].ticketTitle}</Th>
                          <Th>{translations[language].status}</Th>
                          <Th>{translations[language].actions}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {tickets.map((ticket) => (
                          <React.Fragment key={ticket.id}>
                            <Tr>
                              <Td>{ticket.code}</Td>
                              <Td>{ticket.title}</Td>
                              <Td>{translations[language][ticket.status]}</Td>
                              <Td>
                                <HStack spacing={2}>
                                  <Menu>
                                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                      {translations[language].actions}
                                    </MenuButton>
                                    <MenuList>
                                      <MenuItem onClick={() => updateTicketStatus(ticket.id, 'open')}>
                                        {translations[language].open}
                                      </MenuItem>
                                      <MenuItem onClick={() => updateTicketStatus(ticket.id, 'in_progress')}>
                                        {translations[language].inProgress}
                                      </MenuItem>
                                      <MenuItem onClick={() => updateTicketStatus(ticket.id, 'closed')}>
                                        {translations[language].closed}
                                      </MenuItem>
                                      <MenuItem onClick={() => setSelectedTicket(ticket.id)}>
                                        {translations[language].respond}
                                      </MenuItem>
                                      <MenuItem onClick={() => handleCloseTicket(ticket.id)}>
                                        {translations[language].close}
                                      </MenuItem>
                                    </MenuList>
                                  </Menu>
                                </HStack>
                              </Td>
                            </Tr>
                            {selectedTicket === ticket.id && (
                              <Tr>
                                <Td colSpan={4}>
                                  <VStack align="stretch">
                                    <Textarea
                                      placeholder={translations[language].responseLabel}
                                      value={response}
                                      onChange={(e) => setResponse(e.target.value)}
                                    />
                                    <Button onClick={() => handleRespond(ticket.id)}>
                                      {translations[language].respond}
                                    </Button>
                                  </VStack>
                                </Td>
                              </Tr>
                            )}
                          </React.Fragment>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </>
              } />
              <Route path="/customer-tracking" element={<CustomerTrackingPage language={language} />} />
              <Route path="/submit" element={<CustomerTicketSubmission language={language} />} />
              <Route path="/admin-dashboard" element={<AdminDashboard language={language} />} />
            </Routes>
          </VStack>
        </Box>
      </ChakraProvider>
    </Router>
  );
}

export default App;
