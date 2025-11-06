import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export function getAuthToken(): string | null {
  const authData = localStorage.getItem("sams-auth");
  if (!authData) return null;

  try {
    const parsed = JSON.parse(authData);
    return parsed.state?.token || parsed.token || null;
  } catch (e) {
    console.error("Failed to parse auth data:", e);
    return null;
  }
}

/**
 * Update the authentication token in localStorage
 * @param newToken - The new authentication token
 */
export function updateAuthToken(newToken: string): void {
  const authData = localStorage.getItem("sams-auth");
  if (!authData) return;

  try {
    const parsed = JSON.parse(authData);
    if (parsed.state) {
      parsed.state.token = newToken;
    } else {
      parsed.token = newToken;
    }
    localStorage.setItem("sams-auth", JSON.stringify(parsed));
  } catch (e) {
    console.error("Failed to update auth token:", e);
  }
}

/**
 * Check if a JWT token is expired or will expire soon (within 2 minutes)
 * @param token - The JWT token to check
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpiringSoon(token: string | null): boolean {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;

    // Return true if token expires within 2 minutes
    return expiresAt - now < twoMinutes;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return true;
  }
}

/**
 * Refresh the authentication token
 * @returns The new token or null if refresh failed
 */
export async function refreshAuthToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // Important: sends refresh token cookie
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Token refresh failed:", response.status);
      return null;
    }

    const data = await response.json();
    const newToken = data.token;

    if (newToken) {
      updateAuthToken(newToken);
      console.log("Token refreshed successfully");
      return newToken;
    }

    return null;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Make an authenticated API request with automatic token refresh
 * @param url - The API endpoint URL
 * @param options - Fetch options
 * @returns The JSON response
 */
export async function authenticatedFetch(url: string, options?: RequestInit) {
  let token = getAuthToken();

  // Check if token is expiring soon and refresh if needed
  if (isTokenExpiringSoon(token)) {
    console.log("Token expiring soon, refreshing...");

    // Prevent multiple simultaneous refresh requests
    if (!refreshPromise) {
      refreshPromise = refreshAuthToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      token = newToken;
    } else {
      // Refresh failed, redirect to login
      console.error("Token refresh failed, redirecting to login");
      window.location.href = "/login";
      throw new Error("Authentication expired. Please log in again.");
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    credentials: "include",
  });

  // Handle 401 Unauthorized - token might have expired during request
  if (response.status === 401) {
    console.log("Got 401, attempting token refresh...");

    // Try to refresh token once
    if (!refreshPromise) {
      refreshPromise = refreshAuthToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (newToken) {
      // Retry the original request with new token
      console.log("Retrying request with new token");
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
        },
        credentials: "include",
      });

      if (!retryResponse.ok) {
        // Check content type before parsing
        const contentType = retryResponse.headers.get("content-type");
        let errorMessage = `HTTP ${retryResponse.status}`;

        if (contentType && contentType.includes("application/json")) {
          const error = await retryResponse.json().catch(() => ({ error: "Request failed" }));
          errorMessage = error.error || errorMessage;
        } else {
          const text = await retryResponse.text();
          console.error("Non-JSON response:", text.substring(0, 200));
          errorMessage = `Server error: ${retryResponse.status}`;
        }

        throw new Error(errorMessage);
      }

      // Check content type before parsing response
      const contentType = retryResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return retryResponse.json();
      } else {
        const text = await retryResponse.text();
        console.error("Expected JSON but got:", text.substring(0, 200));
        throw new Error("Invalid response format from server");
      }
    } else {
      // Refresh failed, redirect to login
      console.error("Token refresh failed after 401, redirecting to login");
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!response.ok) {
    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    let errorMessage = `HTTP ${response.status}`;

    if (contentType && contentType.includes("application/json")) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      errorMessage = error.error || errorMessage;
    } else {
      const text = await response.text();
      console.error("Non-JSON error response:", text.substring(0, 200));

      // Common HTTP errors
      if (response.status === 404) {
        errorMessage = "Endpoint not found. The requested resource does not exist.";
      } else if (response.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (response.status === 403) {
        errorMessage = "Access denied. You don't have permission.";
      } else {
        errorMessage = `Server error: ${response.status}`;
      }
    }

    throw new Error(errorMessage);
  }

  // Check content type before parsing successful response
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    const text = await response.text();
    console.error("Expected JSON but got:", text.substring(0, 200));
    throw new Error("Invalid response format from server");
  }
}
