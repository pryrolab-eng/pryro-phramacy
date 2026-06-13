"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  adminSystemSettingsQueryKey,
  useAdminApiKeys,
  useAdminIpWhitelist,
  useAdminSystemSettings,
  useAddAdminIpWhitelistMutation,
  useCreateAdminApiKeyMutation,
  useCreateStockLocationMutation,
  useRemoveAdminIpWhitelistMutation,
  useStockLocations,
  useUpdateAdminApiKeyMutation,
  type AdminApiKeyRow,
} from "@/hooks";
import {
  useSetTwoFaEnabledMutation,
  useSetupTwoFaMutation,
  useTwoFaStatus,
  useVerifyTwoFaMutation,
} from "@/hooks/usePharmacySettingsPage";
import { updateAdminSystemSettings } from "@/lib/http/admin/system-settings";
import { parseNumberSetting } from "@/lib/platform-settings";
import {
  defaultAdminPlatformSettings,
  type AdminPlatformSettings,
} from "@/components/admin/settings/admin-settings-types";

export type AdminSettingsContextValue = {
  settings: AdminPlatformSettings;
  setSettings: Dispatch<SetStateAction<AdminPlatformSettings>>;
  analytics: {
    active_pharmacies: number;
    total_users: number;
    total_pharmacies: number;
    new_users_30d: number;
  };
  stockLocations: Array<{ id: string; name: string; description?: string | null }>;
  apiKeys: AdminApiKeyRow[];
  ipWhitelist: Array<{
    id: string;
    ip_address: string;
    description?: string | null;
  }>;
  is2FAEnabled: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  handleSave: () => Promise<void>;
  isAddLocationOpen: boolean;
  setIsAddLocationOpen: (open: boolean) => void;
  newLocation: { name: string; description: string };
  setNewLocation: Dispatch<SetStateAction<{ name: string; description: string }>>;
  handleAddLocation: () => void;
  createLocationPending: boolean;
  isAddApiKeyOpen: boolean;
  setIsAddApiKeyOpen: (open: boolean) => void;
  isEditApiKeyOpen: boolean;
  setIsEditApiKeyOpen: (open: boolean) => void;
  newApiKey: { name: string; key: string; permissions: string[] };
  setNewApiKey: Dispatch<
    SetStateAction<{ name: string; key: string; permissions: string[] }>
  >;
  selectedApiKey: (AdminApiKeyRow & { status?: string; key?: string }) | null;
  setSelectedApiKey: Dispatch<
    SetStateAction<(AdminApiKeyRow & { status?: string; key?: string }) | null>
  >;
  createApiKeyMutation: ReturnType<typeof useCreateAdminApiKeyMutation>;
  updateApiKeyMutation: ReturnType<typeof useUpdateAdminApiKeyMutation>;
  isIpWhitelistOpen: boolean;
  setIsIpWhitelistOpen: (open: boolean) => void;
  newIp: { ip: string; description: string };
  setNewIp: Dispatch<SetStateAction<{ ip: string; description: string }>>;
  addIpMutation: ReturnType<typeof useAddAdminIpWhitelistMutation>;
  removeIpMutation: ReturnType<typeof useRemoveAdminIpWhitelistMutation>;
  is2FASetupOpen: boolean;
  setIs2FASetupOpen: (open: boolean) => void;
  qrCode: string;
  setQrCode: Dispatch<SetStateAction<string>>;
  backupCodes: string[];
  setBackupCodes: Dispatch<SetStateAction<string[]>>;
  verifyCode: string;
  setVerifyCode: Dispatch<SetStateAction<string>>;
  setupStep: "qr" | "verify" | "backup";
  setSetupStep: Dispatch<SetStateAction<"qr" | "verify" | "backup">>;
  setTwoFaMutation: ReturnType<typeof useSetTwoFaEnabledMutation>;
  setupTwoFaMutation: ReturnType<typeof useSetupTwoFaMutation>;
  verifyTwoFaMutation: ReturnType<typeof useVerifyTwoFaMutation>;
  twoFaQuery: ReturnType<typeof useTwoFaStatus>;
  pageLoading: boolean;
};

const AdminSettingsContext = createContext<AdminSettingsContextValue | null>(null);

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) {
    throw new Error("useAdminSettings must be used within AdminSettingsProvider");
  }
  return ctx;
}

