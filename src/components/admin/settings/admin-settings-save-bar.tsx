"use client";

import { Save } from "lucide-react";
import { DashboardButton } from "@/components/dashboard";
import { Spinner } from "@/components/ui/spinner";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsSaveBar() {
  const { saving, createLocationPending, handleSave } = useAdminSettings();

  return (
    <div className="sticky bottom-0 z-10 -mx-1 border-t border-neutral-100 bg-neutral-50/95 px-1 py-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="flex justify-end">
        <DashboardButton
          tone="primary"
          onClick={() => void handleSave()}
          disabled={saving || createLocationPending}
        >
          {saving ? (
            <>
              <Spinner className="mr-2 size-4" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" strokeWidth={1.75} />
              Save settings
            </>
          )}
        </DashboardButton>
      </div>
    </div>
  );
}
