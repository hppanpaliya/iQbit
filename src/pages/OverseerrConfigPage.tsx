import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
  HStack,
  Icon,
  useColorModeValue,
  Code,
} from "@chakra-ui/react";
import { IoCheckmarkCircle, IoServer } from "react-icons/io5";
import { overseerrClient } from "../utils/OverseerrClient";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface OverseerrConfigPageProps {
  onConfigSuccess?: () => void;
}

const OverseerrConfigPage = ({ onConfigSuccess }: OverseerrConfigPageProps) => {
  const [serverUrl, setServerUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const toast = useToast();
  const queryClient = useQueryClient();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Check if already configured
  const config = overseerrClient.getConfig();
  const isConfigured = overseerrClient.isConfigured();

  const { data: currentUser, refetch: refetchUser } = useQuery(
    "overseerrUser",
    () => overseerrClient.getCurrentUser(),
    {
      enabled: isConfigured,
      retry: false,
    }
  );

  const { mutate: testAndSave, isLoading } = useMutation(
    async () => {
      // Configure client
      overseerrClient.configure(serverUrl, apiKey);

      // Test connection
      const isConnected = await overseerrClient.testConnection();
      if (!isConnected) {
        throw new Error("Connection test failed");
      }

      // Get user info to confirm API key is valid
      const user = await overseerrClient.getCurrentUser();
      return user;
    },
    {
      onSuccess: (user) => {
        toast({
          title: "Connected to Overseerr",
          description: `Successfully connected as ${user.displayName}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        queryClient.invalidateQueries("overseerrUser");
        if (onConfigSuccess) onConfigSuccess();
      },
      onError: (error: any) => {
        // Clear invalid config
        overseerrClient.clearConfig();
        toast({
          title: "Connection failed",
          description: error?.message || "Failed to connect to Overseerr. Please check your URL and API key.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleConnect = () => {
    if (!serverUrl.trim()) {
      toast({
        title: "Server URL required",
        description: "Please enter your Overseerr server URL",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your Overseerr API key",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    testAndSave();
  };

  const handleDisconnect = () => {
    overseerrClient.clearConfig();
    queryClient.invalidateQueries("overseerrUser");
    setServerUrl("");
    setApiKey("");
    toast({
      title: "Disconnected",
      description: "Disconnected from Overseerr",
      status: "info",
      duration: 3000,
    });
  };

  if (isConfigured && currentUser) {
    return (
      <Box>
        <Alert
          status="success"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          rounded="lg"
          p={8}
        >
          <Icon as={IoCheckmarkCircle} boxSize="40px" mr={0} mb={4} />
          <AlertTitle fontSize="lg" mb={2}>
            Connected to Overseerr
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Connected to: <Code>{config.url}</Code>
            <br />
            Logged in as: <strong>{currentUser.displayName}</strong>
            {currentUser.email && (
              <>
                <br />
                Email: {currentUser.email}
              </>
            )}
          </AlertDescription>
          <Button
            mt={4}
            colorScheme="red"
            variant="outline"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <HStack justify="center" mb={2}>
            <Icon as={IoServer} boxSize="40px" />
          </HStack>
          <Heading size="lg" mb={2}>
            Connect to Overseerr
          </Heading>
          <Text color="gray.500">
            Configure your Overseerr instance to search and request media
          </Text>
        </Box>

        <Alert status="info" rounded="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>How to get your API Key:</AlertTitle>
            <AlertDescription>
              <Text mt={2}>1. Sign in to your Overseerr instance</Text>
              <Text>2. Go to Settings → General</Text>
              <Text>3. Scroll down to "API Key" section</Text>
              <Text>4. Copy your API key</Text>
              <Text mt={2}>
                Learn more:{" "}
                <Link
                  href="https://docs.overseerr.dev/using-overseerr/users#api-key"
                  isExternal
                  color="blue.500"
                  textDecoration="underline"
                >
                  Overseerr API Documentation
                </Link>
              </Text>
            </AlertDescription>
          </Box>
        </Alert>

        <Box bg={bgColor} p={6} rounded="lg" border="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Overseerr Server URL</FormLabel>
              <Input
                placeholder="https://overseerr.example.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Include http:// or https://
              </Text>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>API Key</FormLabel>
              <Input
                type="password"
                placeholder="Enter your Overseerr API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleConnect();
                }}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Connecting..."
              onClick={handleConnect}
              size="lg"
            >
              Connect to Overseerr
            </Button>
          </VStack>
        </Box>

        <Alert status="warning" rounded="lg">
          <AlertIcon />
          <Box fontSize="sm">
            <AlertTitle>Privacy Note</AlertTitle>
            <AlertDescription>
              Your Overseerr URL and API key are stored locally in your browser and only
              used to communicate with your Overseerr instance. No data is sent to
              third-party servers.
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
};

export default OverseerrConfigPage;
