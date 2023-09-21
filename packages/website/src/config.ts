type INavMenuItem = INavMenuLink | INavMenuGroup;
export interface INavMenuLink {
  type: 'link';
  href?: string;
  target?: string;
  text?: string;
}

export interface INavMenuGroup {
  type: 'group';
  text?: string;
  children?: INavMenuGroupChildren[];
}

export type INavMenuGroupChildren = INavMenuGroupChildrenLink | INavMenuGroupChildrenDivider;

export interface INavMenuGroupChildrenLink {
  type: 'link';
  href?: string;
  target?: string;
  text?: string;
}

export interface INavMenuGroupChildrenDivider {
  type: 'divider';
  text?: string;
}

const config = {
  REACT_APP_USE_CONFIG_FILE: import.meta.env.VITE_APP_USE_CONFIG_FILE === '1',
  // The G Suite domain to which users must belong to sign in
  REACT_APP_GAPI_HOSTED_DOMAIN: import.meta.env.VITE_APP_GAPI_HOSTED_DOMAIN ?? '',
  REACT_APP_GAPI_COOKIE_POLICY: import.meta.env.VITE_APP_GAPI_COOKIE_POLICY ?? 'single_host_origin',
  REACT_APP_GAPI_KEY: import.meta.env.VITE_APP_GAPI_KEY ?? '',
  REACT_APP_GAPI_CLIENT_ID: import.meta.env.VITE_APP_GAPI_CLIENT_ID ?? '',
  REACT_APP_ROOT_ID: import.meta.env.VITE_APP_ROOT_ID ?? '',
  REACT_APP_ROOT_DRIVE_ID: import.meta.env.VITE_APP_ROOT_DRIVE_ID ?? '',
  // This is not an app name but instead the name of the location of the REACT_APP_ROOT_*
  REACT_APP_NAME: import.meta.env.VITE_APP_NAME ?? '',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Gdoc Wiki',

  DEFAULT_FILE_FIELDS:
    'nextPageToken, files(properties, appProperties, name, id, driveId, parents, mimeType, modifiedTime, createdTime, lastModifyingUser(displayName, photoLink), iconLink, webViewLink, shortcutDetails, capabilities, starred)',

  NavItems: [] as INavMenuItem[],
};

if (!config.REACT_APP_USE_CONFIG_FILE) {
  for (const f of ['REACT_APP_GAPI_KEY', 'REACT_APP_GAPI_CLIENT_ID']) {
    if (!config[f]) {
      throw new Error(`Environment variable ${f} is not configured`);
    }
  }
}

const configStorageKey = 'app-config';

function loadSavedConfig() {
  const savedConfig = localStorage?.getItem(configStorageKey);
  if (savedConfig) {
    const oc = JSON.parse(savedConfig);
    for (const key in oc) {
      if (oc[key]) {
        config[key] = oc[key];
      }
    }
    return true;
  }
  return false;
}

export async function loadConfig() {
  if (loadSavedConfig()) {
    // Update the config in the background.
    // On next reload the new config will be used.
    // Wait 5 seconds to avoid increasing the number of requests at startup and document load
    setTimeout(function () {
      overwriteConfig();
    }, 5000);
  } else {
    await overwriteConfig();
  }
}

async function getJSON(url: string): Promise<any> {
  const rsp = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!rsp.ok) {
    throw new Error(`Fetch error ${rsp.statusText}`);
  }
  return rsp.json();
}

async function overwriteConfig() {
  try {
    const url = `${window.location.origin}/config.json?_=${Date.now()}`;
    const oc = await getJSON(url);
    for (const key in oc as Record<string, any>) {
      if (oc[key]) {
        config[key] = oc[key];
      }
    }
    localStorage?.setItem(configStorageKey, JSON.stringify(config));
  } catch (e) {
    if (config.REACT_APP_USE_CONFIG_FILE) {
      console.error('overwriteConfig', e);
      throw e;
    }
  }
}

export function getConfig() {
  return config;
}

export const browserExtensionUrl =
  'https://chrome.google.com/webstore/detail/gdocwiki-integration/pcnhielddaaanlfkifllbjahdbndndea';
