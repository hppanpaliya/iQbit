import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Image,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from "@chakra-ui/react";
import {
  IoTrash,
  IoCheckmark,
  IoClose,
  IoDownload,
  IoFilm,
  IoTv,
  IoTime,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHourglass,
} from "react-icons/io5";
import { requestManager, MediaRequest, RequestStatus } from "../utils/RequestManager";
import PageHeader from "../components/PageHeader";
import { useQuery, useMutation, useQueryClient } from "react-query";
import filesize from "filesize";

const smallImage = "http://image.tmdb.org/t/p/w200";

const RequestsPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<MediaRequest | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef(null);
  const [filterStatus, setFilterStatus] = useState<RequestStatus | "all">("all");

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  // Query for all requests
  const { data: allRequests = [], refetch } = useQuery(
    "mediaRequests",
    () => requestManager.getAllRequests(),
    {
      refetchInterval: 5000, // Refresh every 5 seconds
    }
  );

  // Get statistics
  const stats = useMemo(() => requestManager.getStatistics(), [allRequests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (filterStatus === "all") return allRequests;
    return allRequests.filter((r) => r.status === filterStatus);
  }, [allRequests, filterStatus]);

  // Delete mutation
  const { mutate: deleteRequest } = useMutation(
    (id: string) => {
      requestManager.deleteRequest(id);
      return Promise.resolve();
    },
    {
      onSuccess: () => {
        toast({
          title: "Request deleted",
          status: "success",
          duration: 2000,
        });
        refetch();
        onClose();
      },
    }
  );

  // Update status mutation
  const { mutate: updateStatus } = useMutation(
    ({ id, status }: { id: string; status: RequestStatus }) => {
      requestManager.updateRequestStatus(id, status);
      return Promise.resolve();
    },
    {
      onSuccess: () => {
        toast({
          title: "Status updated",
          status: "success",
          duration: 2000,
        });
        refetch();
      },
    }
  );

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return "yellow";
      case "approved":
        return "blue";
      case "downloading":
        return "purple";
      case "available":
        return "green";
      case "failed":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return <IoHourglass />;
      case "approved":
        return <IoCheckmark />;
      case "downloading":
        return <IoDownload />;
      case "available":
        return <IoCheckmarkCircle />;
      case "failed":
        return <IoCloseCircle />;
      default:
        return <IoTime />;
    }
  };

  const handleDeleteClick = (request: MediaRequest) => {
    setSelectedRequest(request);
    onOpen();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <PageHeader title="Media Requests" />
      <Text color="gray.500" mb={4}>
        Manage your media requests and track their status
      </Text>

      {/* Statistics */}
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4} mb={6}>
        <Stat
          bg={bgColor}
          p={4}
          rounded="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Total</StatLabel>
          <StatNumber>{stats.total}</StatNumber>
          <StatHelpText>All requests</StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={4}
          rounded="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Pending</StatLabel>
          <StatNumber color="yellow.500">{stats.pending}</StatNumber>
          <StatHelpText>Awaiting approval</StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={4}
          rounded="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Downloading</StatLabel>
          <StatNumber color="purple.500">{stats.downloading}</StatNumber>
          <StatHelpText>In progress</StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={4}
          rounded="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Available</StatLabel>
          <StatNumber color="green.500">{stats.available}</StatNumber>
          <StatHelpText>Ready to watch</StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={4}
          rounded="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>Movies</StatLabel>
          <StatNumber>{stats.movies}</StatNumber>
          <StatHelpText>Movie requests</StatHelpText>
        </Stat>
        <Stat
          bg={bgColor}
          p={4}
          rounded="lg"
          border="1px"
          borderColor={borderColor}
        >
          <StatLabel>TV Shows</StatLabel>
          <StatNumber>{stats.tv}</StatNumber>
          <StatHelpText>TV requests</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Filter */}
      <Flex mb={4} gap={3} align="center">
        <Text fontWeight="medium">Filter:</Text>
        <Select
          width="200px"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as RequestStatus | "all")}
        >
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="downloading">Downloading</option>
          <option value="available">Available</option>
          <option value="failed">Failed</option>
        </Select>
      </Flex>

      {/* Requests List */}
      <VStack spacing={3} align="stretch">
        {filteredRequests.length === 0 ? (
          <Box
            bg={bgColor}
            p={8}
            rounded="lg"
            border="1px"
            borderColor={borderColor}
            textAlign="center"
          >
            <Text color="gray.500">
              {filterStatus === "all"
                ? "No requests yet. Start by searching for movies or TV shows!"
                : `No ${filterStatus} requests found.`}
            </Text>
          </Box>
        ) : (
          filteredRequests.map((request) => (
            <Box
              key={request.id}
              bg={bgColor}
              p={4}
              rounded="lg"
              border="1px"
              borderColor={borderColor}
              _hover={{ bg: hoverBgColor }}
              transition="background 0.2s"
            >
              <Flex gap={4} align="start">
                {/* Poster */}
                {request.posterPath && (
                  <Image
                    src={smallImage + request.posterPath}
                    alt={request.title}
                    width="80px"
                    height="120px"
                    objectFit="cover"
                    rounded="md"
                  />
                )}

                {/* Content */}
                <Flex flex={1} direction="column" gap={2}>
                  <Flex justify="space-between" align="start">
                    <Box flex={1}>
                      <HStack mb={1}>
                        {request.mediaType === "movie" ? <IoFilm /> : <IoTv />}
                        <Heading size="sm">{request.title}</Heading>
                        {request.year && (
                          <Text color="gray.500">({request.year})</Text>
                        )}
                      </HStack>
                      {request.overview && (
                        <Text fontSize="sm" color="gray.500" noOfLines={2}>
                          {request.overview}
                        </Text>
                      )}
                    </Box>

                    {/* Actions */}
                    <HStack spacing={2}>
                      {request.status === "pending" && (
                        <>
                          <IconButton
                            aria-label="Approve"
                            icon={<IoCheckmark />}
                            colorScheme="green"
                            size="sm"
                            onClick={() =>
                              updateStatus({ id: request.id, status: "approved" })
                            }
                          />
                          <IconButton
                            aria-label="Reject"
                            icon={<IoClose />}
                            colorScheme="red"
                            size="sm"
                            onClick={() =>
                              updateStatus({ id: request.id, status: "failed" })
                            }
                          />
                        </>
                      )}
                      {request.status === "approved" && (
                        <IconButton
                          aria-label="Start Download"
                          icon={<IoDownload />}
                          colorScheme="blue"
                          size="sm"
                          onClick={() =>
                            updateStatus({ id: request.id, status: "downloading" })
                          }
                        />
                      )}
                      {request.status === "downloading" && (
                        <IconButton
                          aria-label="Mark Available"
                          icon={<IoCheckmarkCircle />}
                          colorScheme="green"
                          size="sm"
                          onClick={() =>
                            updateStatus({ id: request.id, status: "available" })
                          }
                        />
                      )}
                      <IconButton
                        aria-label="Delete"
                        icon={<IoTrash />}
                        colorScheme="red"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(request)}
                      />
                    </HStack>
                  </Flex>

                  {/* Meta info */}
                  <Flex gap={3} flexWrap="wrap" fontSize="sm">
                    <Badge
                      colorScheme={getStatusColor(request.status)}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      {getStatusIcon(request.status)}
                      {request.status}
                    </Badge>
                    <Badge colorScheme="purple">{request.quality}</Badge>
                    <Text color="gray.500">By: {request.requestedBy}</Text>
                    <Text color="gray.500">
                      Requested: {formatDate(request.requestedAt)}
                    </Text>
                    {request.categoryName && (
                      <Badge colorScheme="blue">{request.categoryName}</Badge>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            </Box>
          ))
        )}
      </VStack>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Request
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete the request for "
              {selectedRequest?.title}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => {
                  if (selectedRequest) {
                    deleteRequest(selectedRequest.id);
                  }
                }}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default RequestsPage;
