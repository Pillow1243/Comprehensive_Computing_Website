'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Toaster, toast } from '@/lib/toast';
import { ThemeProvider } from '@/lib/theme';
import { I18nProvider } from '@/lib/i18n';
import { InstallProvider } from '@/lib/install';
import { NetworkContext, type NetworkState } from '@/lib/network';
import { rehydrateStore, useAppStore } from '@/lib/store';
import { startWebVitals } from '@/lib/telemetry';
import { withBasePath, BASE_PATH } from '@/lib/base-path';

/** Reads persisted zustand state after mount, then flips the hydration flag. */
function StoreHydrator() {
  useEffect(() => {
    rehydrateStore();
    const timer = setTimeout(() => useAppStore.setState({ hydrated: true }), 1500);
    return () => clearTimeout(timer);
  }, []);
  return null;
}

function NetworkWatcher({ onChange }: { onChange: (state: NetworkState) => void }) {
  useEffect(() => {
    const update = () =>
      onChange({ online: navigator.onLine, canWorkOffline: 'serviceWorker' in navigator });
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [onChange]);
  return null;
}

function WebVitalsReporter() {
  useEffect(() => {
    startWebVitals();
  }, []);
  return null;
}

function ServiceWorkerManager() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    let cancelled = false;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(withBasePath('/sw.js'), {
          scope: `${BASE_PATH}/`,
        });
        if (cancelled) return;
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              toast.message('نسخه جدید آماده است', {
                duration: 12_000,
                action: { label: 'به‌روزرسانی', onClick: () => window.location.reload() },
              });
            }
          });
        });
      } catch {
        /* offline support is an enhancement */
      }
    };
    void register();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkState>({ online: true, canWorkOffline: false });

  return (
    <ThemeProvider>
      <I18nProvider>
        <InstallProvider>
            <NetworkContext.Provider value={network}>
              <StoreHydrator />
              <NetworkWatcher onChange={setNetwork} />
              <WebVitalsReporter />
              <ServiceWorkerManager />
              {children}
              <Toaster />
            </NetworkContext.Provider>
        </InstallProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
