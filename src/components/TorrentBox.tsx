import React, { memo, useEffect, useState } from "react";
import {
  Box,
  BoxProps,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  LightMode,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Skeleton,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { TorrCategory, TorrTorrentInfo, TorrFilePriority } from "../types";
import stateDictionary from "../utils/StateDictionary";
import filesize from "filesize";
import {
  IoCalendar,
  IoCloudUpload,
  IoDownload,
  IoOptions,
  IoPause,
  IoPlay,
  IoPricetags,
  IoServer,
  IoSpeedometer,
} from "react-icons/io5";
import { StatWithIcon } from "./StatWithIcon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TorrClient } from "../utils/TorrClient";
import IosActionSheet from "./ios/IosActionSheet";
import IosBottomSheet from "./ios/IosBottomSheet";
import { Input } from "@chakra-ui/input";
import TorrentInformationContent from "./TorrentInformationContent";
import FileList from "./FileList";
import { CreateETAString } from "../utils/createETAString";

export interface TorrentBoxProps {
  torrentData: Omit<TorrTorrentInfo, "hash">;
  hash: string;
  categories: TorrCategory[];
  loading?: boolean;
  style?: any;
  isSelected?: boolean;
  selectionMode?: boolean;
  toggleSelection?: (hash: string) => void;
}

const TorrentBox = ({
  torrentData,
  hash,
  categories,
  loading,
  style,
  isSelected,
  selectionMode,
  toggleSelection,
}: TorrentBoxProps) => {
  const BoxBg = useColorModeValue("white", "gray.900");

  const isDone = (torrentData.progress || 0) >= 1;

  const isPaused = ["pausedDL", "pausedUP", "stoppedUP", "stoppedDL"].includes(
    torrentData.state
  );

  const isDownloading = [
    "downloading",
    "metaDL",
    "queuedDL",
    "stalledDL",
    "checkingDL",
    "forceDL",
    "checkingResumeData",
    "allocating",
  ].includes(torrentData.state);

  const date = new Date(0);
  date.setSeconds(torrentData.eta); // specify value for SECONDS here
  const timeString = torrentData.eta ? CreateETAString(date) : "";

  const [waiting, setWaiting] = useState<
    | ""
    | "mainBtn"
    | "category"
    | "name"
    | "sequential"
    | "firstLastPriority"
    | "autoManagement"
    | "recheck"
    | "reannounce"
    | "location"
    | "downloadLimit"
    | "uploadLimit"
  >();

  useEffect(() => {
    setWaiting("");
  }, [
    torrentData.state,
    torrentData.category,
    torrentData.name,
    torrentData.seq_dl,
    torrentData.f_l_piece_prio,
    torrentData.auto_tmm,
  ]);

  const queryClient = useQueryClient();

  const { mutate: pause } = useMutation({
    mutationKey: ["pauseTorrent"],
    mutationFn: () => TorrClient.pause(hash),
    onMutate: () => setWaiting("mainBtn"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const { mutate: resume } = useMutation({
    mutationKey: ["resumeTorrent"],
    mutationFn: () => TorrClient.resume(hash),
    onMutate: () => setWaiting("mainBtn"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const deleteConfirmationDisclosure = useDisclosure();
  const { mutate: remove } = useMutation({
    mutationKey: ["deleteTorrent"],
    mutationFn: (deleteFiles: boolean) => TorrClient.remove(hash, deleteFiles),
    onMutate: () => setWaiting("mainBtn"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const categoryChangeDisclosure = useDisclosure();
  const { mutate: changeCategory } = useMutation({
    mutationKey: ["changeCategory"],
    mutationFn: (category: string) => TorrClient.setTorrentCategory(hash, category),
    onMutate: () => setWaiting("category"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const [newName, setNewName] = useState(torrentData.name);
  const renameTorrentDisclosure = useDisclosure();
  const { mutate: renameTorrent, isPending: renameLoading } = useMutation({
    mutationKey: ["changeCategory"],
    mutationFn: () => TorrClient.renameTorrent(hash, newName),
    onMutate: () => setWaiting("name"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      renameTorrentDisclosure.onClose();
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const { mutate: toggleSequentialDownload } = useMutation({
    mutationKey: ["sequential-download"],
    mutationFn: () => TorrClient.toggleSequentialDownload(hash),
    onMutate: () => setWaiting("sequential"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const { mutate: toggleFirstLastPiecePrio } = useMutation({
    mutationKey: ["first-last-priority"],
    mutationFn: () => TorrClient.toggleFirstLastPiecePrio(hash),
    onMutate: () => setWaiting("firstLastPriority"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const { mutate: toggleAutoManagement } = useMutation({
    mutationKey: ["first-last-priority"],
    mutationFn: async () => {
      return TorrClient.setAutoManagement(
        hash,
        (!torrentData.auto_tmm).toString()
      );
    },
    onMutate: () => setWaiting("autoManagement"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const { mutate: recheck } = useMutation({
    mutationKey: ["recheck"],
    mutationFn: () => TorrClient.recheck(hash),
    onMutate: () => setWaiting("recheck"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const { mutate: reannounce } = useMutation({
    mutationKey: ["reannounce"],
    mutationFn: () => TorrClient.reannounce(hash),
    onMutate: () => setWaiting("reannounce"),
    onError: () => setWaiting(""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    },
  });

  const TorrentInformationDisclosure = useDisclosure();

  const moveDisclosure = useDisclosure();
  const [newLocation, setNewLocation] = useState("");
  const [moveFiles, setMoveFiles] = useState(true);
  const { mutate: setLocationMutation, isPending: locationLoading } = useMutation({
    mutationKey: ["setLocation"],
    mutationFn: () => TorrClient.setLocation(hash, newLocation, moveFiles),
    onMutate: () => setWaiting("location"),
    onError: () => setWaiting(""),
    onSuccess: () => moveDisclosure.onClose(),
  });

  const setDownloadLimitDisclosure = useDisclosure();
  const [downloadLimit, setDownloadLimit] = useState("");
  const { mutate: setDownloadLimitMutation, isPending: downloadLimitLoading } = useMutation({
    mutationKey: ["setDownloadLimit"],
    mutationFn: () => TorrClient.setDownloadLimit(hash, downloadLimit),
    onMutate: () => setWaiting("downloadLimit"),
    onError: () => setWaiting(""),
    onSuccess: () => setDownloadLimitDisclosure.onClose(),
  });

  const setUploadLimitDisclosure = useDisclosure();
  const [uploadLimit, setUploadLimit] = useState("");
  const { mutate: setUploadLimitMutation, isPending: uploadLimitLoading } = useMutation({
    mutationKey: ["setUploadLimit"],
    mutationFn: () => TorrClient.setUploadLimit(hash, uploadLimit),
    onMutate: () => setWaiting("uploadLimit"),
    onError: () => setWaiting(""),
    onSuccess: () => setUploadLimitDisclosure.onClose(),
  });

  // File operations
  const filesDisclosure = useDisclosure();
  const { data: torrentFiles = [], isLoading: filesLoading } = useQuery({
    queryKey: ["torrentFiles", hash],
    queryFn: () => TorrClient.getTorrentContents(hash),
    enabled: filesDisclosure.isOpen,
    refetchInterval: filesDisclosure.isOpen ? 5000 : false,
  });

  const { mutate: setFilePriority } = useMutation({
    mutationKey: ["setFilePriority"],
    mutationFn: ({ fileIndex, priority }: { fileIndex: number; priority: TorrFilePriority }) =>
      TorrClient.setFilePriority(hash, fileIndex, priority),
  });

  const { mutate: setFilePriorities } = useMutation({
    mutationKey: ["setFilePriorities"],
    mutationFn: ({
      fileIndices,
      priority,
    }: {
      fileIndices: number[];
      priority: TorrFilePriority;
    }) => TorrClient.setFilePriorities(hash, fileIndices, priority),
  });

  const actionSheetDisclosure = useDisclosure();

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isLongPress, setIsLongPress] = useState(false);

  const handleInteractionStart = () => {
    setIsLongPress(false);
    const timer = setTimeout(() => {
      if (toggleSelection) {
        setIsLongPress(true);
        toggleSelection(hash);
        if (navigator.vibrate) navigator.vibrate(50);
      }
    }, 500);
    setLongPressTimer(timer);
  };

  const handleInteractionEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (selectionMode && toggleSelection) {
      e.preventDefault();
      e.stopPropagation();
      toggleSelection(hash);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    actionSheetDisclosure.onOpen();
  };

  const selectedBg = useColorModeValue("blue.50", "whiteAlpha.200");

  if (loading) {
    return <LoadingCard style={style} />;
  }

  return (
    <div
      style={style}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onClickCapture={handleClick}
      onContextMenu={handleContextMenu}
    >
      <Box
        px={5}
        py={4}
        rounded={"xl"}
        bgColor={isSelected ? selectedBg : BoxBg}
        mb={5}
        border={isSelected ? "2px solid" : undefined}
        borderColor={"blue.500"}
        transition={"all 0.2s"}
        transform={isSelected ? "scale(0.98)" : undefined}
      >
        <Popover placement={"top"}>
          <PopoverTrigger>
            <Flex alignItems={"center"}>
              <Heading
                textAlign={"left"}
                cursor={"pointer"}
                noOfLines={1}
                size={"lg"}
                _hover={{ base: {}, lg: { opacity: 0.7 } }}
              >
                {torrentData.name}
              </Heading>
              {waiting === "name" && (
                <Flex>
                  <Spinner size={"sm"} />
                </Flex>
              )}
            </Flex>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverBody textAlign={"center"}>{torrentData.name}</PopoverBody>
          </PopoverContent>
        </Popover>
        <HStack color={"grayAlpha.800"} gap={2}>
          <StatWithIcon
            icon={<IoCalendar />}
            label={new Date(torrentData.added_on * 1000).toLocaleDateString()}
          />
          <StatWithIcon
            icon={<IoServer />}
            label={filesize(torrentData.total_size, { round: 1 })}
          />
          <StatWithIcon
            loading={waiting === "category"}
            icon={<IoPricetags />}
            label={torrentData.category || "–"}
          />
        </HStack>
        <Flex mt={5} mb={2} justifyContent={"space-between"} alignItems={"end"}>
          <HStack alignItems={"end"}>
            <Heading color={"blue.500"} size={"lg"}>
              {(100 * torrentData.progress).toFixed(0)}%
            </Heading>
            {!isDone && (
              <Text color={"grayAlpha.600"}>
                {filesize(torrentData.downloaded, { round: 1 })}
              </Text>
            )}
          </HStack>
          <Heading size={"md"} opacity={0.25}>
            {torrentData.eta !== 8640000 ? (
              <span>{timeString}</span>
            ) : (
              <span>
                {stateDictionary[torrentData.state]?.short ?? torrentData.state}
              </span>
            )}
          </Heading>
        </Flex>
        <LightMode>
          <Progress
            rounded={100}
            size={"sm"}
            value={100 * torrentData.progress}
            color={"blue.500"}
          />
        </LightMode>
        <Flex justifyContent={"flex-end"} alignItems={"center"} mt={3}>
          {isPaused || (
            <Flex alignItems={"center"} gap={4} flexGrow={2}>
              <StatWithIcon
                lit={
                  isDownloading
                    ? torrentData.num_seeds > 0
                    : isDone
                    ? torrentData.num_leechs > 0
                    : false
                }
                icon={
                  isDownloading ? (
                    <IoDownload size={25} />
                  ) : (
                    <IoCloudUpload size={20} />
                  )
                }
                label={
                  isDownloading
                    ? torrentData.num_seeds
                    : isDone
                    ? torrentData.num_leechs
                    : 0
                }
              />
              <StatWithIcon
                lit={isDone ? torrentData.upspeed > 0 : torrentData.dlspeed > 0}
                icon={<IoSpeedometer />}
                label={
                  (isPaused
                    ? 0
                    : isDone
                    ? filesize(torrentData.upspeed, { round: 1 })
                    : filesize(torrentData.dlspeed, { round: 1 })) + "/s"
                }
              />
            </Flex>
          )}
          <Flex gap={0.5}>
            <IosActionSheet
              trigger={
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  px="16px"
                >
                  <IoOptions size={25} />
                </Box>
              }
              disclosure={actionSheetDisclosure}
              options={[
                {
                  label: "Remove Torrent",
                  onClick: () => deleteConfirmationDisclosure.onOpen(),
                  danger: true,
                },
                {
                  label: "Change Category",
                  onClick: () => categoryChangeDisclosure.onOpen(),
                },
                {
                  label: "Rename Torrent",
                  onClick: () => renameTorrentDisclosure.onOpen(),
                },
                {
                  label: `Sequential Download`,
                  onClick: toggleSequentialDownload,
                  checked: torrentData.seq_dl,
                },
                {
                  label: "First and Last piece first",
                  onClick: toggleFirstLastPiecePrio,
                  checked: torrentData.f_l_piece_prio,
                },
                {
                  label: "Automatic management",
                  onClick: toggleAutoManagement,
                  checked: torrentData.auto_tmm,
                },
                {
                  label: "Recheck Torrent",
                  onClick: () => recheck(),
                },
                {
                  label: "Reannounce Torrent",
                  onClick: () => reannounce(),
                },
                {
                  label: "Manage Files",
                  onClick: () => filesDisclosure.onOpen(),
                },
                {
                  label: "Move to Location",
                  onClick: () => moveDisclosure.onOpen(),
                },
                {
                  label: "Set Download Limit",
                  onClick: () => setDownloadLimitDisclosure.onOpen(),
                },
                {
                  label: "Set Upload Limit",
                  onClick: () => setUploadLimitDisclosure.onOpen(),
                },
                {
                  label: "Torrent Information",
                  onClick: () => TorrentInformationDisclosure.onOpen(),
                },
              ]}
            />
            <IosActionSheet
              disclosure={deleteConfirmationDisclosure}
              options={[
                {
                  label: "Delete Files",
                  onClick: () => remove(true),
                  danger: true,
                },
                {
                  label: "Remove Torrent Only",
                  onClick: () => remove(false),
                },
              ]}
            />
            <IosActionSheet
              disclosure={categoryChangeDisclosure}
              options={categories
                .filter((cat) => torrentData.category !== cat.name)
                .map((cat) => ({
                  label: cat.name,
                  onClick: () => changeCategory(cat.name),
                }))}
            />
            {isPaused ? (
              <LightMode>
                <Button
                  size={"md"}
                  colorScheme={"blue"}
                  onClick={() => resume()}
                  isLoading={waiting === "mainBtn"}
                >
                  <IoPlay size={25} />
                </Button>
              </LightMode>
            ) : (
              <Button
                size={"md"}
                variant={"ghost"}
                color={"blue.500"}
                onClick={() => pause()}
                isLoading={waiting === "mainBtn"}
              >
                <IoPause size={25} />
              </Button>
            )}
          </Flex>
        </Flex>
      </Box>
      <IosBottomSheet
        title={"Rename Torrent"}
        disclosure={renameTorrentDisclosure}
        modalProps={{ size: "lg" }}
      >
        <VStack gap={6}>
          <FormControl>
            <FormLabel>New Name</FormLabel>
            <Input
              disabled={renameLoading}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
            />
          </FormControl>
          <LightMode>
            <Button
              disabled={newName === torrentData.name || !newName.trim()}
              w={"100%"}
              onClick={() => renameTorrent()}
              isLoading={renameLoading}
            >
              Save New Name
            </Button>
          </LightMode>
        </VStack>
      </IosBottomSheet>
      <IosBottomSheet
        title={"Torrent Information"}
        disclosure={TorrentInformationDisclosure}
        modalProps={{ size: "3xl" }}
      >
        <TorrentInformationContent torrentData={{ ...torrentData, hash }} />
      </IosBottomSheet>
      <IosBottomSheet
        title={"Manage Files"}
        disclosure={filesDisclosure}
        modalProps={{ size: "4xl" }}
      >
        <FileList
          files={torrentFiles}
          loading={filesLoading}
          onSetPriority={(fileIndex, priority) =>
            new Promise((resolve, reject) => {
              setFilePriority(
                { fileIndex, priority },
                {
                  onSuccess: () => resolve(),
                  onError: reject,
                }
              );
            })
          }
          onSetMultiplePriorities={(fileIndices, priority) =>
            new Promise((resolve, reject) => {
              setFilePriorities(
                { fileIndices, priority },
                {
                  onSuccess: () => resolve(),
                  onError: reject,
                }
              );
            })
          }
        />
      </IosBottomSheet>
      <IosBottomSheet
        title={"Move to Location"}
        disclosure={moveDisclosure}
        modalProps={{ size: "lg" }}
      >
        <VStack gap={6}>
          <FormControl>
            <FormLabel>Current Location</FormLabel>
            <Box
              p={3}
              borderRadius="md"
              bg="grayAlpha.200"
              wordBreak="break-all"
              fontSize="sm"
            >
              {torrentData.save_path || torrentData.content_path || "Unknown"}
            </Box>
          </FormControl>
          <FormControl>
            <FormLabel>New Location</FormLabel>
            <Input
              disabled={locationLoading}
              placeholder="/path/to/move"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
            <FormHelperText fontSize={"sm"} textAlign={"center"}>
              Move the torrent to a new location
            </FormHelperText>
          </FormControl>
          <FormControl display="flex" alignItems="center">
            <input
              type="checkbox"
              checked={moveFiles}
              onChange={(e) => setMoveFiles(e.target.checked)}
              disabled={locationLoading}
              style={{ marginRight: "8px", cursor: "pointer" }}
            />
            <FormLabel mb={0} cursor="pointer">
              Move files to new location
            </FormLabel>
          </FormControl>
          <LightMode>
            <Button
              disabled={!newLocation || newLocation.trim() === ""}
              w={"100%"}
              onClick={() => setLocationMutation()}
              isLoading={locationLoading}
            >
              Move Torrent
            </Button>
          </LightMode>
        </VStack>
      </IosBottomSheet>
      <IosBottomSheet
        title={"Set Download Limit"}
        disclosure={setDownloadLimitDisclosure}
        modalProps={{ size: "lg" }}
      >
        <VStack gap={6}>
          <FormControl>
            <FormLabel>Download Limit (bytes/s)</FormLabel>
            <Input
              disabled={downloadLimitLoading}
              placeholder="0 for unlimited"
              type="number"
              value={downloadLimit}
              onChange={(e) => setDownloadLimit(e.target.value)}
            />
            <FormHelperText fontSize={"sm"} textAlign={"center"}>
              Enter 0 for unlimited download speed
            </FormHelperText>
          </FormControl>
          <LightMode>
            <Button
              disabled={downloadLimit === ""}
              w={"100%"}
              onClick={() => setDownloadLimitMutation()}
              isLoading={downloadLimitLoading}
            >
              Set Download Limit
            </Button>
          </LightMode>
        </VStack>
      </IosBottomSheet>
      <IosBottomSheet
        title={"Set Upload Limit"}
        disclosure={setUploadLimitDisclosure}
        modalProps={{ size: "lg" }}
      >
        <VStack gap={6}>
          <FormControl>
            <FormLabel>Upload Limit (bytes/s)</FormLabel>
            <Input
              disabled={uploadLimitLoading}
              placeholder="0 for unlimited"
              type="number"
              value={uploadLimit}
              onChange={(e) => setUploadLimit(e.target.value)}
            />
            <FormHelperText fontSize={"sm"} textAlign={"center"}>
              Enter 0 for unlimited upload speed
            </FormHelperText>
          </FormControl>
          <LightMode>
            <Button
              disabled={uploadLimit === ""}
              w={"100%"}
              onClick={() => setUploadLimitMutation()}
              isLoading={uploadLimitLoading}
            >
              Set Upload Limit
            </Button>
          </LightMode>
        </VStack>
      </IosBottomSheet>
    </div>
  );
};

const LoadingCard = memo(_LoadingCard, () => true);

function _LoadingCard(props: BoxProps) {
  const BoxBg = useColorModeValue("white", "gray.900");

  return (
    <Box {...props}>
      <Box px={5} py={4} rounded={"xl"} bgColor={BoxBg} mb={5}>
        <Skeleton
          height={5}
          width={(Math.random() * (100 - 40) + 40).toString() + "%"}
        />
        <Flex mt={2} gap={2}>
          <Skeleton height={4} width={24} />
          <Skeleton height={4} width={16} />
          <Skeleton height={4} width={12} />
        </Flex>
        <Flex
          mt={4}
          gap={2}
          justifyContent={"space-between"}
          alignItems={"end"}
        >
          <Skeleton height={8} width={16} />
          <Skeleton height={5} width={20} />
        </Flex>
        <Skeleton mt={2} height={3} width={"100%"} />
        <Flex mt={4} justifyContent={"space-between"} alignItems={"center"}>
          <Flex gap={2}>
            <Skeleton height={4} width={16} />
            <Skeleton height={4} width={24} />
          </Flex>
          <Flex gap={2}>
            <Skeleton height={8} width={12} />
            <Skeleton height={8} width={12} />
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}

export default TorrentBox;
