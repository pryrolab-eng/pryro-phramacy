"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  useSetTwoFaEnabledMutation,
  useSetupTwoFaMutation,
  useTwoFaStatus,
  useVerifyTwoFaMutation,
} from "@/hooks/usePharmacySettingsPage";

function useStaffSettingsSecurityState() {
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [setupStep, setSetupStep] = useState<"qr" | "verify" | "backup">("qr");

  const twoFaQuery = useTwoFaStatus();
  const setTwoFaMutation = useSetTwoFaEnabledMutation();
  const setupTwoFaMutation = useSetupTwoFaMutation();
  const verifyTwoFaMutation = useVerifyTwoFaMutation();

  const platformAllowsTwoFactor =
    twoFaQuery.data?.platformAllowsTwoFactor !== false;
  const is2FAEnabled =
    platformAllowsTwoFactor && (twoFaQuery.data?.enabled ?? false);

  const resetTwoFaSetup = () => {
    setSetupStep("qr");
    setQrCode("");
    setBackupCodes([]);
    setVerifyCode("");
  };

  return {
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
    setupTwoFaMutation,
    verifyTwoFaMutation,
    resetTwoFaSetup,
  };
}

type StaffSettingsContextValue = ReturnType<typeof useStaffSettingsSecurityState>;

const StaffSettingsContext = createContext<StaffSettingsContextValue | null>(
  null,
);

export function useStaffSettingsPage() {
  const ctx = useContext(StaffSettingsContext);
  if (!ctx) {
    throw new Error(
      "useStaffSettingsPage must be used within StaffSettingsPageProvider",
    );
  }
  return ctx;
}

export function StaffSettingsPageProvider({ children }: { children: ReactNode }) {
  const value = useStaffSettingsSecurityState();
  return (
    <StaffSettingsContext.Provider value={value}>
      {children}
    </StaffSettingsContext.Provider>
  );
}
