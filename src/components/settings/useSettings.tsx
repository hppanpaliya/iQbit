import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TorrSettings } from "../../types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TorrClient } from "../../utils/TorrClient";
import { deepCompare } from "../../utils/deepCompare";

export type SettingsContextType = {
  settings?: TorrSettings;
  updateSetting: <T extends keyof TorrSettings>(
    key: T,
    val: TorrSettings[T]
  ) => void;
  saveSettings: () => void;
  needsSaving: boolean;
  reset: () => void;
};

const SettingsContext = createContext<SettingsContextType>({
  updateSetting: (key, val) => {
    console.log(key, val);
  },
  saveSettings: () => {},
  reset: () => {},
  needsSaving: false,
});

export const useSettingsCtx = () => {
  return useContext(SettingsContext);
};

export const SettingsProvider = (props: PropsWithChildren<{}>) => {
  const [serverSettings, setServerSettings] = useState<TorrSettings>(
    {} as TorrSettings
  );
  const [settings, setSettings] = useState<TorrSettings>({} as TorrSettings);

  const needsSaving = useMemo(() => {
    return !deepCompare(settings, serverSettings);
  }, [settings, serverSettings]);

  const { data: fetchedSettings, refetch } = useQuery({
    queryKey: ["getSettings"],
    queryFn: TorrClient.getSettings,
    refetchOnWindowFocus: !needsSaving,
  });

  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setServerSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  const { mutate } = useMutation({
    mutationKey: ["saveSettings"],
    mutationFn: () => TorrClient.updateSettings(settings || {}),
    onSuccess: () => refetch(),
  });

  function updateSetting<T extends keyof TorrSettings>(
    key: T,
    val: TorrSettings[T]
  ) {
    setSettings((curr) => {
      return { ...curr, [key]: val };
    });
  }

  const reset = () => setSettings(serverSettings);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        saveSettings: mutate,
        needsSaving,
        reset,
      }}
    >
      {props.children}
    </SettingsContext.Provider>
  );
};
