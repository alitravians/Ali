import React, { useState } from 'react';
import { Box, VStack, Heading, Input, Button, Text, useToast, Badge } from "@chakra-ui/react";
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function CustomerTracking({ language }) {
  const [ticketCode, setTicketCode] = useState('');
  const [ticket, setTicket] = useState(null);
  const toast = useToast();

  const translations = {
    en: {
      title: 'Track Your Ticket',
      enterCode: 'Enter your ticket code',
      trackButton: 'Track Ticket',
      ticketDetails: 'Ticket Details',
      ticketTitle: 'Title',
      ticketDescription: 'Description',
      ticketStatus: 'Status',
      responses: 'Responses',
      noTicket: 'No ticket found with this code.',
      errorTracking: 'Error tracking ticket. Please try again.',
    },
    ar: {
      title: 'تتبع تذكرتك',
      enterCode: 'أدخل رمز التذكرة',
      trackButton: 'تتبع التذكرة',
      ticketDetails: 'تفاصيل التذكرة',
      ticketTitle: 'العنوان',
      ticketDescription: 'الوصف',
      ticketStatus: 'الحالة',
      responses: 'الردود',
      noTicket: 'لم يتم العثور على تذكرة بهذا الرمز.',
      errorTracking: 'خطأ في تتبع التذكرة. يرجى المحاولة مرة أخرى.',
    },
  };

  const trackTicket = async () => {
    console.log('trackTicket function called');
    try {
      console.log('Before API call, ticketCode:', ticketCode);
      const response = await axios.get(`${API_URL}/tickets/code/${ticketCode}`);
      console.log('API Response:', response.data);
      if (response.data) {
        console.log('Before setting ticket state:', ticket);
        setTicket(response.data);
        console.log('After setting ticket state:', response.data);
        console.log('Ticket Status:', response.data.status);
        console.log('Is ticket closed?', response.data.status.toLowerCase() === 'closed');
        console.log('Badge component should render with color:', response.data.status.toLowerCase() === 'closed' ? 'red' : 'green');
      } else {
        console.log('No ticket found');
        toast({
          title: translations[language].noTicket,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error tracking ticket:', error);
      console.log('Error details:', error.response ? error.response.data : error.message);
      toast({
        title: translations[language].errorTracking,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    console.log('Current ticket state after API call:', ticket);
    console.log('Component should re-render with updated ticket state');
  };

  useEffect(() => {
    console.log('useEffect triggered, current ticket state:', ticket);
    if (ticket) {
      console.log('Ticket status:', ticket.status);
      console.log('Is ticket closed?', ticket.status.toLowerCase() === 'closed');
    }
  }, [ticket]);

  console.log('Current ticket state:', ticket);
  console.log('Rendering Badge component:', ticket ? `Status: ${ticket.status}, Color: ${ticket.status.toLowerCase() === 'closed' ? 'red' : 'green'}` : 'No ticket');

  return (
    <Box p={5}>
      <VStack spacing={5} align="stretch">
        <Heading>{translations[language].title}</Heading>
        <Input
          placeholder={translations[language].enterCode}
          value={ticketCode}
          onChange={(e) => setTicketCode(e.target.value)}
        />
        <Button onClick={trackTicket}>{translations[language].trackButton}</Button>

        {ticket && (
          <Box borderWidth="1px" borderRadius="lg" p={4} mt={4}
               backgroundColor={ticket.status.toLowerCase() === 'closed' ? 'red.100' : 'white'}>
            <Heading size="md" mb={3}>{translations[language].ticketDetails}</Heading>
            <Text mb={2}><strong>{translations[language].ticketTitle}:</strong> {ticket.title}</Text>
            <Text mb={2}><strong>{translations[language].ticketDescription}:</strong> {ticket.description}</Text>
            <Text mb={2}>
              <strong>{translations[language].ticketStatus}:</strong>{' '}
              <Badge
                colorScheme={ticket.status.toLowerCase() === 'closed' ? 'red' : 'green'}
                ml={2}
                variant="solid"
              >
                {ticket.status}
              </Badge>
            </Text>
            <Text mt={4} mb={2}><strong>{translations[language].responses}:</strong></Text>
            {ticket.responses && ticket.responses.length > 0 ? (
              ticket.responses.map((response, index) => (
                <Text key={index} ml={4}>{response}</Text>
              ))
            ) : (
              <Text ml={4}>No responses yet.</Text>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
}

export default CustomerTracking;
