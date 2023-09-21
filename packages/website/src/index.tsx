import { InlineLoading, ListItem, UnorderedList } from 'carbon-components-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import { getConfig, loadConfig } from './config';
import './global.carbon.scss';
import './global.index.scss';
import { registerIcons, store } from './utils';
import { extConn } from './utils/extensionApi';
import { isUserSignedIn, setupGoogleAuth } from './utils/google-auth';

async function reportManifestUrl() {
  // TODO: Maybe infer manifest url from config is better.
  const url = `${window.location.protocol}//${window.location.host}`;
  console.log('Storing manifest url', url);
  const sender = await extConn;
  await sender.setManifestProbeUrl(url);
  console.log('Manifest url stored');
}

export const LoadingReport = (props: { messages: string[] }) => {
  const latestMessage = props.messages[props.messages.length - 1];
  const oldMessages = props.messages.slice(0, props.messages.length - 1);
  return (
    <div>
      <UnorderedList>
        {oldMessages.map((msg, i) => (
          <ListItem key={i}>{msg}</ListItem>
        ))}
      </UnorderedList>
      <InlineLoading description={latestMessage} />
    </div>
  );
};

export async function setupGapi(reportProgress: (msg: string) => void) {
  reportProgress('Checking if google API SDK is loaded');
  if (!gapi) {
    reportProgress('Google API SDK is not found');
    throw new Error('gapi is not defined');
  }

  reportProgress('Loading google API Client SDK');
  await new Promise((resolve, reject) =>
    gapi.load('client', { callback: resolve, onerror: reject })
  );

  const initConfig = {
    apiKey: getConfig().REACT_APP_GAPI_KEY,
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    hosted_domain: getConfig().REACT_APP_GAPI_HOSTED_DOMAIN,
    cookie_policy: getConfig().REACT_APP_GAPI_COOKIE_POLICY,
  };

  reportProgress('Initializing google Drive API definitions');
  await gapi.client.load('drive', 'v3');

  reportProgress('Shaving yaks on the mountain');

  reportProgress('Initializing google API');
  await gapi.client.init(initConfig);
}

async function main() {
  const messages: string[] = [];

  const reportProgress = (msg: string) => {
    console.log(msg);
    messages.push(msg);
    ReactDOM.render(<LoadingReport messages={messages} />, document.getElementById('root'));
  };

  if (!gapi) {
    ReactDOM.render(
      <InlineLoading description="Error. Please reload" />,
      document.getElementById('root')
    );
  }
  reportProgress('Loading Google API...');

  try {
    await loadConfig(reportProgress);
    await setupGapi(reportProgress);
    await setupGoogleAuth(reportProgress);

    const isSignedIn = isUserSignedIn();

    ReactDOM.render(
      <React.StrictMode>
        <Provider store={store}>
          <App isSignedIn={isSignedIn} />
        </Provider>
      </React.StrictMode>,
      document.getElementById('root')
    );
  } catch (ex) {
    console.error(ex);
    ReactDOM.render(
      <InlineLoading
        description={
          <>
            Error. Please reload.
            <code>
              <pre>{JSON.stringify(ex)}</pre>
            </code>
          </>
        }
      />,
      document.getElementById('root')
    );
  }

  reportManifestUrl();
  dayjs.extend(relativeTime);
  registerIcons();
}

main().catch((e) => console.error(e));
