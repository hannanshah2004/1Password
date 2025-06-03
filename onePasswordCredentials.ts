import { Stagehand } from '@browserbasehq/stagehand';
import 'dotenv/config';

const { SEARCH_INPUT, MASTER_PASSWORD } = process.env;
if (!SEARCH_INPUT || !MASTER_PASSWORD) {
  console.error('Error: SEARCH_INPUT and MASTER_PASSWORD environment variables must be set');
  process.exit(1);
}

export async function fetchCredentials(stagehand: Stagehand): Promise<{ username: string; password: string }> {
  const page = stagehand.page;

  // Navigate to 1Password web vault
  await page.goto('https://my.1password.com/app#/everything/AllItems');
  await page.waitForLoadState('networkidle');

  // Grant clipboard permissions so we can read without a prompt
  await page.context().grantPermissions([
    'clipboard-read',
    'clipboard-write'
  ], { origin: 'https://my.1password.com' });

  // 0) If prompted, log in with the master password
  await page.act('Click the Password field');
  await page.act(`Type "${MASTER_PASSWORD}" into the Password field`);
  await page.act('Click the Sign In button');
  await page.goto('https://my.1password.com/app#/everything/AllItems');

  // Wait for the search input to appear
  await page.waitForSelector('input[placeholder="Search in all vaults"]', { timeout: 10000 });

  // 1) Wait for the search input, then click, type, and submit
  await page.act('Click the Search in all vaults field');
  await page.act(`Type "${SEARCH_INPUT}" into the Search in all vaults field`);
  await page.act('Press Enter');

  // 2) Wait for the matching item and click it
  await page.waitForSelector(`text="${SEARCH_INPUT}"`, { timeout: 10000 });
  await page.act(`Click the "${SEARCH_INPUT}" item`);
  await page.waitForLoadState('networkidle');

  // Extract username and password from the opened item
  // Copy username via clipboard
  await page.act('Hover over the username field');
  await page.act('Click the Copy button next to the username');
  const username = await page.evaluate(() => navigator.clipboard.readText());

  // Copy password via clipboard
  await page.act('Hover over the password field');
  await page.act('Click the Copy button next to the password');
  const password = await page.evaluate(() => navigator.clipboard.readText());

  return { username, password };
}