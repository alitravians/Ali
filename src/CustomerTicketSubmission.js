import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Heading,
} from '@chakra-ui/react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const CustomerTicketSubmission = ({ language }) => {
  const [ticket, setTicket] = useState({ title: '', description: '' });
  const toast = useToast();

  const translations = {
    en: {
      pageTitle: 'Submit a New Ticket',
      ticketTitle: 'Ticket Title',
      description: 'Description',
      submit: 'Submit Ticket',
      successMessage: 'Ticket submitted successfully!',
      errorMessage: 'Error submitting ticket. Please try again.',
    },
    ar: {
      pageTitle: 'إرسال تذكرة جديدة',
      ticketTitle: 'عنوان التذكرة',
      description: 'الوصف',
      submit: 'إرسال التذكرة',
      successMessage: 'تم إرسال التذكرة بنجاح!',
      errorMessage: 'حدث خطأ أثناء إرسال التذكرة. يرجى المحاولة مرة أخرى.',
    },
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicket({ ...ticket, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tickets`, { ...ticket, status: 'open' });
      toast({
        title: translations[language].successMessage,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTicket({ title: '', description: '' });
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast({
        title: translations[language].errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={5}>
      <Heading mb={5}>{translations[language].pageTitle}</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4} align="stretch">
          <FormControl isRequired>
            <FormLabel>{translations[language].ticketTitle}</FormLabel>
            <Input
              name="title"
              value={ticket.title}
              onChange={handleInputChange}
              placeholder={translations[language].ticketTitle}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{translations[language].description}</FormLabel>
            <Textarea
              name="description"
              value={ticket.description}
              onChange={handleInputChange}
              placeholder={translations[language].description}
            />
          </FormControl>
          <Button type="submit" colorScheme="blue">
            {translations[language].submit}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default CustomerTicketSubmission;
