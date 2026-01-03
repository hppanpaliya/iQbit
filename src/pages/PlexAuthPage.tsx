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
  Divider,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { IoLogoApple, IoCheckmarkCircle } from "react-icons/io5";
import { plexClient } from "../utils/PlexClient";
import { useMutation, useQueryClient } from "react-query";

interface PlexAuthProps {
  onAuthSuccess?: () => void;
}

const PlexAuthPage = ({ onAuthSuccess }: PlexAuthProps) => {
  const [token, setToken] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [serverPort, setServerPort] = useState("32400");
  const toast = useToast();
  const queryClient = useQueryClient();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const { mutate: authenticate, isLoading } = useMutation(
    async (authToken: string) => {
      return await plexClient.authenticateWithToken(authToken);
    },
    {
      onSuccess: (user) => {
        toast({
          title: "Authentication successful",
          description: `Welcome, ${user.username}!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        queryClient.invalidateQueries("plexAuth");
        if (onAuthSuccess) onAuthSuccess();
      },
      onError: (error: any) => {
        toast({
          title: "Authentication failed",
          description: error?.message || "Invalid token or connection error",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleAuth = () => {
    if (!token.trim()) {
      toast({
        title: "Token required",
        description: "Please enter your Plex authentication token",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    authenticate(token);
  };

  const handleServerSetup = () => {
    if (!serverUrl.trim()) {
      toast({
        title: "Server URL required",
        description: "Please enter your Plex server URL",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    plexClient.setServer({
      name: "My Plex Server",
      host: serverUrl,
      port: parseInt(serverPort) || 32400,
      machineIdentifier: "",
      version: "",
    });

    toast({
      title: "Server configured",
      description: "Plex server settings saved",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const isAuthenticated = plexClient.isAuthenticated();
  const user = plexClient.getUser();
  const server = plexClient.getServer();

  if (isAuthenticated && user) {
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
            Connected to Plex
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Logged in as <strong>{user.username}</strong>
            {server && (
              <>
                <br />
                Server: {server.host}:{server.port}
              </>
            )}
          </AlertDescription>
          <Button
            mt={4}
            colorScheme="red"
            variant="outline"
            onClick={() => {
              plexClient.signOut();
              queryClient.invalidateQueries("plexAuth");
              toast({
                title: "Signed out",
                description: "You have been signed out of Plex",
                status: "info",
                duration: 3000,
              });
            }}
          >
            Sign Out
          </Button>
        </Alert>

        <Divider my={6} />

        <Box bg={bgColor} p={6} rounded="lg" border="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>
            Server Configuration
          </Heading>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Server URL/IP</FormLabel>
              <Input
                placeholder="192.168.1.100 or plex.example.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Port</FormLabel>
              <Input
                placeholder="32400"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
              />
            </FormControl>
            <Button colorScheme="blue" onClick={handleServerSetup}>
              Save Server Settings
            </Button>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <HStack justify="center" mb={2}>
            <Icon as={IoLogoApple} boxSize="40px" />
          </HStack>
          <Heading size="lg" mb={2}>
            Connect to Plex
          </Heading>
          <Text color="gray.500">
            Authenticate with your Plex account to enable media library integration
          </Text>
        </Box>

        <Alert status="info" rounded="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>How to get your Plex token:</AlertTitle>
            <AlertDescription>
              <Text mt={2}>
                1. Sign in to{" "}
                <Link
                  href="https://app.plex.tv"
                  isExternal
                  color="blue.500"
                  textDecoration="underline"
                >
                  app.plex.tv
                </Link>
              </Text>
              <Text>2. Play any media item</Text>
              <Text>3. Click the three dots (...) → "Get Info"</Text>
              <Text>4. Click "View XML"</Text>
              <Text>5. Look for "X-Plex-Token" in the URL</Text>
              <Text mt={2}>
                Or visit{" "}
                <Link
                  href="https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/"
                  isExternal
                  color="blue.500"
                  textDecoration="underline"
                >
                  Plex Support Guide
                </Link>
              </Text>
            </AlertDescription>
          </Box>
        </Alert>

        <Box bg={bgColor} p={6} rounded="lg" border="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Plex Authentication Token</FormLabel>
              <Input
                type="password"
                placeholder="Enter your X-Plex-Token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleAuth();
                }}
              />
            </FormControl>

            <Button
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Authenticating..."
              onClick={handleAuth}
              size="lg"
            >
              Connect to Plex
            </Button>
          </VStack>
        </Box>

        <Box bg={bgColor} p={6} rounded="lg" border="1px" borderColor={borderColor}>
          <Heading size="sm" mb={4}>
            Optional: Server Configuration
          </Heading>
          <Text fontSize="sm" color="gray.500" mb={4}>
            If you want to browse your Plex library, provide your server details
          </Text>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Server URL/IP</FormLabel>
              <Input
                placeholder="192.168.1.100 or plex.example.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Port</FormLabel>
              <Input
                placeholder="32400"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
              />
            </FormControl>
            <Button variant="outline" onClick={handleServerSetup}>
              Save Server Settings
            </Button>
          </VStack>
        </Box>

        <Alert status="warning" rounded="lg">
          <AlertIcon />
          <Box fontSize="sm">
            <AlertTitle>Privacy Note</AlertTitle>
            <AlertDescription>
              Your Plex token is stored locally in your browser and never sent to any
              third-party servers. It's only used to communicate directly with Plex
              services.
            </AlertDescription>
          </Box>
        </Alert>
      </VStack>
    </Box>
  );
};

export default PlexAuthPage;
