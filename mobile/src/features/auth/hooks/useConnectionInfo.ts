import { useEffect, useState, useCallback } from "react";
import * as Network from "expo-network";

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType;
}

export function useConnectionInfo() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: null,
    type: Network.NetworkStateType.UNKNOWN,
  });

  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? null,
        type: state.type ?? Network.NetworkStateType.UNKNOWN,
      });
    } catch {
      setNetworkState({
        isConnected: false,
        isInternetReachable: false,
        type: Network.NetworkStateType.UNKNOWN,
      });
    }
  }, []);

  useEffect(() => {
    checkNetwork();

    // Poll every 5 seconds since expo-network doesn't have a listener
    const interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval);
  }, [checkNetwork]);

  return {
    isConnected: networkState.isConnected,
    isInternetReachable: networkState.isInternetReachable,
    type: networkState.type,
    refresh: checkNetwork,
  };
}
