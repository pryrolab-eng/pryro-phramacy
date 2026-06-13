import {
  getEnableMultiBranch,
  getEnableRegistrations,
  getEnableWhiteLabel,
} from "@/lib/platform-settings";
import { PlatformPolicyError } from "./errors";

export async function assertRegistrationsEnabled(): Promise<void> {
  if (!(await getEnableRegistrations())) {
    throw new PlatformPolicyError(
      "New registrations are temporarily disabled. Please try again later.",
      "registrations_disabled",
    );
  }
}

export async function assertPlatformMultiBranchEnabled(): Promise<void> {
  if (!(await getEnableMultiBranch())) {
    throw new PlatformPolicyError(
      "Multi-branch is disabled for this platform.",
      "multi_branch_disabled",
    );
  }
}

export async function assertPlatformWhiteLabelEnabled(): Promise<void> {
  if (!(await getEnableWhiteLabel())) {
    throw new PlatformPolicyError(
      "White-label customization is disabled for this platform.",
      "white_label_disabled",
    );
  }
}
