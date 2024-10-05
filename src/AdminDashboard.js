import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import axios from 'axios';
import CountdownTimer from './CountdownTimer';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const AdminDashboard = ({ language }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);
  const toast = useToast();

  const translations = {
    en: {
      title: 'Admin Dashboard',
      ticketList: 'Ticket List',
      code: 'Code',
      ticketTitle: 'Title',
      status: 'Status',
      actions: 'Actions',
      open: 'Open',
      inProgress: 'In Progress',
      closed: 'Closed',
      respond: 'Respond',
      close: 'Close Ticket',
      responseLabel: 'Your Response',
      submitResponse: 'Submit Response',
      ticketClosed: 'Ticket closed successfully',
      responseSubmitted: 'Response submitted successfully',
      error: 'An error occurred. Please try again.',
      toggleCountdown: 'Toggle Countdown',
    },
    ar: {
      title: 'لوحة تحكم الإدارة',
      ticketList: 'قائمة التذاكر',
      code: 'الرمز',
      ticketTitle: 'العنوان',
      status: 'الحالة',
      actions: 'الإجراءات',
      open: 'مفتوح',
      inProgress: 'قيد التنفيذ',
      closed: 'مغلق',
      respond: 'الرد',
      close: 'إغلاق التذكرة',
      responseLabel: 'ردك',
      submitResponse: 'إرسال الرد',
      ticketClosed: 'تم إغلاق التذكرة بنجاح',
      responseSubmitted: 'تم إرسال الرد بنجاح',
      error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      toggleCountdown: 'تبديل العد التنازلي',
    },
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets`);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { ...tickets.find(t => t.id === id), status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRespond = async (ticketId) => {
    try {
      await axios.post(`${API_URL}/tickets/${ticketId}/respond`, { response });
      fetchTickets();
      setResponse('');
      setSelectedTicket(null);
      toast({
        title: translations[language].responseSubmitted,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error responding to ticket:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      await updateTicketStatus(ticketId, 'closed');
      fetchTickets();
      toast({
        title: translations[language].ticketClosed,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <Heading>{translations[language].title}</Heading>
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
                  <Tr color={ticket.status === 'closed' ? 'red.500' : 'inherit'}>
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
                            {translations[language].submitResponse}
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
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
            {translations[language].actions}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => setShowCountdown(!showCountdown)}>
              {translations[language].toggleCountdown}
            </MenuItem>
          </MenuList>
        </Menu>
        {showCountdown && (
          <CountdownTimer
            targetDate={new Date().getTime() + 24 * 60 * 60 * 1000} // 24 hours from now
            message="Countdown finished!"
            onClose={() => setShowCountdown(false)}
          />
        )}
      </VStack>
    </Box>
  );
};

export default AdminDashboard;
