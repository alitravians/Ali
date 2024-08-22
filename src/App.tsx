import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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
  Icon,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  extendTheme,
} from '@chakra-ui/react';
import { FaCog, FaClipboard } from 'react-icons/fa';
import AdminPanel from './AdminPanel';

interface Submission {
  id: string;
  agencyName: string;
  agencyNumber: string;
  requestDate: string;
  requestTime: string;
  creatorId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

const generateTimeOptions = () => {
  const options = [];
  for (let hour = 12; hour <= 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push(<option key={time} value={time}>{time}</option>);
    }
  }
  for (let hour = 1; hour <= 2; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      options.push(<option key={time} value={time}>{time}</option>);
    }
  }
  return options;
};

function App() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    agencyName: '',
    agencyNumber: '',
    requestDate: '',
    requestTime: '',
    creatorId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      console.error('خطأ في جلب حالة الموقع:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          title: "تم إرسال النموذج بنجاح",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setFormData({
          agencyName: '',
          agencyNumber: '',
          requestDate: '',
          requestTime: '',
          creatorId: '',
        });
      } else {
        throw new Error('استجابة الخادم غير صحيحة');
      }
    } catch (error) {
      console.error('خطأ في إرسال النموذج:', error);
      toast({
        title: "خطأ في إرسال النموذج",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageError = () => {
    console.error('خطأ في تحميل شعار الوكالة');
    toast({
      title: "خطأ في تحميل شعار الوكالة",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
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
          title: isSiteEnabled ? "تم تعطيل الموقع" : "تم تفعيل الموقع",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('فشل في تبديل حالة الموقع');
      }
    } catch (error) {
      console.error('خطأ في تبديل حالة الموقع:', error);
      toast({
        title: "خطأ في تبديل حالة الموقع",
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
          title: "تم تحديث الرسالة المخصصة",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('فشل في تحديث الرسالة المخصصة');
      }
    } catch (error) {
      console.error('خطأ في تحديث الرسالة المخصصة:', error);
      toast({
        title: "خطأ في تحديث الرسالة المخصصة",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const [approvedTrends, setApprovedTrends] = useState<Submission[]>([]);
  const [rejectedTrends, setRejectedTrends] = useState<Submission[]>([]);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const response = await fetch('http://localhost:3001/submissions');
      if (response.ok) {
        const data: Submission[] = await response.json();
        setApprovedTrends(data.filter(submission => submission.status === 'approved'));
        setRejectedTrends(data.filter(submission => submission.status === 'rejected'));
      } else {
        throw new Error('فشل في جلب الاتجاهات');
      }
    } catch (error) {
      console.error('خطأ في جلب الاتجاهات:', error);
      toast({
        title: 'خطأ في جلب الاتجاهات',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const ApprovedTrendsTable = () => (
    <Table variant="simple" colorScheme="green">
      <Thead>
        <Tr>
          <Th>اسم الوكالة</Th>
          <Th>رقم الوكالة</Th>
          <Th>تاريخ/وقت الطلب</Th>
          <Th>معرف المنشئ</Th>
          <Th>رسالة الإدارة</Th>
        </Tr>
      </Thead>
      <Tbody>
        {approvedTrends.map((trend) => (
          <Tr key={trend.id}>
            <Td>{trend.agencyName}</Td>
            <Td>{trend.agencyNumber}</Td>
            <Td>{`${trend.requestDate} ${trend.requestTime}`}</Td>
            <Td>{trend.creatorId}</Td>
            <Td>{trend.reason}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  const RejectedTrendsTable = () => (
    <Table variant="simple" colorScheme="red">
      <Thead>
        <Tr>
          <Th>اسم الوكالة</Th>
          <Th>رقم الوكالة</Th>
          <Th>تاريخ/وقت الطلب</Th>
          <Th>معرف المنشئ</Th>
          <Th>رسالة الإدارة</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rejectedTrends.map((trend) => (
          <Tr key={trend.id}>
            <Td>{trend.agencyName}</Td>
            <Td>{trend.agencyNumber}</Td>
            <Td>{`${trend.requestDate} ${trend.requestTime}`}</Td>
            <Td>{trend.creatorId}</Td>
            <Td>{trend.reason}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  return (
    <ChakraProvider theme={extendTheme({ direction: 'rtl' })}>
      <Box maxWidth="1200px" margin="auto" mt={8}>
        <VStack spacing={6}>
          <HStack spacing={4} alignSelf="flex-start">
            <Button
              as={Link}
              to={location.pathname === "/admin" ? "/" : "/admin"}
              colorScheme="teal"
              size="md"
              rightIcon={<Icon as={location.pathname === "/admin" ? FaClipboard : FaCog} />}
            >
              {location.pathname === "/admin" ? "عرض النموذج" : "لوحة الإدارة"}
            </Button>
          </HStack>
          <Routes>
            <Route path="/" element={
              <>
                {isSiteEnabled ? (
                  <>
                    <Image
                      src='/agency-logo.jpg'
                      alt="شعار نموذج طلب الاتجاه"
                      boxSize="150px"
                      objectFit="contain"
                      fallback={<Box width="150px" height="150px" bg="gray.200" />}
                      onError={handleImageError}
                    />
                    <form onSubmit={handleSubmit}>
                      <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                          <FormLabel>اسم الوكالة</FormLabel>
                          <Input
                            name="agencyName"
                            value={formData.agencyName}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>رقم الوكالة الفريد</FormLabel>
                          <Input
                            name="agencyNumber"
                            value={formData.agencyNumber}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>تاريخ طلب الاتجاه</FormLabel>
                          <Input
                            name="requestDate"
                            type="date"
                            value={formData.requestDate}
                            onChange={handleInputChange}
                          />
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>وقت طلب الاتجاه</FormLabel>
                          <Select
                            name="requestTime"
                            value={formData.requestTime}
                            onChange={handleInputChange}
                          >
                            {generateTimeOptions()}
                          </Select>
                        </FormControl>
                        <FormControl isRequired>
                          <FormLabel>معرف منشئ المحتوى</FormLabel>
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
                          loadingText="جاري الإرسال"
                        >
                          إرسال
                        </Button>
                      </VStack>
                    </form>
                    <Heading as="h2" size="lg" mt={8}>الاتجاهات المعتمدة</Heading>
                    <ApprovedTrendsTable />
                    <Heading as="h2" size="lg" mt={8}>الاتجاهات المرفوضة</Heading>
                    <RejectedTrendsTable />
                  </>
                ) : (
                  <Text fontSize="xl" fontWeight="bold" textAlign="center">
                    {customMessage || "هذا الموقع معطل حاليًا."}
                  </Text>
                )}
              </>
            } />
            <Route path="/admin" element={
              <>
                <AdminPanel />
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="site-toggle" mb="0">
                    تفعيل الموقع
                  </FormLabel>
                  <Switch
                    id="site-toggle"
                    isChecked={isSiteEnabled}
                    onChange={toggleSiteEnabled}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>رسالة التعطيل المخصصة</FormLabel>
                  <Input
                    value={customMessage}
                    onChange={(e) => updateCustomMessage(e.target.value)}
                    placeholder="أدخل رسالة مخصصة للموقع المعطل"
                  />
                </FormControl>
              </>
            } />
          </Routes>
        </VStack>
      </Box>
    </ChakraProvider>
  );
}

export default App;
