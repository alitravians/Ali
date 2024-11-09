import React, { useState } from 'react';
import { ChakraProvider, Box, VStack, Heading, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import ControlPanel from './ControlPanel';
import LoginBox from './LoginBox';
import LanguageToggle from './LanguageToggle';
import MemberDropdownMenus from './MemberDropdownMenus';
import RegistrationForm from './RegistrationForm';

const adminAccounts = [
  { username: 'admin', password: 'admin' },
  { username: 'reem', password: 'admin' },
  { username: 'Adam', password: 'admin' }
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const login = (username, password) => {
    const admin = adminAccounts.find(account => account.username === username && account.password === password);
    if (admin) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const handleRegistration = (userData) => {
    // Here you would typically send the registration data to your backend
    console.log('Registration data:', userData);
    // For now, we'll just log the user in automatically after registration
    setIsAuthenticated(true);
    setActiveTab(0);
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/admin-login" replace />;
  };

  return (
    <ChakraProvider>
      <I18nextProvider i18n={i18n}>
        <Router>
          <Box p={5}>
            <VStack spacing={5} align="stretch">
              <LanguageToggle />
              <Heading>Trend Request App</Heading>
              <Routes>
                <Route path="/" element={<MemberDropdownMenus />} />
                <Route path="/admin-login" element={<LoginBox login={login} />} />
                <Route path="/admin" element={<ProtectedRoute><ControlPanel /></ProtectedRoute>} />
              </Routes>
            </VStack>
          </Box>
        </Router>
      </I18nextProvider>
    </ChakraProvider>
  );
}

export default App;
