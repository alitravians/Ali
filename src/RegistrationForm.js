// هذا المكون يعرض نموذج التسجيل
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Select,
  useToast,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const RegistrationForm = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bigoId, setBigoId] = useState('');
  const [membershipType, setMembershipType] = useState('basic');
  const toast = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log({ name, email, password, bigoId, membershipType });
    toast({
      title: t('Registration Submitted'),
      description: t("We've received your registration request."),
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box maxWidth="400px" margin="auto" mt={8}>
      <Heading mb={4}>{t('Registration')}</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>{t('Name')}</FormLabel>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('Email')}</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('Password')}</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('Bigo ID')}</FormLabel>
            <Input
              type="text"
              value={bigoId}
              onChange={(e) => setBigoId(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('Membership Type')}</FormLabel>
            <Select
              value={membershipType}
              onChange={(e) => setMembershipType(e.target.value)}
            >
              <option value="basic">{t('Basic')}</option>
              <option value="premium">{t('Premium')}</option>
            </Select>
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">
            {t('Submit')}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default RegistrationForm;
