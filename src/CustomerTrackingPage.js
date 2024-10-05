import React, { useState } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  Text,
  Heading,
  useToast,
  Container,
  Divider,
} from '@chakra-ui/react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

const translations = {
  en: {
    title: 'Customer Ticket Tracking',
    enterTicketNumber: 'Enter your ticket number',
    trackTicket: 'Track Ticket',
    ticketDetails: 'Ticket Details',
    ticketNumber: 'Ticket Number',
    status: 'Status',
    description: 'Description',
    responses: 'Responses',
    noResponses: 'No responses yet.',
    errorTracking: 'Error tracking ticket. Please try again.',
    invalidTicket: 'Invalid ticket number. Please check and try again.',
  },
  ar: {
    title: 'تتبع تذاكر العملاء',
    enterTicketNumber: 'أدخل رقم التذكرة الخاص بك',
    trackTicket: 'تتبع التذكرة',
    ticketDetails: 'تفاصيل التذكرة',
    ticketNumber: 'رقم التذكرة',
    status: 'الحالة',
    description: 'الوصف',
    responses: 'الردود',
    noResponses: 'لا توجد ردود حتى الآن.',
    errorTracking: 'خطأ في تتبع التذكرة. يرجى المحاولة مرة أخرى.',
    invalidTicket: 'رقم تذكرة غير صالح. يرجى التحقق والمحاولة مرة أخرى.',
  },
};

const CustomerTrackingPage = ({ language }) => {
  const [ticketNumber, setTicketNumber] = useState('');
  const [ticketDetails, setTicketDetails] = useState(null);
  const toast = useToast();

  const handleTrackTicket = async () => {
    try {
      const response = await axios.get(`${API_URL}/tickets/code/${ticketNumber}`);
      setTicketDetails(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        toast({
          title: translations[language].invalidTicket,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: translations[language].errorTracking,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading textAlign="center">{translations[language].title}</Heading>
        <Box>
          <Input
            placeholder={translations[language].enterTicketNumber}
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
          />
          <Button mt={2} onClick={handleTrackTicket} colorScheme="blue" width="full">
            {translations[language].trackTicket}
          </Button>
        </Box>
        {ticketDetails && (
          <Box borderWidth={1} borderRadius="lg" p={4}>
            <Heading size="md" mb={4}>
              {translations[language].ticketDetails}
            </Heading>
            <Text>
              <strong>{translations[language].ticketNumber}:</strong> {ticketDetails.code}
            </Text>
            <Text>
              <strong>{translations[language].status}:</strong> {ticketDetails.status}
            </Text>
            <Text>
              <strong>{translations[language].description}:</strong> {ticketDetails.description}
            </Text>
            <Divider my={4} />
            <Heading size="sm" mb={2}>
              {translations[language].responses}
            </Heading>
            {ticketDetails.responses && ticketDetails.responses.length > 0 ? (
              ticketDetails.responses.map((response, index) => (
                <Text key={index} mb={2}>
                  {response}
                </Text>
              ))
            ) : (
              <Text>{translations[language].noResponses}</Text>
            )}
            {ticketDetails.status !== 'closed' && (
              <Box mt={4}>
                <Input
                  placeholder={translations[language].enterResponse}
                  isDisabled={ticketDetails.status === 'closed'}
                />
                <Button
                  mt={2}
                  colorScheme="blue"
                  isDisabled={ticketDetails.status === 'closed'}
                >
                  {translations[language].sendResponse}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default CustomerTrackingPage;
