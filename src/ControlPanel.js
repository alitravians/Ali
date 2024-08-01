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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const ControlPanel = () => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState('memberList');
  const [trendRequests, setTrendRequests] = useState([
    { id: 1, user: t('User1'), trend: t('Trend 1'), status: t('Pending') },
    { id: 2, user: t('User2'), trend: t('Trend 2'), status: t('Pending') },
    { id: 3, user: t('User3'), trend: t('Trend 3'), status: t('Pending') },
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

  const toast = useToast();

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

  const handleAction = (id, action) => {
    setTrendRequests(prevRequests =>
      prevRequests.map(request =>
        request.id === id ? { ...request, status: action } : request
      )
    );

    toast({
      title: t(`Trend Request ${action}`),
      description: t(`The trend request has been ${action.toLowerCase()}.`),
      status: action === t('Approved') ? 'success' : 'info',
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

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <Heading mb={4}>{t('Admin Control Panel')}</Heading>
      <Select value={selectedOption} onChange={handleOptionChange} mb={4}>
        <option value="memberList">{t('Member List')}</option>
        <option value="websiteStatus">{t('Website Status')}</option>
        <option value="websiteMenus">{t('Website Menus')}</option>
      </Select>
      {selectedOption === 'memberList' && (
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
      {selectedOption === 'websiteStatus' && (
        <Box>
          <FormControl display="flex" alignItems="center" mb={4}>
            <FormLabel htmlFor="maintenance-mode" mb="0">
              {t('Maintenance Mode')}
            </FormLabel>
            <Switch
              id="maintenance-mode"
              isChecked={maintenanceMode}
              onChange={handleMaintenanceModeToggle}
            />
          </FormControl>
          {maintenanceMode && (
            <>
              <FormControl mb={4}>
                <FormLabel>{t('Reopen Time')}</FormLabel>
                <Input
                  type="datetime-local"
                  value={reopenTime}
                  onChange={(e) => setReopenTime(e.target.value)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>{t('Closure Reason')}</FormLabel>
                <Input
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder={t('Enter reason for closure')}
                />
              </FormControl>
              {countdown && (
                <Text mb={4}>
                  {t('Time remaining')}: {countdown}
                </Text>
              )}
            </>
          )}
        </Box>
      )}
      {selectedOption === 'websiteMenus' && (
        <Box>
          <FormControl mb={4}>
            <FormLabel>{t('Agency Information')}</FormLabel>
            <Textarea
              value={agencyInfo}
              onChange={(e) => setAgencyInfo(e.target.value)}
              placeholder={t('Enter information about the agency')}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>{t('How to Request a Trend')}</FormLabel>
            <Textarea
              value={trendRequestInfo}
              onChange={(e) => setTrendRequestInfo(e.target.value)}
              placeholder={t('Enter information on how to request a trend')}
            />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>{t('General Agency Rules')}</FormLabel>
            <Textarea
              value={agencyRules}
              onChange={(e) => setAgencyRules(e.target.value)}
              placeholder={t('Enter general rules for the agency')}
            />
          </FormControl>
          <Button colorScheme="blue" onClick={handleSaveWebsiteMenus}>
            {t('Save Website Menus')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ControlPanel;
