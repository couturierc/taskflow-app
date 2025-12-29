/**
 * Simple API client for OAuth and user endpoints.
 */
import { getApiBaseUrl } from "@/constants/oauth";

export type ApiUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: string;
};

export type OAuthExchangeResult = {
  sessionToken: string;
  user?: ApiUser;
};

/**
 * Exchange OAuth code for session token.
 */
export async function exchangeOAuthCode(code: string, state: string): Promise<OAuthExchangeResult> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/oauth/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, state }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth exchange failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Get current authenticated user.
 */
export async function getMe(): Promise<ApiUser | null> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/trpc/auth.me`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result?.data ?? null;
}

/**
 * Logout current user.
 */
export async function logout(): Promise<void> {
  const baseUrl = getApiBaseUrl();
  await fetch(`${baseUrl}/api/trpc/auth.logout`, {
    method: "POST",
    credentials: "include",
  });
}
