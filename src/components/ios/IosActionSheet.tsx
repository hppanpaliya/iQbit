import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorModeValue,
  UseDisclosureReturn,
} from "@chakra-ui/react";
import React, { PropsWithChildren, ReactElement, useEffect, useRef, useState } from "react";
import { IoCheckmark } from "react-icons/io5";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { useIsTouchDevice } from "../../hooks/useIsTouchDevice";

export type IosActionSheetOptions = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  checked?: boolean;
};

export interface IosActionSheetProps<Y> {
  disclosure: UseDisclosureReturn;
  options: IosActionSheetOptions[];
  trigger?: ReactElement<Y>;
}

function IosActionSheet<Y>({
  options,
  disclosure,
  trigger,
}: PropsWithChildren<IosActionSheetProps<Y>>) {
  const ButtonBgColorHover = useColorModeValue(
    "grayAlpha.300",
    "grayAlpha.900"
  );
  const isTouchDevice = useIsTouchDevice();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setShowUp(scrollTop > 0);
      setShowDown(scrollTop + clientHeight < scrollHeight);
    }
  };

  useEffect(() => {
    if (disclosure.isOpen && scrollRef.current) {
      checkScroll();
    }
  }, [disclosure.isOpen]);

  // Use Drawer for mobile/touch devices, Menu for desktop
  if (isTouchDevice) {
    const triggerWithToggle = trigger ? React.cloneElement(trigger, {
      onClick: (e) => {
        e.stopPropagation();
        disclosure.onToggle();
      }
    }) : null;
    return (
      <>
        {triggerWithToggle}
        <Drawer
          isOpen={disclosure.isOpen}
          onClose={disclosure.onClose}
          placement="bottom"
        >
          <DrawerOverlay />
          <DrawerContent
            backgroundColor={"transparent"}
            boxShadow={"none"}
            roundedTop={20}
            maxHeight="60vh"
          >
            <DrawerBody p={0}>
              <Box
                className={"glassEffect"}
                rounded={20}
                border={"none"}
                shadow={"xl"}
                m={3}
                mt={2}
                overflow={"hidden"}
                position="relative"
              >
                <Box className={"glassTint"} />
                <Box className={"glassShine"} />
                {/* Top scroll indicator */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  py={1}
                  display={showUp ? "flex" : "none"}
                  justifyContent="center"
                  zIndex={10}
                  pointerEvents="none"
                >
                  <Icon color="rgba(255,255,255,0.6)" fontSize="xl">
                    <IoChevronUp />
                  </Icon>
                </Box>
                <Box
                  ref={scrollRef}
                  onScroll={checkScroll}
                  py={3}
                  px={3}
                  maxHeight="55vh"
                  overflowY="auto"
                  sx={{
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
                  }}
                  pt={6}
                >
                  {[...options].reverse().map((option, index) => (
                    <Box
                      key={index}
                      onClick={() => {
                        disclosure.onClose();
                        option.onClick();
                      }}
                      color={option?.danger ? "red.500" : "text"}
                      p={3}
                      rounded={10}
                      cursor="pointer"
                      _hover={{
                        bgColor: ButtonBgColorHover,
                      }}
                      fontWeight={400}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      fontSize="md"
                    >
                      {option.label}
                      {option.checked && (
                        <Icon fontSize={"lg"} ml={3}>
                          <IoCheckmark />
                        </Icon>
                      )}
                    </Box>
                  ))}
                </Box>
                {/* Bottom scroll indicator */}
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  py={1}
                  display={showDown ? "flex" : "none"}
                  justifyContent="center"
                  zIndex={10}
                  pointerEvents="none"
                  background="linear-gradient(to bottom, transparent, rgba(0,0,0,0.2))"
                >
                  <Icon color="rgba(255,255,255,0.6)" fontSize="xl">
                    <IoChevronDown />
                  </Icon>
                </Box>
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop version - Menu
  const triggerWithoutOnClick = trigger ? React.cloneElement(trigger, { }) : null;
  return (
    <>
      <Menu
        isOpen={disclosure.isOpen}
        onClose={disclosure.onClose}
        placement={"auto-start"}
      >
        <MenuButton onClick={disclosure.onToggle} _hover={{ bg: "grayAlpha.200" }} borderRadius="md">{triggerWithoutOnClick}</MenuButton>
        <MenuList
          overflow={"visible"}
          backgroundColor={"transparent"}
          className={"glassEffect"}
          rounded={12}
          zIndex={1000}
          border={"none"}
          shadow={"lg"}
          p={0}
          minWidth="auto"
          width="fit-content"
        >
          <Box className={"glassTint"} />
          <Box className={"glassShine"} />

          <Box py={2} px={2}>
            {[...options].reverse().map((option, index) => (
              <MenuItem
                key={index}
                onClick={() => {
                  disclosure.onClose();
                  option.onClick();
                }}
                color={option?.danger ? "red.500" : "text"}
                justifyContent={"space-between"}
                backgroundColor={"transparent"}
                p={2}
                px={3}
                rounded={8}
                whiteSpace={"nowrap"}
                _hover={{
                  bgColor: ButtonBgColorHover,
                }}
                fontWeight={400}
                fontSize="sm"
              >
                {option.label}
                {option.checked && (
                  <Icon fontSize={"md"} ml={3}>
                    <IoCheckmark />
                  </Icon>
                )}
              </MenuItem>
            ))}
          </Box>
        </MenuList>
      </Menu>
    </>
  );
}

export default IosActionSheet;