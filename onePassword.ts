import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const TARGET_WEBSITE = process.env.TARGET_WEBSITE || 'https://accounts.spotify.com/en/login';

const EXTENSION_PATH = process.env.EXTENSION_PATH;
const USER_DATA_DIR = process.env.USER_DATA_DIR;

if (!ANTHROPIC_API_KEY || !EXTENSION_PATH || !USER_DATA_DIR) {
  console.error('Error: ANTHROPIC_API_KEY, EXTENSION_PATH, and USER_DATA_DIR must be set');
  process.exit(1);
}

async function run1PasswordAutomation() {
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

  await page.goto(TARGET_WEBSITE);
  await page.waitForLoadState('networkidle');

  await page.keyboard.press('Control+\\');

  await page.waitForLoadState('networkidle');

  const verifySchema = z.object({ success: z.boolean(), message: z.string() });
  const result = await page.extract({
    instruction: 'Check if the user is logged in to Spotify by looking for a profile or logout button',
    schema: verifySchema
  });

  console.log(`Login ${result.success ? 'successful' : 'failed'}: ${result.message}`);

  await page.screenshot({ path: 'spotify-login-result.png' });

  await stagehand.close();
}

run1PasswordAutomation().catch(err => console.error(err));


