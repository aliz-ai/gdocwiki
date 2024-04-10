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
      use_fedcm_for_prompt: true,
      callback: (response) => {
        google.accounts.id.cancel();
        googleIdToken = response;
        userProfile = parseJwt(response.credential);
        resolve(response);
        try {
          sessionStorage.setItem('alizWikiIdToken', response.credential);
        } catch (e) {
          console.error('Failed to save idToken to sessionStorage', e);
        }
      },
    });
    google.accounts.id.prompt();
    /*google.accounts.id.prompt(noti => {
      if (!noti) {
        reportProgress?.(`Popup dismissed.`);
        return;
      }
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
    });*/
  });

const getValidStoredAccessToken = async () => {
  try {
    const validUntil = parseInt(sessionStorage.getItem('alizWikiAccessTokenValidUntil') ?? '0');
    if (validUntil < (Date.now() - 5000)) {
      sessionStorage.removeItem('alizWikiAccessToken');
      sessionStorage.removeItem('alizWikiAccessTokenValidUntil');
      return null;
    }
    const tokenResponse: google.accounts.oauth2.TokenResponse = JSON.parse(sessionStorage.getItem('alizWikiAccessToken') || '');
    const expires_in = (validUntil - Date.now()) / 1000;
    return {...tokenResponse, expires_in} as any;
  } catch (e) {
    console.error('Failed to get idToken from sessionStorage', e);
    return null;
    }
  }

const getAccessToken = async (forceConsent: boolean) =>
{
  const storedToken = await getValidStoredAccessToken();
  if (storedToken) { 
    googleAccessToken = storedToken;
    return storedToken;
  }
  return new Promise<google.accounts.oauth2.TokenResponse>((resolve) => {
    const callback = (response: google.accounts.oauth2.TokenResponse) => {
      googleAccessToken = response;
      resolve(response);
      try {
        sessionStorage.setItem('alizWikiAccessToken', JSON.stringify(response));
        sessionStorage.setItem('alizWikiAccessTokenValidUntil',''+ (Date.now() + (Number(response.expires_in) * 1000)) );
      } catch (e) {
        console.error('Failed to save idToken to sessionStorage', e);
      }
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
  });}

let refreshTimeoutHandle: number | undefined;

const getExpirationRefreshTimout = (epiresIn: number) => {
  return (epiresIn - 5 * 60) * 1000;
}

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
    console.log('Setting up refresh timeout', getExpirationRefreshTimout(tokenResponse.expires_in));
    refreshTimeoutHandle = (setTimeout(setupGoogleAuth, getExpirationRefreshTimout(tokenResponse.expires_in))) as number;
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
