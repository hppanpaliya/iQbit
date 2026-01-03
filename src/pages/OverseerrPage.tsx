import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  useToast,
  Spinner,
  Badge,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  useColorModeValue,
  Image,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
} from "@chakra-ui/react";
import { IoSearch, IoFilm, IoTv, IoCheckmarkCircle, IoTime } from "react-icons/io5";
import { overseerrClient, OverseerrMovie, OverseerrTVShow } from "../utils/OverseerrClient";
import { useQuery, useMutation, useQueryClient } from "react-query";
import PageHeader from "../components/PageHeader";
import IosBottomSheet from "../components/ios/IosBottomSheet";

const smallImage = "https://image.tmdb.org/t/p/w200";
const largeImage = "https://image.tmdb.org/t/p/w500";

const OverseerrPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<OverseerrMovie | OverseerrTVShow | null>(null);
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const toast = useToast();
  const queryClient = useQueryClient();
  const detailsDisclosure = useDisclosure();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  const isConfigured = overseerrClient.isConfigured();

  // Search query
  const { data: searchResults, isLoading: searchLoading } = useQuery(
    ["overseerrSearch", activeSearch],
    () => overseerrClient.search(activeSearch),
    {
      enabled: !!activeSearch && isConfigured,
      retry: false,
    }
  );

  // Discover popular movies
  const { data: popularMovies, isLoading: moviesLoading } = useQuery(
    "overseerrPopularMovies",
    () => overseerrClient.discoverMovies("popular", 1),
    {
      enabled: isConfigured,
      retry: false,
    }
  );

  // Discover popular TV shows
  const { data: popularTV, isLoading: tvLoading } = useQuery(
    "overseerrPopularTV",
    () => overseerrClient.discoverTVShows("popular", 1),
    {
      enabled: isConfigured,
      retry: false,
    }
  );

  // Request mutation
  const { mutate: requestMedia, isLoading: requesting } = useMutation(
    async (media: OverseerrMovie | OverseerrTVShow) => {
      if ("title" in media) {
        // Movie
        return await overseerrClient.requestMovie(media.id);
      } else {
        // TV Show - request all seasons
        const tvShow = media as OverseerrTVShow;
        const allSeasons = Array.from({ length: tvShow.numberOfSeasons }, (_, i) => i + 1);
        return await overseerrClient.requestTVShow(media.id, allSeasons);
      }
    },
    {
      onSuccess: (_, media) => {
        const title = "title" in media ? media.title : media.name;
        toast({
          title: "Request submitted",
          description: `${title} has been requested`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        queryClient.invalidateQueries("overseerrSearch");
        queryClient.invalidateQueries("overseerrPopularMovies");
        queryClient.invalidateQueries("overseerrPopularTV");
        detailsDisclosure.onClose();
      },
      onError: (error: any) => {
        toast({
          title: "Request failed",
          description: error?.message || "Failed to submit request",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
    }
  };

  const handleMediaClick = (media: OverseerrMovie | OverseerrTVShow) => {
    setSelectedMedia(media);
    setMediaType("title" in media ? "movie" : "tv");
    detailsDisclosure.onOpen();
  };

  const getMediaStatus = (media: OverseerrMovie | OverseerrTVShow) => {
    if (!media.mediaInfo) return null;
    
    const status = media.mediaInfo.status;
    const status4k = media.mediaInfo.status4k;
    
    // Status: 1=unknown, 2=pending, 3=processing, 4=partially available, 5=available
    if (status === 5 || status4k === 5) {
      return { label: "Available", color: "green", icon: IoCheckmarkCircle };
    }
    if (status === 3 || status4k === 3) {
      return { label: "Processing", color: "blue", icon: IoTime };
    }
    if (status === 2 || status4k === 2) {
      return { label: "Pending", color: "yellow", icon: IoTime };
    }
    return null;
  };

  const renderMediaCard = (media: OverseerrMovie | OverseerrTVShow) => {
    const title = "title" in media ? media.title : media.name;
    const releaseDate = "releaseDate" in media ? media.releaseDate : media.firstAirDate;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
    const status = getMediaStatus(media);

    return (
      <Box
        key={media.id}
        bg={bgColor}
        rounded="lg"
        overflow="hidden"
        border="1px"
        borderColor={borderColor}
        cursor="pointer"
        onClick={() => handleMediaClick(media)}
        _hover={{ bg: hoverBgColor, shadow: "md" }}
        transition="all 0.2s"
      >
        {media.posterPath && (
          <Image
            src={smallImage + media.posterPath}
            alt={title}
            width="100%"
            height="300px"
            objectFit="cover"
          />
        )}
        <Box p={3}>
          <Flex align="start" justify="space-between" gap={2}>
            <VStack align="start" spacing={1} flex={1}>
              <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
                {title}
              </Text>
              {year && (
                <Text fontSize="xs" color="gray.500">
                  {year}
                </Text>
              )}
              {status && (
                <Badge colorScheme={status.color} size="sm" display="flex" alignItems="center" gap={1}>
                  <Icon as={status.icon} boxSize={3} />
                  {status.label}
                </Badge>
              )}
            </VStack>
            <Icon as={"title" in media ? IoFilm : IoTv} boxSize={5} color="gray.400" />
          </Flex>
        </Box>
      </Box>
    );
  };

  if (!isConfigured) {
    return (
      <Box>
        <PageHeader title="Overseerr" />
        <Box textAlign="center" py={10}>
          <Text color="gray.500" mb={4}>
            Overseerr is not configured. Please configure it in Settings → Overseerr.
          </Text>
          <Button colorScheme="blue" onClick={() => window.location.hash = "#/overseerr-config"}>
            Configure Overseerr
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Overseerr" />
      <Text color="gray.500" mb={4}>
        Search and request movies and TV shows through Overseerr
      </Text>

      {/* Search */}
      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <Icon as={IoSearch} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search movies and TV shows..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
      </InputGroup>

      {activeSearch && searchLoading && (
        <Flex justify="center" py={10}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      )}

      {activeSearch && searchResults && (
        <Box mb={8}>
          <Heading size="md" mb={4}>
            Search Results for "{activeSearch}"
          </Heading>
          {searchResults.results.length === 0 ? (
            <Text color="gray.500">No results found</Text>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
              {searchResults.results.map(renderMediaCard)}
            </SimpleGrid>
          )}
        </Box>
      )}

      {/* Discover content */}
      <Tabs colorScheme="blue">
        <TabList>
          <Tab>Popular Movies</Tab>
          <Tab>Popular TV Shows</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            {moviesLoading ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : popularMovies && popularMovies.results.length > 0 ? (
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
                {popularMovies.results.map(renderMediaCard)}
              </SimpleGrid>
            ) : (
              <Text color="gray.500">No movies found</Text>
            )}
          </TabPanel>

          <TabPanel px={0}>
            {tvLoading ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" color="blue.500" />
              </Flex>
            ) : popularTV && popularTV.results.length > 0 ? (
              <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} spacing={4}>
                {popularTV.results.map(renderMediaCard)}
              </SimpleGrid>
            ) : (
              <Text color="gray.500">No TV shows found</Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Media Details Modal */}
      {selectedMedia && (
        <IosBottomSheet
          title={"title" in selectedMedia ? selectedMedia.title : selectedMedia.name}
          disclosure={detailsDisclosure}
          modalProps={{ size: "xl" }}
        >
          <VStack spacing={4} align="stretch">
            {selectedMedia.posterPath && (
              <Image
                src={largeImage + selectedMedia.posterPath}
                alt={"title" in selectedMedia ? selectedMedia.title : selectedMedia.name}
                rounded="md"
                maxH="400px"
                objectFit="cover"
              />
            )}

            <Box>
              <Text fontSize="sm" color="gray.500" mb={2}>
                {mediaType === "movie" ? "Movie" : "TV Show"} •{" "}
                {"releaseDate" in selectedMedia
                  ? new Date(selectedMedia.releaseDate).getFullYear()
                  : new Date(selectedMedia.firstAirDate).getFullYear()}
              </Text>
              {selectedMedia.overview && (
                <Text fontSize="sm" mb={4}>
                  {selectedMedia.overview}
                </Text>
              )}

              {selectedMedia.genres && selectedMedia.genres.length > 0 && (
                <HStack spacing={2} mb={4} flexWrap="wrap">
                  {selectedMedia.genres.map((genre) => (
                    <Badge key={genre.id} colorScheme="blue">
                      {genre.name}
                    </Badge>
                  ))}
                </HStack>
              )}

              <VStack spacing={2} align="stretch">
                <Text fontSize="sm">
                  <strong>Rating:</strong> {selectedMedia.voteAverage.toFixed(1)}/10 ({selectedMedia.voteCount} votes)
                </Text>
                {mediaType === "tv" && "numberOfSeasons" in selectedMedia && (
                  <Text fontSize="sm">
                    <strong>Seasons:</strong> {selectedMedia.numberOfSeasons}
                  </Text>
                )}
              </VStack>
            </Box>

            {getMediaStatus(selectedMedia) ? (
              <Alert status="info" rounded="md">
                <AlertIcon />
                This media is already {getMediaStatus(selectedMedia)?.label.toLowerCase()} in your library
              </Alert>
            ) : (
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => requestMedia(selectedMedia)}
                isLoading={requesting}
                loadingText="Requesting..."
              >
                Request {mediaType === "movie" ? "Movie" : "TV Show"}
              </Button>
            )}
          </VStack>
        </IosBottomSheet>
      )}
    </Box>
  );
};

export default OverseerrPage;
