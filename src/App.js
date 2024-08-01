import React, { useState } from 'react';
import { ChakraProvider, Box, VStack, Heading, Flex, useColorModeValue } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import RegistrationForm from './RegistrationForm';
import ControlPanel from './ControlPanel';
import TrendRequestForm from './TrendRequestForm';
import NotificationSystem from './NotificationSystem';
import LanguageToggle from './LanguageToggle';
import LoginBox from './LoginBox';

function App() {
  const { showNotification } = NotificationSystem();
  const { t } = useTranslation();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (username, password) => {
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
      showNotification('success', t('Login successful'));
    } else {
      showNotification('error', t('Invalid username or password'));
    }
  };

  return (
    <ChakraProvider>
      <Box textAlign="center" fontSize="xl" p={5} bg={bgColor} minHeight="100vh">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          {!isLoggedIn && <LoginBox onLogin={handleLogin} />} {/* Only show LoginBox when not logged in */}
          <LanguageToggle />
        </Flex>
        <VStack spacing={8}>
          <Heading>{t('Trend Request App')}</Heading>
          <TrendRequestForm showNotification={showNotification} />
          {!isLoggedIn && <RegistrationForm />} {/* Only show RegistrationForm when not logged in */}
          {isLoggedIn && <ControlPanel showNotification={showNotification} />} {/* Conditionally render ControlPanel */}
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
