import React, { PropsWithChildren } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  LightMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { useIsLargeScreen } from "../utils/screenSize";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TorrClient } from "../utils/TorrClient";
import { IoCheckmark } from "react-icons/io5";

export interface TorrentDownloadBoxProps {
  title?: string;
  magnetURL?: string;
  onSelect?: () => Promise<string>;
  category?: string;
  savePath?: string;
}

const TorrentDownloadBox = ({
  magnetURL,
  title,
  onSelect,
  children,
  category,
  savePath,
}: PropsWithChildren<TorrentDownloadBoxProps>) => {
  const isLarge = useIsLargeScreen();
  const queryClient = useQueryClient();

  const { mutate, isPending: isLoading, isSuccess } = useMutation({
    mutationKey: ["addBox"],
    mutationFn: (magnetURLParam: string) => TorrClient.addTorrent("urls", magnetURLParam, category, savePath),
    onSuccess: () => {
      // Invalidate torrent queries to show new torrent immediately
      queryClient.invalidateQueries({ queryKey: ["torrentsTxData"] });
    }
  });

  const {
    mutate: callbackMutation,
    isPending: callbackLoading,
    isSuccess: callbackSuccess,
  } = useMutation({
    mutationKey: ["addBoxWithCallback"],
    mutationFn: () => onSelect!(),
    onSuccess: (magnetURL) => mutate(magnetURL),
  });

  const bgColor = useColorModeValue("grayAlpha.200", "grayAlpha.400");

  return (
    <Flex
      p={3}
      bgColor={bgColor}
      width={"100%"}
      justifyContent={"space-between"}
      rounded={6}
      alignItems={"center"}
      gap={3}
      wrap={{ base: "wrap", lg: "nowrap" }}
    >
      <Box flexGrow={2}>
        {title && (
          <Heading wordBreak={"break-all"} size={"md"} mb={2}>
            {title}
          </Heading>
        )}
        {children}
      </Box>
      <LightMode>
        <Flex width={!isLarge ? "100%" : "30%"}>
          <Button
            minW={32}
            disabled={
              isSuccess || callbackSuccess || callbackLoading || isLoading
            }
            isLoading={isLoading || callbackLoading}
            colorScheme={"blue"}
            width={!isLarge ? "100%" : undefined}
            onClick={() => {
              if (magnetURL) {
                mutate(magnetURL);
              } else if (onSelect) {
                callbackMutation();
              }
            }}
            leftIcon={isSuccess ? <IoCheckmark /> : undefined}
            flexGrow={1}
          >
            {isSuccess ? "Added" : "Download"}
          </Button>
        </Flex>
      </LightMode>
    </Flex>
  );
};

export default TorrentDownloadBox;
