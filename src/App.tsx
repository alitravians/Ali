import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Image,
  Heading,
  Text,
  useToast,
  HStack,
  Switch,
} from '@chakra-ui/react';
import AdminPanel from './AdminPanel';

function App() {
  const [formData, setFormData] = useState({
    agencyName: '',
    agencyNumber: '',
    requestDate: '',
    creatorId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSiteEnabled, setIsSiteEnabled] = useState(true);
  const [customMessage, setCustomMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchSiteStatus();
  }, []);

  const fetchSiteStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/site-status');
      if (response.ok) {
        const { isEnabled, customMessage } = await response.json();
        setIsSiteEnabled(isEnabled);
        setCustomMessage(customMessage);
      }
    } catch (error) {
      console.error('Error fetching site status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Form submitted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setFormData({
          agencyName: '',
          agencyNumber: '',
          requestDate: '',
          creatorId: '',
        });
      } else {
        throw new Error('Server response was not ok');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error submitting form",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageError = () => {
    console.error('Error loading agency logo');
    toast({
      title: "Error loading agency logo",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  };

  const toggleView = () => {
    setShowAdminPanel(!showAdminPanel);
  };

  const toggleSiteEnabled = async () => {
    try {
      const response = await fetch('http://localhost:3001/site-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled: !isSiteEnabled }),
      });
      if (response.ok) {
        setIsSiteEnabled(!isSiteEnabled);
        toast({
          title: isSiteEnabled ? "Site disabled" : "Site enabled",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to toggle site status');
      }
    } catch (error) {
      console.error('Error toggling site status:', error);
      toast({
        title: "Error toggling site status",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateCustomMessage = async (message: string) => {
    try {
      const response = await fetch('http://localhost:3001/site-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      if (response.ok) {
        setCustomMessage(message);
        toast({
          title: "Custom message updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update custom message');
      }
    } catch (error) {
      console.error('Error updating custom message:', error);
      toast({
        title: "Error updating custom message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <ChakraProvider>
      <Box maxWidth={showAdminPanel ? "800px" : "500px"} margin="auto" mt={8}>
        <VStack spacing={6}>
          <HStack spacing={4}>
            <Heading as="h1" size="xl">
              {showAdminPanel ? "Admin Panel" : "Trend Request Form"}
            </Heading>
            <Button onClick={toggleView}>
              {showAdminPanel ? "Show Form" : "Show Admin Panel"}
            </Button>
          </HStack>
          {showAdminPanel ? (
            <>
              <AdminPanel />
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="site-toggle" mb="0">
                  Enable Site
                </FormLabel>
                <Switch
                  id="site-toggle"
                  isChecked={isSiteEnabled}
                  onChange={toggleSiteEnabled}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Custom Disabled Message</FormLabel>
                <Input
                  value={customMessage}
                  onChange={(e) => updateCustomMessage(e.target.value)}
                  placeholder="Enter custom message for disabled site"
                />
              </FormControl>
            </>
          ) : isSiteEnabled ? (
            <>
              <Image
                src='/agency-logo.jpg'
                alt="Trend Request Form Agency Logo"
                boxSize="150px"
                objectFit="contain"
                fallback={<Box width="150px" height="150px" bg="gray.200" />}
                onError={handleImageError}
              />
              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Agency Name</FormLabel>
                    <Input
                      name="agencyName"
                      value={formData.agencyName}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Unique Agency Number</FormLabel>
                    <Input
                      name="agencyNumber"
                      value={formData.agencyNumber}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Trend Request Date</FormLabel>
                    <Input
                      name="requestDate"
                      type="date"
                      value={formData.requestDate}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Content Creator ID</FormLabel>
                    <Input
                      name="creatorId"
                      value={formData.creatorId}
                      onChange={handleInputChange}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    isLoading={isSubmitting}
                    loadingText="Submitting"
                  >
                    Submit
                  </Button>
                </VStack>
              </form>
            </>
          ) : (
            <Text fontSize="xl" fontWeight="bold" textAlign="center">
              {customMessage || "This site is currently disabled."}
            </Text>
          )}
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
