import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';

dotenv.config();
const { ANTHROPIC_API_KEY, EXTENSION_PATH, /* USER_DATA_DIR, */ EMAIL, SECRET_KEY, MASTER_PASSWORD } = process.env;

if (!ANTHROPIC_API_KEY || !EXTENSION_PATH || !EMAIL || !SECRET_KEY || !MASTER_PASSWORD) {
  console.error(
    'Error: ANTHROPIC_API_KEY, EXTENSION_PATH, EMAIL, SECRET_KEY, and MASTER_PASSWORD must be set'
  );
  process.exit(1);
}

// Create a fresh Chrome profile directory in the OS temp folder for each run
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), '1password-profile-'));
console.log('Using Chrome profile:', profileDir);

export async function extensionSignIn(): Promise<Stagehand> {
  const stagehand = new Stagehand({
    env: 'LOCAL',
    modelName: 'anthropic/claude-3-7-sonnet-latest',
    modelClientOptions: { apiKey: ANTHROPIC_API_KEY! },
    localBrowserLaunchOptions: {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH!}`,
        `--load-extension=${EXTENSION_PATH!}`
      ],
      userDataDir: profileDir,
    },
  });

  await stagehand.init();
  const page = stagehand.page;


  // Derive extension ID by polling Local Extension Settings (5s interval, up to 30s)
  const settingsDir = path.join(profileDir, 'Default', 'Local Extension Settings');
  let extensionId: string | undefined;
  const maxAttempts = 6;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (fs.existsSync(settingsDir)) {
      const ids = fs.readdirSync(settingsDir).filter(name =>
        fs.statSync(path.join(settingsDir, name)).isDirectory()
      );
      if (ids.length > 0) {
        extensionId = ids[0];
        break;
      }
    }
    await new Promise((res) => setTimeout(res, 5000));
  }
  if (!extensionId) {
    console.error(`Timed out locating extension folder in ${settingsDir}`);
    process.exit(1);
  }

  // Navigate directly to the extension's main welcome page
  const appUrl = `chrome-extension://${extensionId}/app/app.html#/page/welcome?language=en`;
  await page.goto(appUrl);

  await page.waitForSelector('text=Continue', { timeout: 10000 });

  // 1) Click "Continue" on the welcome screen
  await page.act('Click the Continue button');

  // 2) Click "Sign in" to reach the account form
  await page.act('Click the Sign in button');
  await page.waitForLoadState('networkidle');


  // 3) Enter email
  await page.act(`Type "${EMAIL!}" into the Email field`);
  await page.act('Click the Continue button');
  await page.waitForLoadState('networkidle');

  // 5) Enter Secret Key
  await page.act(`Type "${SECRET_KEY!}" into the Secret Key field`);

  // 6) Enter Master Password
  await page.act(`Type "${MASTER_PASSWORD!}" into the Password field`);

  // 7) Click Sign In
  await page.act('Click the Sign In button');
  await page.waitForTimeout(2000);

  return stagehand;
} 