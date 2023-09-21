import { report } from 'process';
import { getConfig } from '../config';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export let googleIdToken: google.accounts.id.CredentialResponse | null = null;
export let googleAccessToken: google.accounts.oauth2.TokenResponse | null = null;
export let userProfile: UserProfile | null = null;
export const isUserSignedIn = () => !!googleAccessToken?.access_token;

const parseJwt = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  return JSON.parse(jsonPayload);
};

const renderSignInButton = () => { 
  google.accounts.id.renderButton(
    document.getElementById("google-signin-button")!,
    { theme: "outline", size: "large", type: 'standard' } 
  );
}

const getGoogleIdToken = (reportProgress?: (msg: string) => void) =>
  new Promise<google.accounts.id.CredentialResponse>((resolve) => {
    google.accounts.id.initialize({
      client_id: getConfig().REACT_APP_GAPI_CLIENT_ID,
      auto_select: true,
      callback: (response) => {
        google.accounts.id.cancel();
        googleIdToken = response;
        userProfile = parseJwt(response.credential);
        resolve(response);
      },
    });
    google.accounts.id.prompt(noti => {
      if (noti.isDisplayMoment() && noti.isNotDisplayed()) {
        reportProgress?.(`We couldn't show you the google account selection popup because of ${noti.getNotDisplayedReason()}`)
        reportProgress?.(`Please click the button below to sign in`)
        renderSignInButton();
      }
      if(noti.isSkippedMoment()) {
        reportProgress?.(`You skipped the google account selection popup ${noti.getSkippedReason()}}`)
      }
      if (noti.isDismissedMoment()) {
        reportProgress?.(`Popup dismissed, because ${noti.getDismissedReason()}`)
      }
    });
  });

const getAccessToken = (forceConsent: boolean) =>
  new Promise<google.accounts.oauth2.TokenResponse>((resolve) => {
    const callback = (response: google.accounts.oauth2.TokenResponse) => {
      googleAccessToken = response;
      resolve(response);
    };
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: getConfig().REACT_APP_GAPI_CLIENT_ID,
      hint: userProfile?.email,
      prompt: !userProfile?.email || forceConsent ? 'consent' : '',
      scope:
        'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents.readonly',
      callback,
    });
    tokenClient.requestAccessToken();
  });

let refreshTimeoutHandle: number | undefined;

export async function setupGoogleAuth(reportProgress?: (msg: string) => void) {
  reportProgress?.('Setting up Google Auth');
  clearTimeout(refreshTimeoutHandle);
  if (!google) {
    reportProgress?.('GSI is not defined');
    throw new Error('google(gsi) is not defined');
  }
  try {
    reportProgress?.('Searching for logged in User');
    await getGoogleIdToken(reportProgress);
    reportProgress?.('Aquiring Access for Google Drive (might require consent in a popup)');
    const tokenResponse = await getAccessToken(false);
    if (tokenResponse.access_token) {
      reportProgress?.('Access token aquired');
      gapi.client.setToken({ access_token: tokenResponse.access_token });
    } else {
      reportProgress?.(
        'Seems like we need another permissions. Please review your consent in the popup'
      );
      const tokenResponse = await getAccessToken(true);
      if (tokenResponse.access_token) {
        reportProgress?.('Access token aquired');
        gapi.client.setToken({ access_token: tokenResponse.access_token });
      } else {
        reportProgress?.('No access token aquired');
        throw new Error('No access token aquired');
      }
    }
    // refresh accessToken after 55 minutes before it expires
    refreshTimeoutHandle = (setTimeout(setupGoogleAuth, 55 * 60 * 1000) as unknown) as number;
  } catch (error) {
    // error happened, probably we are not signed in anymore
    googleIdToken = null;
    googleAccessToken = null;
    userProfile = null;
    throw error;
  }
}

export const signOut = async () => {
  google.accounts.id.disableAutoSelect();
  googleIdToken = null;
  await setupGoogleAuth(() => undefined);
};

export const signIn = async (ev: any) => {
  await setupGoogleAuth(() => undefined);
};
