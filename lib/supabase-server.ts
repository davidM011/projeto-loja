import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none" | boolean;
    priority?: "low" | "medium" | "high";
  };
};

export function hasSupabaseEnv(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY nao configurados");
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components may not allow setting cookies directly.
        }
      },
    },
  });
}

export async function getAuthenticatedUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
