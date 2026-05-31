export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const LOGIN_RETURN_PATH_KEY = "spf_login_return_path";

/**
 * Store a return path in localStorage so that after OAuth login,
 * the app can redirect the user to the intended page.
 */
export function setLoginReturnPath(path: string) {
  try {
    localStorage.setItem(LOGIN_RETURN_PATH_KEY, path);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

/**
 * Retrieve and clear the stored return path after login.
 * Returns null if no path was stored.
 */
export function consumeLoginReturnPath(): string | null {
  try {
    const path = localStorage.getItem(LOGIN_RETURN_PATH_KEY);
    if (path) {
      localStorage.removeItem(LOGIN_RETURN_PATH_KEY);
    }
    return path;
  } catch {
    return null;
  }
}

// Generate login URL at runtime so redirect URI reflects the current origin.
// returnPath: optional path to redirect to after successful login (e.g., "/portal")
// The returnPath is stored in localStorage (not in the OAuth state) because the
// OAuth SDK uses state to encode the redirectUri for token exchange.
export const getLoginUrl = (returnPath?: string) => {
  if (returnPath) {
    setLoginReturnPath(returnPath);
  }

  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
