import React from 'react';
import { Box, Select, VStack, Heading } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const MemberDropdownMenus = () => {
  const { t } = useTranslation();

  return (
    <Box maxWidth="400px" margin="auto" mt={8}>
      <Heading size="md" mb={4}>{t('Member Options')}</Heading>
      <VStack spacing={4}>
        <Select placeholder={t('Select an option')}>
          <option value="agencyRules">{t('قوانين وكالة العاصي')}</option>
          <option value="supervisionRequest">{t('طريقة تقديم طلب اشراف داخل الوكالة')}</option>
          <option value="joinAgency">{t('كيفية الانضمام الى وكالة العاصي')}</option>
          <option value="applyTrend">{t('كيفية التقديم على ترند')}</option>
        </Select>
      </VStack>
    </Box>
  );
};

export default MemberDropdownMenus;
