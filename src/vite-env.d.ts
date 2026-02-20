/// <reference types="vite/client" />

declare module 'virtual:pwa-info' {
  export interface PwaInfo {
    webManifest: {
      href: string;
      useCredentials: boolean;
    };
    registerSW: {
      shouldRegisterSW: boolean;
    };
  }
  export const pwaInfo: PwaInfo | undefined;
}

declare module 'virtual:pwa-register' {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
    onRegisterError?: (error: Error) => void;
  };

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
