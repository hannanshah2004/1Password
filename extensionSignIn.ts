import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';

// Load env vars: 1Password credentials + Stagehand API key + extension paths
dotenv.config();
const {
  ANTHROPIC_API_KEY,
  EXTENSION_PATH,
  USER_DATA_DIR,
  EXTENSION_ID,
  EMAIL,
  SECRET_KEY,
  MASTER_PASSWORD,
} = process.env;

if (
  !ANTHROPIC_API_KEY ||
  !EXTENSION_PATH ||
  !USER_DATA_DIR ||
  !EXTENSION_ID ||
  !EMAIL ||
  !SECRET_KEY ||
  !MASTER_PASSWORD
) {
  console.error(
    'Error: ANTHROPIC_API_KEY, EXTENSION_PATH, USER_DATA_DIR, EXTENSION_ID, EMAIL, SECRET_KEY, and MASTER_PASSWORD must be set'
  );
  process.exit(1);
}

(async () => {
  // Initialize Stagehand with local (dev) or Browserbase (prod) mode
  const stagehand = new Stagehand({
    env: process.env.NODE_ENV === 'production' ? 'BROWSERBASE' : 'LOCAL',
    modelName: 'anthropic/claude-3-5-sonnet-20240620',
    modelClientOptions: { apiKey: ANTHROPIC_API_KEY },
    localBrowserLaunchOptions: {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
      userDataDir: USER_DATA_DIR,
    },
  });

  await stagehand.init();
  const page = stagehand.page;

  // Navigate the same Stagehand page to the extension popup UI
  const popupUrl = `chrome-extension://${EXTENSION_ID}/popup/index.html`;
  await page.goto(popupUrl);
  await page.waitForLoadState('networkidle');

  // Automate the sign-in flow:
  // 1) Click "Continue"
  await page.act('Click the Continue button');

  // 2) Click "Sign in"
  await page.act('Click the Sign in button');

  // 3) Enter email
  await page.act(`Type "${EMAIL}" into the Email field`);

  // 4) Click Continue
  await page.act('Click the Continue button');

  // 5) Enter secret key
  await page.act(`Type "${SECRET_KEY}" into the Secret Key field`);

  // 6) Enter master password
  await page.act(`Type "${MASTER_PASSWORD}" into the Password field`);

  // 7) Click Sign In
  await page.act('Click the Sign In button');

  // 8) Wait a moment to ensure authentication
  await page.waitForTimeout(3000);
  console.log('✅ 1Password extension is now authenticated');

  await stagehand.close();
})(); 