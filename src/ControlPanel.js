// هذا المكون يتعامل مع إجراءات لوحة التحكم الإدارية
import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const ControlPanel = () => {
  const { t } = useTranslation();
  const [trendRequests, setTrendRequests] = useState([
    { id: 1, user: t('User1'), trend: t('Trend 1'), status: t('Pending') },
    { id: 2, user: t('User2'), trend: t('Trend 2'), status: t('Pending') },
    { id: 3, user: t('User3'), trend: t('Trend 3'), status: t('Pending') },
  ]);

  const toast = useToast();

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

  return (
    <Box maxWidth="800px" margin="auto" mt={8}>
      <Heading mb={4}>{t('Admin Control Panel')}</Heading>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>{t('User')}</Th>
            <Th>{t('Trend')}</Th>
            <Th>{t('Status')}</Th>
            <Th>{t('Actions')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {trendRequests.map((request) => (
            <Tr key={request.id}>
              <Td>{request.user}</Td>
              <Td>{request.trend}</Td>
              <Td>{t(request.status)}</Td>
              <Td>
                {request.status === 'Pending' && (
                  <>
                    <Button
                      colorScheme="green"
                      size="sm"
                      mr={2}
                      onClick={() => handleAction(request.id, 'Approved')}
                    >
                      {t('Approve')}
                    </Button>
                    <Button
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleAction(request.id, 'Rejected')}
                    >
                      {t('Reject')}
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
};

export default ControlPanel;
