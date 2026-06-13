"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  useAddIpWhitelistMutation,
  useCreateSettingsLocationMutation,
  useInvalidatePharmacySettingsPage,
  useIpWhitelist,
  useNotificationPreferences,
  usePharmacySettingsInfo,
  useUpdateNotificationPreferencesMutation,
  useRemoveIpWhitelistMutation,
  useSecuritySettings,
  useSetTwoFaEnabledMutation,
  useSettingsStockLocations,
  useSetupTwoFaMutation,
  useTwoFaStatus,
  useUpdatePharmacySettingsMutation,
  useUpdateSecuritySettingsMutation,
  useVerifyTwoFaMutation,
} from "@/hooks/usePharmacySettingsPage";

export type SettingsPageContextValue = ReturnType<typeof useSettingsPageState>;

const SettingsPageContext = createContext<SettingsPageContextValue | null>(null);

export function useSettingsPage() {
  const ctx = useContext(SettingsPageContext);
  if (!ctx) {
    throw new Error("useSettingsPage must be used within SettingsPageProvider");
  }
  return ctx;
}

function useSettingsPageState() {
  const [pharmacyInfo, setPharmacyInfo] = useState({
    name: "",
    license: "",
    location: "",
    phone: "",
    email: "",
    currency: "RWF",
    language: "en",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");
  const [newLocation, setNewLocation] = useState({ name: "", description: "" });
  const [isIpWhitelistOpen, setIsIpWhitelistOpen] = useState(false);
  const [newIp, setNewIp] = useState({ ip: "", description: "" });
  const [editInfo, setEditInfo] = useState({
    name: "",
    location: "",
    phone: "",
    email: "",
    currency: "RWF",
    language: "en",
  });

  const [notifyPrefs, setNotifyPrefs] = useState({
    dailyUpdate: true,
    lowStock: true,
    expiry: true,
    salesReports: false,
    systemUpdates: true,
    email: true,
    desktop: true,
    push: false,
  });

  const settingsQuery = usePharmacySettingsInfo();
  const notificationPrefsQuery = useNotificationPreferences();
  const securityQuery = useSecuritySettings();
  const ipWhitelistQuery = useIpWhitelist();
  const twoFaQuery = useTwoFaStatus();
  const locationsQuery = useSettingsStockLocations();
  const invalidateSettings = useInvalidatePharmacySettingsPage();

  const updateSettingsMutation = useUpdatePharmacySettingsMutation();
  const updateNotificationPrefsMutation = useUpdateNotificationPreferencesMutation();
  const setTwoFaMutation = useSetTwoFaEnabledMutation();
  const setupTwoFaMutation = useSetupTwoFaMutation();
  const verifyTwoFaMutation = useVerifyTwoFaMutation();
  const updateSecurityMutation = useUpdateSecuritySettingsMutation();
  const addIpMutation = useAddIpWhitelistMutation();
  const removeIpMutation = useRemoveIpWhitelistMutation();
  const createLocationMutation = useCreateSettingsLocationMutation();

  const stockLocations = locationsQuery.data ?? [];
  const platformAllowsTwoFactor =
    twoFaQuery.data?.platformAllowsTwoFactor !== false;
  const is2FAEnabled =
    platformAllowsTwoFactor && (twoFaQuery.data?.enabled ?? false);
  const ipWhitelistEnabled =
    securityQuery.data?.ip_whitelist_enabled ?? false;
  const loading =
    settingsQuery.isPending ||
    notificationPrefsQuery.isPending ||
    securityQuery.isPending ||
    ipWhitelistQuery.isPending ||
    twoFaQuery.isPending ||
    locationsQuery.isPending;

  useEffect(() => {
    if (settingsQuery.data) {
      const data = settingsQuery.data;
      const info = {
        name: data.name ?? "",
        license: data.license ?? "",
        location: data.location ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        currency: data.currency || "RWF",
        language: data.language || "en",
      };
      setPharmacyInfo(info);
      setEditInfo({
        name: data.name,
        location: data.location,
        phone: data.phone,
        email: data.email,
        currency: data.currency || "RWF",
        language: data.language || "en",
      });
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    if (notificationPrefsQuery.data) {
      setNotifyPrefs(notificationPrefsQuery.data);
    }
  }, [notificationPrefsQuery.data]);

  const saveNotifyPrefs = async (
    next: typeof notifyPrefs,
    successMessage = "Notification preferences saved",
  ) => {
    setNotifyPrefs(next);
    try {
      await updateNotificationPrefsMutation.mutateAsync(next);
      toast.success(successMessage);
    } catch {
      toast.error("Failed to save notification preferences");
      void notificationPrefsQuery.refetch();
    }
  };

  useEffect(() => {
    const onFocus = () => void invalidateSettings();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [invalidateSettings]);

  const handleSaveEdit = async () => {
    try {
      await updateSettingsMutation.mutateAsync(editInfo);
      setPharmacyInfo({ ...pharmacyInfo, ...editInfo });
      setIsEditing(false);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const handleAddLocation = async () => {
    try {
      await createLocationMutation.mutateAsync(newLocation);
      setIsAddLocationOpen(false);
      setNewLocation({ name: "", description: "" });
      toast.success("Location added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add location",
      );
    }
  };

  return {
    loading,
    pharmacyInfo,
    editInfo,
    setEditInfo,
    isEditing,
    setIsEditing,
    handleSaveEdit,
    notifyPrefs,
    setNotifyPrefs,
    saveNotifyPrefs,
    stockLocations,
    is2FAEnabled,
    platformAllowsTwoFactor,
    is2FASetupOpen,
    setIs2FASetupOpen,
    qrCode,
    setQrCode,
    backupCodes,
    setBackupCodes,
    verifyCode,
    setVerifyCode,
    setupStep,
    setSetupStep,
    setTwoFaMutation,
    twoFaQuery,
    setupTwoFaMutation,
    verifyTwoFaMutation,
    isAddLocationOpen,
    setIsAddLocationOpen,
    newLocation,
    setNewLocation,
    handleAddLocation,
    ipWhitelistEnabled,
    ipWhitelist: ipWhitelistQuery.data?.ips ?? [],
    currentIp: ipWhitelistQuery.data?.currentIp ?? null,
    isIpWhitelistOpen,
    setIsIpWhitelistOpen,
    newIp,
    setNewIp,
    updateSecurityMutation,
    addIpMutation,
    removeIpMutation,
  };
}

export function SettingsPageProvider({ children }: { children: ReactNode }) {
  const value = useSettingsPageState();
  return (
    <SettingsPageContext.Provider value={value}>
      {children}
    </SettingsPageContext.Provider>
  );
}
