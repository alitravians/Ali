// هذا المكون يعرض نموذج طلب ترند جديد
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  useToast,
  Select,
  Text,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const TrendRequestForm = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [bigoId, setBigoId] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const toast = useToast();

  const generateTicketCode = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${randomStr}`.toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newTicketCode = generateTicketCode();
    setTicketCode(newTicketCode);

    // Here you would typically send the trend request to your backend
    // This is a placeholder and should be replaced with actual API call
    try {
      // const response = await fetch('/api/trend-requests', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, bigoId, email, reason, preferredTime, ticketCode: newTicketCode }),
      // });
      // if (response.ok) {
        toast({
          title: t('Trend Request Submitted'),
          description: t("We've received your trend request. Your ticket code is: ") + newTicketCode,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Reset form fields
        setName('');
        setBigoId('');
        setEmail('');
        setReason('');
        setPreferredTime('');
      // } else {
      //   throw new Error('Failed to submit trend request');
      // }
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('Failed to submit trend request. Please try again.'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const timeOptions = [];
  for (let hour = 12; hour <= 26; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const formattedHour = hour % 24;
      const time = `${formattedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
    if (hour === 26) break;
  }

  return (
    <Box maxWidth="400px" margin="auto" mt={8}>
      <Heading size="md" mb={4}>{t('New Trend Request Form')}</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>{t('الاسم (Name)')}</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('Enter your name')}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('الايدي في البيقو (Bigo ID)')}</FormLabel>
            <Input
              type="text"
              value={bigoId}
              onChange={(e) => setBigoId(e.target.value)}
              placeholder={t('Enter your Bigo ID')}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('الايميل (Email)')}</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('Enter your email')}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('سبب حجز الترند (Reason for trend reservation)')}</FormLabel>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('Enter reason for trend reservation')}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('الوقت المفضل (Preferred time)')}</FormLabel>
            <Select
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              placeholder={t('Select preferred time')}
            >
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </Select>
          </FormControl>
          <Text fontSize="sm" color="gray.500">
            {t('Note: The trend date will be for the following day')}
          </Text>
          <Button type="submit" colorScheme="blue" width="full">
            {t('Submit New Trend Request')}
          </Button>
        </VStack>
      </form>
      {ticketCode && (
        <Text mt={4} fontWeight="bold">
          {t('Your ticket code')}: {ticketCode}
        </Text>
      )}
    </Box>
  );
};

export default TrendRequestForm;
