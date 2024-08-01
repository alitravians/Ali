// هذا المكون يتعامل مع إجراءات لوحة التحكم الإدارية
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  useToast,
  Select,
  Switch,
  FormControl,
  FormLabel,
  Input,
  Text,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const ControlPanel = () => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState('reviewTickets');
  const [trendRequests, setTrendRequests] = useState([
    { id: 1, ticketCode: 'ABC123', name: 'User1', bigoId: 'BIGO1', email: 'user1@example.com', reason: 'Special event', preferredTime: '14:00', status: 'pending' },
    { id: 2, ticketCode: 'DEF456', name: 'User2', bigoId: 'BIGO2', email: 'user2@example.com', reason: 'Product launch', preferredTime: '16:30', status: 'pending' },
    { id: 3, ticketCode: 'GHI789', name: 'User3', bigoId: 'BIGO3', email: 'user3@example.com', reason: 'Charity stream', preferredTime: '20:00', status: 'pending' },
  ]);
  const [members, setMembers] = useState([
    { id: 1, name: 'User1', email: 'user1@example.com', suspended: false },
    { id: 2, name: 'User2', email: 'user2@example.com', suspended: false },
    { id: 3, name: 'User3', email: 'user3@example.com', suspended: true },
  ]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [reopenTime, setReopenTime] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [countdown, setCountdown] = useState('');
  const [agencyInfo, setAgencyInfo] = useState('');
  const [trendRequestInfo, setTrendRequestInfo] = useState('');
  const [agencyRules, setAgencyRules] = useState('');
  const [pointsDeduction, setPointsDeduction] = useState(20);
  const [isTicketSystemOpen, setIsTicketSystemOpen] = useState(true);
  const [searchTicketCode, setSearchTicketCode] = useState('');

  const toast = useToast();

  const fetchTrendRequests = async () => {
    // Placeholder: Replace with actual API call
    const mockRequests = [
      { id: 1, ticketCode: 'ABC123', name: 'John Doe', bigoId: 'JD123', email: 'john@example.com', reason: 'Special event', preferredTime: '14:00', status: 'pending' },
      { id: 2, ticketCode: 'DEF456', name: 'Jane Smith', bigoId: 'JS456', email: 'jane@example.com', reason: 'Product launch', preferredTime: '16:30', status: 'pending' },
      { id: 3, ticketCode: 'GHI789', name: 'Alice Johnson', bigoId: 'AJ789', email: 'alice@example.com', reason: 'Charity stream', preferredTime: '20:00', status: 'pending' },
    ];
    setTrendRequests(mockRequests);
  };

  useEffect(() => {
    fetchTrendRequests();
  }, []);

  useEffect(() => {
    let timer;
    if (maintenanceMode && reopenTime) {
      timer = setInterval(() => {
        const now = new Date();
        const end = new Date(reopenTime);
        const distance = end - now;

        if (distance < 0) {
          clearInterval(timer);
          setMaintenanceMode(false);
          setCountdown('');
        } else {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [maintenanceMode, reopenTime]);

  const handleApprove = (id) => {
    setTrendRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: 'approved' } : request
      )
    );
    toast({
      title: t('Trend Request Approved'),
      description: t('The trend request has been approved.'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleReject = (id, reason) => {
    setTrendRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: 'rejected', rejectionReason: reason } : request
      )
    );
    toast({
      title: t('Trend Request Rejected'),
      description: t('The trend request has been rejected.'),
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSuspend = (memberId) => {
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === memberId ? { ...member, suspended: !member.suspended } : member
      )
    );
  };

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleMaintenanceModeToggle = () => {
    setMaintenanceMode(!maintenanceMode);
    if (!maintenanceMode) {
      const defaultReopenTime = new Date();
      defaultReopenTime.setHours(defaultReopenTime.getHours() + 1);
      setReopenTime(defaultReopenTime.toISOString().slice(0, 16));
    } else {
      setReopenTime('');
      setClosureReason('');
      setCountdown('');
    }
  };

  const handleSaveWebsiteMenus = () => {
    // Here you would typically send the updated menu information to your backend
    console.log({ agencyInfo, trendRequestInfo, agencyRules });
    toast({
      title: t('Website Menus Updated'),
      description: t('The website menus have been successfully updated.'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handlePointsDeductionUpdate = async (newAmount) => {
    try {
      // API call to update points deduction amount
      // const response = await fetch('/api/admin/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ pointsDeduction: newAmount })
      // });
      // if (response.ok) {
      //   setPointsDeduction(newAmount);
      //   toast({
      //     title: t('Points Deduction Updated'),
      //     status: 'success',
      //     duration: 3000,
      //     isClosable: true,
      //   });
      // }
    } catch (error) {
      console.error('Error updating points deduction:', error);
      toast({
        title: t('Error Updating Points Deduction'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCloseTicketSystem = () => {
    setIsTicketSystemOpen(false);
    toast({
      title: t('Ticket System Closed'),
      description: t('The ticket system is now closed. No new requests can be submitted.'),
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleOpenTicketSystem = () => {
    setIsTicketSystemOpen(true);
    toast({
      title: t('Ticket System Opened'),
      description: t('The ticket system is now open. New requests can be submitted.'),
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleSearchTicket = () => {
    const foundTicket = trendRequests.find(request => request.ticketCode === searchTicketCode);
    if (foundTicket) {
      setTrendRequests([foundTicket]);
    } else {
      toast({
        title: t('Ticket Not Found'),
        description: t('No ticket found with the provided code.'),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <Heading mb={4}>{t('Admin Control Panel')}</Heading>
      <Select value={selectedOption} onChange={handleOptionChange} mb={4}>
        <option value="reviewTickets">{t('Review Tickets')}</option>
        <option value="searchTicket">{t('Search by Ticket Number')}</option>
        <option value="closeSystem">{t('Close Ticket System')}</option>
        <option value="openSystem">{t('Open Ticket System')}</option>
        <option value="manageMembers">{t('Manage Members')}</option>
      </Select>
      {selectedOption === 'manageMembers' && (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t('Name')}</Th>
              <Th>{t('Email')}</Th>
              <Th>{t('Status')}</Th>
              <Th>{t('Actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {members.map((member) => (
              <Tr key={member.id}>
                <Td>{member.name}</Td>
                <Td>{member.email}</Td>
                <Td>{member.suspended ? t('Suspended') : t('Active')}</Td>
                <Td>
                  <Button
                    colorScheme={member.suspended ? "green" : "red"}
                    size="sm"
                    onClick={() => handleSuspend(member.id)}
                  >
                    {member.suspended ? t('Activate') : t('Suspend')}
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
      {selectedOption === 'closeSystem' && (
        <Button onClick={handleCloseTicketSystem} colorScheme="red">
          {t('Close Ticket System')}
        </Button>
      )}
      {selectedOption === 'openSystem' && (
        <Button onClick={handleOpenTicketSystem} colorScheme="green">
          {t('Open Ticket System')}
        </Button>
      )}
      {selectedOption === 'searchTicket' && (
        <Box>
          <Input
            placeholder={t('Enter ticket code')}
            value={searchTicketCode}
            onChange={(e) => setSearchTicketCode(e.target.value)}
            mb={4}
          />
          <Button onClick={handleSearchTicket} colorScheme="blue">
            {t('Search')}
          </Button>
        </Box>
      )}
      {selectedOption === 'reviewTickets' && (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>{t('Ticket Code')}</Th>
              <Th>{t('Name')}</Th>
              <Th>{t('Bigo ID')}</Th>
              <Th>{t('Email')}</Th>
              <Th>{t('Reason')}</Th>
              <Th>{t('Preferred Time')}</Th>
              <Th>{t('Status')}</Th>
              <Th>{t('Actions')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {trendRequests.map((request) => (
              <Tr key={request.id}>
                <Td>{request.ticketCode}</Td>
                <Td>{request.name}</Td>
                <Td>{request.bigoId}</Td>
                <Td>{request.email}</Td>
                <Td>{request.reason}</Td>
                <Td>{request.preferredTime}</Td>
                <Td>{t(request.status)}</Td>
                <Td>
                  {request.status === 'pending' && (
                    <>
                      <Button onClick={() => handleApprove(request.id)} colorScheme="green" size="sm" mr={2}>
                        {t('Approve')}
                      </Button>
                      <Button onClick={() => {
                        const reason = prompt(t('Enter rejection reason:'));
                        if (reason) handleReject(request.id, reason);
                      }} colorScheme="red" size="sm">
                        {t('Reject')}
                      </Button>
                    </>
                  )}
                  {request.status === 'rejected' && (
                    <Tooltip label={request.rejectionReason}>
                      <Text color="red.500">{t('Rejected')}</Text>
                    </Tooltip>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ControlPanel;
