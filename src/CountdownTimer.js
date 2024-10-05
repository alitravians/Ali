import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, HStack, Button } from "@chakra-ui/react";

const CountdownTimer = ({ targetDate, message, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (!timeLeft[interval]) {
      return;
    }

    timerComponents.push(
      <Box key={interval} textAlign="center" p={2}>
        <Text fontSize="2xl" fontWeight="bold">
          {timeLeft[interval]}
        </Text>
        <Text fontSize="sm">{interval}</Text>
      </Box>
    );
  });

  return (
    <Box
      position="fixed"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      bg="white"
      boxShadow="xl"
      borderRadius="md"
      p={6}
      textAlign="center"
    >
      <VStack spacing={4}>
        {timerComponents.length ? (
          <>
            <Text fontSize="xl" fontWeight="bold">
              Countdown Timer
            </Text>
            <HStack spacing={4}>{timerComponents}</HStack>
          </>
        ) : (
          <Text fontSize="xl">{message}</Text>
        )}
        <Button colorScheme="blue" onClick={onClose}>
          Close
        </Button>
      </VStack>
    </Box>
  );
};

export default CountdownTimer;
