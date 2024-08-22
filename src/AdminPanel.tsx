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
  id: number;
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
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
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
        throw new Error('Failed to fetch submissions');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Error fetching submissions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number, reason: string) => {
    try {
      const response = await fetch(`http://localhost:3001/submissions/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        const approvedSubmission = pendingSubmissions.find(sub => sub.id === id);
        if (approvedSubmission) {
          approvedSubmission.status = 'approved';
          approvedSubmission.reason = reason;
          setApprovedSubmissions([...approvedSubmissions, approvedSubmission]);
          setPendingSubmissions(pendingSubmissions.filter(sub => sub.id !== id));
        }
        toast({
          title: 'Submission approved',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to approve submission');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      toast({
        title: 'Error approving submission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      const response = await fetch(`http://localhost:3001/submissions/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        const rejectedSubmission = pendingSubmissions.find(sub => sub.id === id);
        if (rejectedSubmission) {
          rejectedSubmission.status = 'rejected';
          rejectedSubmission.reason = reason;
          setPendingSubmissions(pendingSubmissions.filter(sub => sub.id !== id));
          setRejectedSubmissions([...rejectedSubmissions, rejectedSubmission]);
          toast({
            title: 'Submission rejected',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        throw new Error('Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      toast({
        title: 'Error rejecting submission',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openModal = (index: number, action: 'approve' | 'reject') => {
    setSelectedSubmission(index);
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
      if (actionType === 'approve') {
        handleApprove(selectedSubmission, reason);
      } else {
        handleReject(selectedSubmission, reason);
      }
      closeModal();
    }
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <VStack spacing={6}>
        <Heading as="h1" size="xl">Admin Panel</Heading>

        <Heading as="h2" size="lg">Approved Trends</Heading>
        <Table variant="simple" colorScheme="green">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Agency Name</Th>
              <Th>Agency Number</Th>
              <Th>Request Date/Time</Th>
              <Th>Creator ID</Th>
              <Th>Admin Message</Th>
            </Tr>
          </Thead>
          <Tbody>
            {approvedSubmissions.map((submission) => (
              <Tr key={submission.id}>
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

        <Heading as="h2" size="lg">Rejected Trends</Heading>
        <Table variant="simple" colorScheme="red">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Agency Name</Th>
              <Th>Agency Number</Th>
              <Th>Request Date/Time</Th>
              <Th>Creator ID</Th>
              <Th>Admin Message</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rejectedSubmissions.map((submission) => (
              <Tr key={submission.id}>
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

        <Heading as="h2" size="lg">Pending Trends</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Agency Name</Th>
              <Th>Agency Number</Th>
              <Th>Request Date/Time</Th>
              <Th>Creator ID</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pendingSubmissions.map((submission: Submission) => (
              <Tr key={submission.id}>
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
                    Approve
                  </Button>
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => openModal(submission.id, 'reject')}
                  >
                    Reject
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
          <ModalHeader>{actionType === 'approve' ? 'Approve' : 'Reject'} Submission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Reason</FormLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for approval/rejection"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleAction}>
              Submit
            </Button>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default AdminPanel;
