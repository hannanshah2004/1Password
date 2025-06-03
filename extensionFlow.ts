import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const EXTENSION_PATH = process.env.EXTENSION_PATH!;
const USER_DATA_DIR = process.env.USER_DATA_DIR!;

if (!ANTHROPIC_API_KEY || !EXTENSION_PATH || !USER_DATA_DIR) {
  console.error('Error: ANTHROPIC_API_KEY, EXTENSION_PATH, and USER_DATA_DIR must be set');
  process.exit(1);
}

(async () => {
  // Launch Stagehand with the extension loaded and a persistent profile
  const stagehand = new Stagehand({
    env: 'LOCAL',
    modelName: 'anthropic/claude-3-5-sonnet-20240620',
    modelClientOptions: { apiKey: ANTHROPIC_API_KEY },
    localBrowserLaunchOptions: {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`
      ],
      userDataDir: USER_DATA_DIR
    }
  });

  await stagehand.init();
  const page = stagehand.page;
  const context = page.context();

  // Wait for the extension's service worker to register, then derive its ID
  const worker = await context.waitForEvent('serviceworker');
  const extensionUrl = worker.url(); // e.g. chrome-extension://<ID>/background/background.js
  const extensionId = new URL(extensionUrl).hostname;

  // Open the 1Password popup UI in a new tab
  const extPage = await context.newPage();
  const popupPath = 'popup/index.html';
  const popupUrl = `chrome-extension://${extensionId}/${popupPath}`;
  await extPage.goto(popupUrl);
  await extPage.waitForLoadState('networkidle');

  console.log(`Opened 1Password extension popup at ${popupUrl}`);
  console.log('Please complete the sign-in flow in the browser window.');
  console.log('Press ENTER here when you are done to close the browser.');

  // Keep the process alive until the user presses Enter
  process.stdin.resume();
  process.stdin.once('data', async () => {
    await stagehand.close();
    process.exit(0);
  });
})(); 