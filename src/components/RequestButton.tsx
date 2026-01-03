import {
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
  Badge,
  HStack,
  Text,
  MenuGroup,
  Icon,
} from "@chakra-ui/react";
import {
  IoAdd,
  IoCheckmark,
  IoDownload,
  IoTime,
  IoCheckmarkCircle,
  IoChevronDown,
} from "react-icons/io5";
import { requestManager, QualityProfile, MediaType } from "../utils/RequestManager";
import { useQuery, useQueryClient } from "react-query";
import { plexClient } from "../utils/PlexClient";

interface RequestButtonProps {
  tmdbId: number;
  title: string;
  mediaType: MediaType;
  year?: number;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "ghost";
  iconOnly?: boolean;
  categoryName?: string;
  savePath?: string;
}

const RequestButton = ({
  tmdbId,
  title,
  mediaType,
  year,
  overview,
  posterPath,
  backdropPath,
  size = "md",
  variant = "solid",
  iconOnly = false,
  categoryName,
  savePath,
}: RequestButtonProps) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  // Check if media is requested
  const { data: existingRequest, refetch } = useQuery(
    ["mediaRequest", tmdbId],
    () => requestManager.getRequestByTmdbId(tmdbId),
    {
      refetchInterval: 5000,
    }
  );

  // Check if media is in Plex
  const { data: isInPlex } = useQuery(
    ["plexMedia", tmdbId, title],
    async () => {
      if (!plexClient.isAuthenticated()) return false;
      try {
        return await plexClient.isMediaInLibrary(title, year);
      } catch (error) {
        return false;
      }
    },
    {
      enabled: plexClient.isAuthenticated(),
      staleTime: 60000, // Cache for 1 minute
    }
  );

  const handleRequest = (quality: QualityProfile) => {
    try {
      const username = plexClient.getUser()?.username || "Guest";
      
      requestManager.createRequest(mediaType, tmdbId, title, username, {
        year,
        overview,
        posterPath,
        backdropPath,
        quality,
        categoryName,
        savePath,
      });

      toast({
        title: "Request created",
        description: `${title} has been requested in ${quality} quality`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      refetch();
      queryClient.invalidateQueries("mediaRequests");
    } catch (error) {
      toast({
        title: "Request failed",
        description: "Failed to create request",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // If already in Plex library
  if (isInPlex) {
    if (iconOnly) {
      return (
        <Badge colorScheme="green" display="flex" alignItems="center" gap={1} p={2}>
          <Icon as={IoCheckmarkCircle} />
        </Badge>
      );
    }
    return (
      <Button
        size={size}
        colorScheme="green"
        variant={variant}
        leftIcon={<IoCheckmarkCircle />}
        isDisabled
      >
        In Library
      </Button>
    );
  }

  // If request exists, show status
  if (existingRequest) {
    const getStatusIcon = () => {
      switch (existingRequest.status) {
        case "pending":
          return <IoTime />;
        case "approved":
          return <IoCheckmark />;
        case "downloading":
          return <IoDownload />;
        case "available":
          return <IoCheckmarkCircle />;
        default:
          return <IoTime />;
      }
    };

    const getStatusColor = () => {
      switch (existingRequest.status) {
        case "pending":
          return "yellow";
        case "approved":
          return "blue";
        case "downloading":
          return "purple";
        case "available":
          return "green";
        default:
          return "gray";
      }
    };

    if (iconOnly) {
      return (
        <Badge
          colorScheme={getStatusColor()}
          display="flex"
          alignItems="center"
          gap={1}
          p={2}
        >
          <Icon as={getStatusIcon()} />
        </Badge>
      );
    }

    return (
      <Button
        size={size}
        colorScheme={getStatusColor()}
        variant={variant}
        leftIcon={getStatusIcon()}
        isDisabled
      >
        {existingRequest.status.charAt(0).toUpperCase() +
          existingRequest.status.slice(1)}
      </Button>
    );
  }

  // Request button with quality options
  if (iconOnly) {
    return (
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<IoAdd />}
          colorScheme="blue"
          size={size}
          variant={variant}
          aria-label="Request media"
        />
        <MenuList>
          <MenuGroup title="Select Quality">
            <MenuItem onClick={() => handleRequest("4K")}>4K</MenuItem>
            <MenuItem onClick={() => handleRequest("1080p")}>1080p</MenuItem>
            <MenuItem onClick={() => handleRequest("720p")}>720p</MenuItem>
            <MenuItem onClick={() => handleRequest("SD")}>SD</MenuItem>
            <MenuItem onClick={() => handleRequest("Any")}>Any</MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        size={size}
        colorScheme="blue"
        variant={variant}
        rightIcon={<IoChevronDown />}
        leftIcon={<IoAdd />}
      >
        Request
      </MenuButton>
      <MenuList>
        <MenuGroup title="Select Quality">
          <MenuItem onClick={() => handleRequest("4K")}>
            <HStack justify="space-between" width="100%">
              <Text>4K UHD</Text>
              <Badge colorScheme="purple">Best</Badge>
            </HStack>
          </MenuItem>
          <MenuItem onClick={() => handleRequest("1080p")}>
            <HStack justify="space-between" width="100%">
              <Text>1080p Full HD</Text>
              <Badge colorScheme="blue">Recommended</Badge>
            </HStack>
          </MenuItem>
          <MenuItem onClick={() => handleRequest("720p")}>720p HD</MenuItem>
          <MenuItem onClick={() => handleRequest("SD")}>SD</MenuItem>
          <MenuDivider />
          <MenuItem onClick={() => handleRequest("Any")}>Any Quality</MenuItem>
        </MenuGroup>
      </MenuList>
    </Menu>
  );
};

export default RequestButton;
