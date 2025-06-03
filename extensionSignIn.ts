import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars: 1Password credentials + Stagehand API key + extension paths
dotenv.config();
const { ANTHROPIC_API_KEY, EXTENSION_PATH, USER_DATA_DIR, EMAIL, SECRET_KEY, MASTER_PASSWORD } = process.env;

if (!ANTHROPIC_API_KEY || !EXTENSION_PATH || !USER_DATA_DIR || !EMAIL || !SECRET_KEY || !MASTER_PASSWORD) {
  console.error(
    'Error: ANTHROPIC_API_KEY, EXTENSION_PATH, USER_DATA_DIR, EMAIL, SECRET_KEY, and MASTER_PASSWORD must be set'
  );
  process.exit(1);
}

(async () => {
  // Initialize Stagehand locally
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
      userDataDir: USER_DATA_DIR,
    },
  });

  await stagehand.init();
  const page = stagehand.page;

  // Derive extension ID by scanning the user profile's Local Extension Settings folder
  const settingsDir = path.join(USER_DATA_DIR, 'Default', 'Local Extension Settings');
  let extensionId: string;
  try {
    const ids = fs.readdirSync(settingsDir).filter(name =>
      fs.statSync(path.join(settingsDir, name)).isDirectory()
    );
    if (ids.length === 0) throw new Error('no extension folder in Local Extension Settings');
    extensionId = ids[0];
  } catch (err) {
    console.error(`Failed to locate extension ID in ${settingsDir}`, err);
    process.exit(1);
  }

  // Navigate directly to the extension's main welcome page
  const appUrl = `chrome-extension://${extensionId}/app/app.html#/page/welcome?language=en`;
  await page.goto(appUrl);
  await page.waitForLoadState('networkidle');

  // 1) Click "Continue" on the welcome screen
  await page.act('Click the Continue button');
  await page.waitForLoadState('networkidle');

  // 2) Click "Sign in" to reach the account form
  await page.act('Click the Sign in button');
  await page.waitForLoadState('networkidle');

  // 3) Enter email
  await page.act(`Type "${EMAIL}" into the Email field`);

  // 4) Click Continue
  await page.act('Click the Continue button');
  await page.waitForLoadState('networkidle');

  // 5) Enter Secret Key
  await page.act(`Type "${SECRET_KEY}" into the Secret Key field`);

  // 6) Enter Master Password
  await page.act(`Type "${MASTER_PASSWORD}" into the Password field`);

  // 7) Click Sign In
  await page.act('Click the Sign In button');
  await page.waitForTimeout(2000);

  console.log('✅ 1Password extension is now authenticated');

  await stagehand.close();
})(); 