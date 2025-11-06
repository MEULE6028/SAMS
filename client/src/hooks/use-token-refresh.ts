import { useEffect } from "react";
import { getAuthToken, isTokenExpiringSoon, refreshAuthToken } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

/**
 * Hook that automatically refreshes the auth token before it expires
 * Checks every minute and refreshes if token expires within 2 minutes
 */
export function useTokenRefresh() {
    const { user, logout } = useAuth();

    useEffect(() => {
        // Only run if user is logged in
        if (!user) return;

        // Check token expiration every minute
        const intervalId = setInterval(async () => {
            const token = getAuthToken();

            if (isTokenExpiringSoon(token)) {
                console.log("[TokenRefresh] Token expiring soon, refreshing...");

                const newToken = await refreshAuthToken();

                if (!newToken) {
                    console.error("[TokenRefresh] Failed to refresh token, logging out");

                    // Show notification to user
                    const event = new CustomEvent("token-expired", {
                        detail: { message: "Your session has expired. Please log in again." }
                    });
                    window.dispatchEvent(event);

                    // Logout user
                    await logout();
                } else {
                    console.log("[TokenRefresh] Token refreshed successfully");
                }
            }
        }, 60 * 1000); // Check every 1 minute

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, [user, logout]);
}
