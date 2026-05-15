import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Supabase client for Route Handlers. Reads session cookies from the incoming
 * request (middleware may have refreshed them) and forwards any cookie updates
 * on the JSON response.
 */
export function createRouteHandlerClient(request: NextRequest) {
  let cookieResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        request.cookies.set({ name, value, ...options } as never);
        cookieResponse = NextResponse.next({ request });
        cookieResponse.cookies.set({ name, value, ...options } as never);
      },
      remove(name: string, options: Record<string, unknown>) {
        request.cookies.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        } as never);
        cookieResponse = NextResponse.next({ request });
        cookieResponse.cookies.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        } as never);
      },
    },
  });

  return {
    supabase,
    withCookies<T extends NextResponse>(response: T): T {
      cookieResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie);
      });
      return response;
    },
    json(body: unknown, init?: ResponseInit) {
      const res = NextResponse.json(body, init);
      cookieResponse.cookies.getAll().forEach((cookie) => {
        res.cookies.set(cookie);
      });
      return res;
    },
  };
}
