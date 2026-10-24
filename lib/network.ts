'use client';

import { createContext, useContext } from 'react';

export interface NetworkState {
  online: boolean;
  /** True while a service-worker driven offline cache is serving the shell. */
  canWorkOffline: boolean;
}

export const NetworkContext = createContext<NetworkState>({ online: true, canWorkOffline: true });

export const useNetwork = () => useContext(NetworkContext);
