import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  useToast,
  Heading,
} from '@chakra-ui/react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SectionManagement = ({ language }) => {
  const [sections, setSections] = useState([]);
  const [newSection, setNewSection] = useState('');
  const toast = useToast();

  const translations = {
    en: {
      title: 'Section Management',
      addSection: 'Add Section',
      deleteSection: 'Delete',
      newSectionPlaceholder: 'Enter new section name',
      addSuccess: 'Section added successfully',
      deleteSuccess: 'Section deleted successfully',
      error: 'An error occurred',
    },
    ar: {
      title: 'إدارة الأقسام',
      addSection: 'إضافة قسم',
      deleteSection: 'حذف',
      newSectionPlaceholder: 'أدخل اسم القسم الجديد',
      addSuccess: 'تمت إضافة القسم بنجاح',
      deleteSuccess: 'تم حذف القسم بنجاح',
      error: 'حدث خطأ',
    },
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_URL}/sections`);
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const addSection = async () => {
    if (!newSection.trim()) return;
    try {
      await axios.post(`${API_URL}/sections`, { name: newSection });
      setNewSection('');
      fetchSections();
      toast({
        title: translations[language].addSuccess,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding section:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      await axios.delete(`${API_URL}/sections/${sectionId}`);
      fetchSections();
      toast({
        title: translations[language].deleteSuccess,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: translations[language].error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading mb={4}>{translations[language].title}</Heading>
      <VStack spacing={4} align="stretch">
        <HStack>
          <Input
            placeholder={translations[language].newSectionPlaceholder}
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
          />
          <Button onClick={addSection}>{translations[language].addSection}</Button>
        </HStack>
        {sections.map((section) => (
          <HStack key={section.id} justifyContent="space-between">
            <Text>{section.name}</Text>
            <Button onClick={() => deleteSection(section.id)} colorScheme="red">
              {translations[language].deleteSection}
            </Button>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

export default SectionManagement;
