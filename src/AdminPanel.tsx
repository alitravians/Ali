import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react';

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

function AdminPanel() {
  const [approvedSubmissions, setApprovedSubmissions] = useState<Submission[]>([]);
  const [rejectedSubmissions, setRejectedSubmissions] = useState<Submission[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const toast = useToast();

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:3001/submissions');
      if (response.ok) {
        const data: Submission[] = await response.json();
        const approvedSubmissions = data.filter(submission => submission.status === 'approved');
        const rejectedSubmissions = data.filter(submission => submission.status === 'rejected');
        const pendingSubmissions = data.filter(submission => submission.status === 'pending');
        setApprovedSubmissions(approvedSubmissions);
        setRejectedSubmissions(rejectedSubmissions);
        setPendingSubmissions(pendingSubmissions);
      } else {
        throw new Error('فشل في جلب الطلبات');
      }
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
      toast({
        title: 'خطأ في جلب الطلبات',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, reason: string) => {
    try {
      console.log('الموافقة على الطلب برقم:', id);
      if (!id) {
        throw new Error('رقم الطلب غير صالح');
      }
      const response = await fetch(`http://localhost:3001/submissions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `فشل في الموافقة على الطلب. الحالة: ${response.status}`);
      }

      const responseData = await response.json();
      const approvedSubmission = responseData.submission;

      if (approvedSubmission) {
        setApprovedSubmissions(prevApproved => [...prevApproved, approvedSubmission]);
        setPendingSubmissions(prevPending => prevPending.filter(sub => sub.id !== id));
        toast({
          title: 'تمت الموافقة على الطلب',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(`لم يتم العثور على الطلب الموافق عليه برقم ${id} في استجابة الخادم`);
      }
    } catch (error) {
      console.error('خطأ في الموافقة على الطلب:', error);
      toast({
        title: 'خطأ في الموافقة على الطلب',
        status: 'error',
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      console.log('رفض الطلب برقم:', id);
      if (!id) {
        throw new Error('رقم الطلب غير صالح');
      }
      const response = await fetch(`http://localhost:3001/submissions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `فشل في رفض الطلب. الحالة: ${response.status}`);
      }

      const responseData = await response.json();
      const rejectedSubmission = responseData.submission;

      if (rejectedSubmission) {
        setRejectedSubmissions(prevRejected => [...prevRejected, rejectedSubmission]);
        setPendingSubmissions(prevPending => prevPending.filter(sub => sub.id !== id));
        toast({
          title: 'تم رفض الطلب',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.warn(`لم يتم العثور على الطلب المرفوض برقم ${id} في استجابة الخادم`);
      }
    } catch (error) {
      console.error('خطأ في رفض الطلب:', error);
      toast({
        title: 'خطأ في رفض الطلب',
        status: 'error',
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openModal = (id: string, action: 'approve' | 'reject') => {
    setSelectedSubmission(id);
    setActionType(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSubmission(null);
    setActionType(null);
    setIsModalOpen(false);
    setReason('');
  };

  const handleAction = () => {
    if (selectedSubmission !== null && actionType && reason) {
      console.log(`معالجة ${actionType === 'approve' ? 'الموافقة' : 'الرفض'} للطلب رقم: ${selectedSubmission}`);
      if (actionType === 'approve') {
        handleApprove(selectedSubmission, reason);
      } else {
        handleReject(selectedSubmission, reason);
      }
      closeModal();
    } else {
      console.error('إجراء غير صالح: الطلب أو نوع الإجراء أو السبب مفقود');
    }
  };

  if (isLoading) {
    return <Box>جاري التحميل...</Box>;
  }

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <VStack spacing={6}>
        <Heading as="h1" size="xl">لوحة الإدارة</Heading>

        <Heading as="h2" size="lg">الاتجاهات الموافق عليها</Heading>
        <Table variant="simple" colorScheme="green">
          <Thead>
            <Tr key="approved-header">
              <Th>الرقم التعريفي</Th>
              <Th>اسم الوكالة</Th>
              <Th>رقم الوكالة</Th>
              <Th>تاريخ/وقت الطلب</Th>
              <Th>معرف المنشئ</Th>
              <Th>رسالة الإدارة</Th>
            </Tr>
          </Thead>
          <Tbody>
            {approvedSubmissions.map((submission) => (
              <Tr key={`approved-${submission.id}`}>
                <Td>{submission.id}</Td>
                <Td>{submission.agencyName}</Td>
                <Td>{submission.agencyNumber}</Td>
                <Td>{submission.requestDate}</Td>
                <Td>{submission.creatorId}</Td>
                <Td>{submission.reason}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Heading as="h2" size="lg">الاتجاهات المرفوضة</Heading>
        <Table variant="simple" colorScheme="red">
          <Thead>
            <Tr key="rejected-header">
              <Th>الرقم التعريفي</Th>
              <Th>اسم الوكالة</Th>
              <Th>رقم الوكالة</Th>
              <Th>تاريخ/وقت الطلب</Th>
              <Th>معرف المنشئ</Th>
              <Th>رسالة الإدارة</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rejectedSubmissions.map((submission) => (
              <Tr key={`rejected-${submission.id}`}>
                <Td>{submission.id}</Td>
                <Td>{submission.agencyName}</Td>
                <Td>{submission.agencyNumber}</Td>
                <Td>{submission.requestDate}</Td>
                <Td>{submission.creatorId}</Td>
                <Td>{submission.reason}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <Heading as="h2" size="lg">الاتجاهات المعلقة</Heading>
        <Table variant="simple">
          <Thead>
            <Tr key="pending-header">
              <Th>الرقم التعريفي</Th>
              <Th>اسم الوكالة</Th>
              <Th>رقم الوكالة</Th>
              <Th>تاريخ/وقت الطلب</Th>
              <Th>معرف المنشئ</Th>
              <Th>الإجراءات</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pendingSubmissions.map((submission: Submission) => (
              <Tr key={`pending-${submission.id}`}>
                <Td>{submission.id}</Td>
                <Td>{submission.agencyName}</Td>
                <Td>{submission.agencyNumber}</Td>
                <Td>{`${submission.requestDate} ${submission.requestTime}`}</Td>
                <Td>{submission.creatorId}</Td>
                <Td>
                  <Button
                    colorScheme="green"
                    size="sm"
                    mr={2}
                    onClick={() => openModal(submission.id, 'approve')}
                  >
                    موافقة
                  </Button>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => openModal(submission.id, 'reject')}
                  >
                    رفض
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{actionType === 'approve' ? 'الموافقة على' : 'رفض'} الطلب</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>السبب</FormLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="أدخل سبب الموافقة/الرفض"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAction}>
              إرسال
            </Button>
            <Button variant="ghost" onClick={closeModal}>إلغاء</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AdminPanel;
