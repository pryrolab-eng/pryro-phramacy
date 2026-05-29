"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../supabase/client";

export function useSidebarUserName(fallback: string) {
  const [userName, setUserName] = useState(fallback);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const fullName =
          user.user_metadata?.full_name || user.user_metadata?.name;
        if (fullName) {
          setUserName(fullName);
          return;
        }
        setUserName(user.email?.split("@")[0] || fallback);
      } catch {
        /* keep fallback */
      }
    };
    void load();
  }, [fallback]);

  return userName;
}
