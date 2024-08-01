import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, VStack, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const LoginBox = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useTranslation();
  const toast = useToast();

  const handleLogin = (e) => {
    e.preventDefault();
    // Here you would typically handle the login logic
    if (username === 'admin' && password === 'admin') {
      onLogin(username, password);
      console.log('Login attempt:', { username, password });
      toast({
        title: t('Login Successful'),
        description: t('You have successfully logged in.'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: t('Login Failed'),
        description: t('Invalid username or password.'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxWidth="300px" margin="auto">
      <form onSubmit={handleLogin}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>{t('Username')}</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('Enter your username')}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>{t('Password')}</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Enter your password')}
            />
          </FormControl>
          <Button type="submit" colorScheme="blue" width="full">
            {t('Login')}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};

export default LoginBox;
