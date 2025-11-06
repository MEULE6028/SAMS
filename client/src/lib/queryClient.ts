import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { useAuth } from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      const text = await res.text();
      errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
  }
}

function getAuthHeaders(): Record<string, string> {
  const authData = localStorage.getItem("sams-auth");
  if (authData) {
    try {
      const { state } = JSON.parse(authData);
      if (state?.token) {
        return {
          Authorization: `Bearer ${state.token}`,
        };
      }
    } catch (e) {
      console.error("Error parsing auth data:", e);
    }
  }
  return {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };

  if (data) {
    headers["Content-Type"] = "application/json";
  }

  let res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    // try refresh
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshRes.ok) {
      const { token } = await refreshRes.json();
      // update auth token in store
      try {
        const auth = useAuth.getState();
        if (auth.user) auth.setAuth(auth.user, token);
      } catch { }
      // retry original request with new token header
      res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), ...(data ? { "Content-Type": "application/json" } : {}) },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
    } else {
      // redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }
  }

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      let res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      if (res.status === 401) {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          const { token } = await refreshRes.json();
          try {
            const auth = useAuth.getState();
            if (auth.user) auth.setAuth(auth.user, token);
          } catch { }
          // retry
          res = await fetch(queryKey.join("/") as string, {
            credentials: "include",
            headers: getAuthHeaders(),
          });
        } else {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
          throw new Error("Unauthorized");
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
