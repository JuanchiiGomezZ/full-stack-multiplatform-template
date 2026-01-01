"use client";

import { QueryClient } from "@tanstack/react-query";

/**
 * Default options for TanStack Query
 */
export const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
};

/**
 * Create a new QueryClient instance
 * Use this function to create a client for each request in SSR
 */
export function createQueryClient(): QueryClient {
  return new QueryClient(queryClientOptions);
}

/**
 * Singleton QueryClient for client-side
 */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return createQueryClient();
  }

  // Browser: use singleton pattern
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
