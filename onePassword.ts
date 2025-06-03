import { extensionSignIn } from './onePasswordSignIn';
import { fetchCredentials } from './onePasswordCredentials';
import { spotifyLogin } from './onePasswordSpotify';

(async () => {
  const stagehand = await extensionSignIn();
  try {
    const { username, password } = await fetchCredentials(stagehand);
    await spotifyLogin(stagehand, username, password);
  } finally {
    await stagehand.close();
  }
})();