function useAdminSettingsState(): AdminSettingsContextValue {
  const queryClient = useQueryClient();
  const settingsQuery = useAdminSystemSettings();
  const locationsQuery = useStockLocations();
  const apiKeysQuery = useAdminApiKeys();
  const twoFaQuery = useTwoFaStatus();
  const ipWhitelistQuery = useAdminIpWhitelist();
  const createLocationMutation = useCreateStockLocationMutation();
  const createApiKeyMutation = useCreateAdminApiKeyMutation();
  const updateApiKeyMutation = useUpdateAdminApiKeyMutation();
  const addIpMutation = useAddAdminIpWhitelistMutation();
  const removeIpMutation = useRemoveAdminIpWhitelistMutation();
  const setTwoFaMutation = useSetTwoFaEnabledMutation();
  const setupTwoFaMutation = useSetupTwoFaMutation();
  const verifyTwoFaMutation = useVerifyTwoFaMutation();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddApiKeyOpen, setIsAddApiKeyOpen] = useState(false);
  const [isEditApiKeyOpen, setIsEditApiKeyOpen] = useState(false);
  const [isIpWhitelistOpen, setIsIpWhitelistOpen] = useState(false);
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: "", description: "" });
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    key: "",
    permissions: [] as string[],
  });
  const [newIp, setNewIp] = useState({ ip: "", description: "" });
  const [selectedApiKey, setSelectedApiKey] = useState<
    (AdminApiKeyRow & { status?: string; key?: string }) | null
  >(null);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");
  const [settings, setSettings] = useState(defaultAdminPlatformSettings);
  const [analytics, setAnalytics] = useState({
    active_pharmacies: 0,
    total_users: 0,
    total_pharmacies: 0,
    new_users_30d: 0,
  });

  useEffect(() => {
    const payload = settingsQuery.data;
    if (!payload) return;
    if (payload.settings) {
      const raw = payload.settings as Partial<AdminPlatformSettings>;
      setSettings((prev) => ({
        ...prev,
        ...raw,
        apiRateLimit: parseNumberSetting(raw.apiRateLimit, prev.apiRateLimit),
        maxPharmacies: parseNumberSetting(raw.maxPharmacies, prev.maxPharmacies),
        maxUsersPerPharmacy: parseNumberSetting(
          raw.maxUsersPerPharmacy,
          prev.maxUsersPerPharmacy,
        ),
        dataRetentionDays: parseNumberSetting(
          raw.dataRetentionDays,
          prev.dataRetentionDays,
        ),
      }));
    }
    if (payload.analytics) {
      setAnalytics(payload.analytics);
    }
  }, [settingsQuery.data]);

  const is2FAEnabled = twoFaQuery.data?.enabled ?? false;
  const pageLoading =
    settingsQuery.isLoading ||
    locationsQuery.isLoading ||
    apiKeysQuery.isLoading ||
    twoFaQuery.isLoading;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updateAdminSystemSettings(settings as Record<string, unknown>);
      await queryClient.invalidateQueries({ queryKey: adminSystemSettingsQueryKey });
      setSuccess("Settings saved successfully.");
      toast.success("Platform settings saved");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = () => {
    createLocationMutation.mutate(
      { name: newLocation.name, description: newLocation.description },
      {
        onSuccess: () => {
          setIsAddLocationOpen(false);
          setNewLocation({ name: "", description: "" });
          toast.success("Location added");
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to add location",
          );
        },
      },
    );
  };

  return {
    settings,
    setSettings,
    analytics,
    stockLocations: locationsQuery.data ?? [],
    apiKeys: apiKeysQuery.data ?? [],
    ipWhitelist: ipWhitelistQuery.data?.ips ?? [],
    is2FAEnabled,
    saving,
    error,
    success,
    handleSave,
    isAddLocationOpen,
    setIsAddLocationOpen,
    newLocation,
    setNewLocation,
    handleAddLocation,
    createLocationPending: createLocationMutation.isPending,
    isAddApiKeyOpen,
    setIsAddApiKeyOpen,
    isEditApiKeyOpen,
    setIsEditApiKeyOpen,
    newApiKey,
    setNewApiKey,
    selectedApiKey,
    setSelectedApiKey,
    createApiKeyMutation,
    updateApiKeyMutation,
    isIpWhitelistOpen,
    setIsIpWhitelistOpen,
    newIp,
    setNewIp,
    addIpMutation,
    removeIpMutation,
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
    setupTwoFaMutation,
    verifyTwoFaMutation,
    twoFaQuery,
    pageLoading,
  };
}

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const value = useAdminSettingsState();
  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
}
