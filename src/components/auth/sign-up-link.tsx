"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { buildSignUpUrl } from "@/lib/onboarding/intent";
import { readOnboardingIntent } from "@/lib/onboarding/intent-client";
import { parseIntentFromSearchParams } from "@/lib/onboarding/intent";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

function hrefFromIntent(
  intent: NonNullable<ReturnType<typeof parseIntentFromSearchParams>>,
) {
  return buildSignUpUrl({
    planId: intent.planId,
    planName: intent.planName,
    billing: intent.billing,
  });
}

export function SignUpLink({ className, children = "Sign up" }: Props) {
  const searchParams = useSearchParams();
  const fromUrl = parseIntentFromSearchParams(searchParams);
  const [href, setHref] = useState(() =>
    fromUrl ? hrefFromIntent(fromUrl) : "/sign-up",
  );

  useEffect(() => {
    const intent = fromUrl ?? readOnboardingIntent();
    if (intent) setHref(hrefFromIntent(intent));
  }, [fromUrl, searchParams]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
