import { OnePasswordConnect } from '@1password/connect';
import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const OP_CONNECT_URL = process.env.OP_CONNECT_URL || 'http://localhost:8080';
const OP_CONNECT_TOKEN = process.env.OP_CONNECT_TOKEN || process.env.OP_ACCESS_TOKEN!;
const TARGET_WEBSITE = process.env.TARGET_WEBSITE || 'https://accounts.spotify.com/en/login';

if (!ANTHROPIC_API_KEY || !OP_CONNECT_TOKEN) {
  console.error('Error: ANTHROPIC_API_KEY and OP_CONNECT_TOKEN must be set');
  process.exit(1);
}

async function getSpotifyCreds(): Promise<{ username: string; password: string }> {
  const client = OnePasswordConnect({ serverURL: OP_CONNECT_URL, token: OP_CONNECT_TOKEN });
  const vaults = await client.listVaults();
  if (vaults.length === 0) throw new Error('No vaults available');
  const vault = vaults[0];
  const matches = await client.listItemsByTitle(vault.id!, 'Spotify');
  if (matches.length === 0) throw new Error('Spotify credentials not found');
  const spotify = matches[0];
  const entry = await client.getItem(vault.id!, spotify.id!);
  const fields = Array.isArray((entry as any).fields) ? (entry as any).fields : [];
  const username = fields.find((f: any) => f.purpose === 'USERNAME')?.value!;
  const password = fields.find((f: any) => f.purpose === 'PASSWORD')?.value!;
  if (!username || !password) {
    throw new Error('Invalid Spotify entry fields');
  }
  return { username, password };
}

async function run1PasswordAutomation() {
  const { username, password } = await getSpotifyCreds();

  const stagehand = new Stagehand({
    env: 'LOCAL',
    modelName: 'anthropic/claude-3-5-sonnet-20240620',
    modelClientOptions: { apiKey: ANTHROPIC_API_KEY },
    localBrowserLaunchOptions: { headless: false }
  });
  await stagehand.init();
  const page = stagehand.page;

  await page.goto(TARGET_WEBSITE);
  await page.waitForLoadState('networkidle');

  await page.act(`Type "${username}" into the email or username field`);
  await page.act('Click the Continue button');
  await page.waitForLoadState('networkidle');

  await page.act('Click the "Log in with password" link or button');
  await page.waitForLoadState('networkidle');

  await page.act(`Type "${password}" into the password field`);
  await page.act('Click the login or submit button');
  await page.waitForLoadState('networkidle');

  const verifySchema = z.object({ success: z.boolean(), message: z.string() });
  const result = await page.extract({ instruction: 'Check if the user is logged in to Spotify by looking for a profile or logout button', schema: verifySchema });
  console.log(`Login ${result.success ? 'successful' : 'failed'}: ${result.message}`);

  await page.screenshot({ path: 'spotify-login-result.png' });

  await stagehand.close();
}

run1PasswordAutomation().catch(err => console.error(err));


