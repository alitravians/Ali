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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const TrendRequestForm = ({ showNotification }) => {
  const { t } = useTranslation();
  const [trendName, setTrendName] = useState('');
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the trend request to your backend
    console.log({ trendName });
    toast({
      title: t('Trend Request Submitted'),
      description: t("We've received your trend request."),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    setTrendName('');
  };

  return (
    <Box maxWidth="400px" margin="auto" mt={8}>
      <Heading size="md" mb={4}>{t('New Trend Request Form')}</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>{t('Trend Name')}</FormLabel>
            <Input
              type="text"
              value={trendName}
              onChange={(e) => setTrendName(e.target.value)}
              placeholder={t('Enter trend name')}
            />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">
            {t('Submit New Trend Request')}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default TrendRequestForm;
