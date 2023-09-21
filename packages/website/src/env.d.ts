/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_GAPI_KEY: string;
  readonly VITE_APP_GAPI_CLIENT_ID: string;
  readonly VITE_APP_ROOT_ID: string;
  readonly VITE_APP_ROOT_DRIVE_ID: string;

  readonly VITE_APP_GAPI_COOKIE_POLICY: string;
  readonly VITE_APP_GAPI_HOSTED_DOMAIN: string;
    readonly VITE_APP_USE_CONFIG_FILE: string;
    readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
