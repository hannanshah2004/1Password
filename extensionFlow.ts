import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

  // Derive the extension ID from the userDataDir Extensions folder
  const extensionsDir = path.join(USER_DATA_DIR, 'Default', 'Extensions');
  let extIds: string[] = [];
  try {
    extIds = fs.readdirSync(extensionsDir).filter(name => fs.statSync(path.join(extensionsDir, name)).isDirectory());
  } catch (e) {
    console.error(`Failed to read extensions directory at ${extensionsDir}`, e);
    process.exit(1);
  }
  if (extIds.length === 0) {
    console.error('No extensions found in user data directory');
    process.exit(1);
  }
  const extensionId = extIds[0];

  // Open the 1Password popup UI in a new tab (so you can sign in manually)
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