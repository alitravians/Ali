import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, Heading, FormControl, FormLabel, Input, Textarea, Button, VStack, useToast, Text, Table, Thead, Tbody, Tr, Th, Td, Badge } from '@chakra-ui/react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <ChakraProvider>
      <Router>
        <Box p={4}>
          <Heading as="h1" mb={6}>نموذج طلب الترند</Heading>
          <Routes>
            <Route path="/admin" element={token ? <AdminDashboard /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={token ? <UserDashboard /> : <Navigate to="/login" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login setToken={setToken} />} />
            <Route path="/" element={token ? <RequestForm token={token} /> : <Navigate to="/login" />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bigoId: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post('/register', formData);
      console.log('Registration response:', response);
      toast({
        title: 'تم التسجيل بنجاح',
        description: 'يمكنك الآن تسجيل الدخول',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({ fullName: '', email: '', bigoId: '', password: '' });
      navigate('/login'); // Redirect to login page after successful registration
    } catch (error) {
      console.error('Error registering:', error);
      let errorMessage = 'يرجى المحاولة مرة أخرى';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        title: 'خطأ في التسجيل',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl id="fullName" isRequired>
          <FormLabel>الاسم الثلاثي</FormLabel>
          <Input
            placeholder="الاسم الثلاثي"
            value={formData.fullName}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="email" isRequired>
          <FormLabel>الإيميل</FormLabel>
          <Input
            type="email"
            placeholder="الإيميل"
            value={formData.email}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="bigoId" isRequired>
          <FormLabel>الأيدي في البيقو</FormLabel>
          <Input
            placeholder="الأيدي في البيقو"
            value={formData.bigoId}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="password" isRequired>
          <FormLabel>كلمة المرور</FormLabel>
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={formData.password}
            onChange={handleInputChange}
          />
        </FormControl>
        <Button
          colorScheme="teal"
          type="submit"
          isLoading={isSubmitting}
          loadingText="جاري التسجيل"
        >
          تسجيل
        </Button>
        <Link to="/login">
          <Button colorScheme="blue">تسجيل الدخول</Button>
        </Link>
      </VStack>
    </form>
  );
}

function Login({ setToken }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post('/login', formData);
      console.log('Login response:', response);
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      toast({
        title: 'تم تسجيل الدخول بنجاح',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (error) {
      console.error('Error logging in:', error);
      let errorMessage = 'يرجى المحاولة مرة أخرى';
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl id="email" isRequired>
          <FormLabel>الإيميل</FormLabel>
          <Input
            type="email"
            placeholder="الإيميل"
            value={formData.email}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="password" isRequired>
          <FormLabel>كلمة المرور</FormLabel>
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={formData.password}
            onChange={handleInputChange}
          />
        </FormControl>
        <Button
          colorScheme="teal"
          type="submit"
          isLoading={isSubmitting}
          loadingText="جاري تسجيل الدخول"
        >
          تسجيل الدخول
        </Button>
        <Link to="/register">
          <Button colorScheme="blue">إنشاء حساب جديد</Button>
        </Link>
      </VStack>
    </form>
  );
}

function RequestForm({ token }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bigoId: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/submit', formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Form submission response:', response);
      toast({
        title: 'تم ارسال الطلب للمراجعة',
        description: 'سيتم مراجعة طلبك قريباً',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setFormData({ fullName: '', email: '', bigoId: '', reason: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'خطأ في إرسال الطلب',
        description: 'يرجى المحاولة مرة أخرى لاحقاً',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl id="fullName" isRequired>
          <FormLabel>الاسم الثلاثي</FormLabel>
          <Input
            placeholder="الاسم الثلاثي"
            value={formData.fullName}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="email" isRequired>
          <FormLabel>الإيميل</FormLabel>
          <Input
            type="email"
            placeholder="الإيميل"
            value={formData.email}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="bigoId" isRequired>
          <FormLabel>الأيدي في البيقو</FormLabel>
          <Input
            placeholder="الأيدي في البيقو"
            value={formData.bigoId}
            onChange={handleInputChange}
          />
        </FormControl>
        <FormControl id="reason" isRequired>
          <FormLabel>سبب طلب الترند</FormLabel>
          <Textarea
            placeholder="سبب طلب الترند"
            value={formData.reason}
            onChange={handleInputChange}
          />
        </FormControl>
        <Button
          colorScheme="teal"
          type="submit"
          isLoading={isSubmitting}
          loadingText="جاري الإرسال"
        >
          إرسال الطلب
        </Button>
        <Link to="/admin">
          <Button colorScheme="blue">صفحة الإدارة</Button>
        </Link>
      </VStack>
    </form>
  );
}

function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/admin/requests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
        toast({
          title: 'خطأ في جلب الطلبات',
          description: 'يرجى المحاولة مرة أخرى لاحقاً',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchRequests();
  }, [toast]);

  const handleRequestAction = async (id, action) => {
    try {
      await axios.post(`http://localhost:5000/admin/requests/${id}/${action}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setRequests(requests.map(req =>
        req.id === id ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } : req
      ));
      toast({
        title: `تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      toast({
        title: `خطأ في ${action === 'approve' ? 'قبول' : 'رفض'} الطلب`,
        description: 'يرجى المحاولة مرة أخرى',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>لوحة تحكم الإدارة</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>الاسم</Th>
            <Th>الإيميل</Th>
            <Th>أيدي البيقو</Th>
            <Th>السبب</Th>
            <Th>الحالة</Th>
            <Th>الإجراءات</Th>
          </Tr>
        </Thead>
        <Tbody>
          {requests.map((request) => (
            <Tr key={request.id}>
              <Td>{request.fullName}</Td>
              <Td>{request.email}</Td>
              <Td>{request.bigoId}</Td>
              <Td>{request.reason}</Td>
              <Td>
                <Badge colorScheme={request.status === 'pending' ? 'yellow' : request.status === 'approved' ? 'green' : 'red'}>
                  {request.status === 'pending' ? 'قيد الانتظار' : request.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </Badge>
              </Td>
              <Td>
                {request.status === 'pending' && (
                  <>
                    <Button colorScheme="green" size="sm" onClick={() => handleRequestAction(request.id, 'approve')} mr={2}>
                      قبول
                    </Button>
                    <Button colorScheme="red" size="sm" onClick={() => handleRequestAction(request.id, 'reject')}>
                      رفض
                    </Button>
                  </>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

function UserDashboard() {
  const [requests, setRequests] = useState([]);
  const toast = useToast();

  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/user/requests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching user requests:', error);
        toast({
          title: 'خطأ في جلب الطلبات',
          description: 'يرجى المحاولة مرة أخرى لاحقاً',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchUserRequests();
  }, [toast]);

  return (
    <Box>
      <Heading as="h2" size="lg" mb={4}>لوحة تحكم المستخدم</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>أيدي البيقو</Th>
            <Th>السبب</Th>
            <Th>الحالة</Th>
          </Tr>
        </Thead>
        <Tbody>
          {requests.map((request) => (
            <Tr key={request.id}>
              <Td>{request.bigoId}</Td>
              <Td>{request.reason}</Td>
              <Td>
                <Badge colorScheme={request.status === 'pending' ? 'yellow' : request.status === 'approved' ? 'green' : 'red'}>
                  {request.status === 'pending' ? 'قيد الانتظار' : request.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default App;
