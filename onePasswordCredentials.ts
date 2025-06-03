import { Stagehand } from '@browserbasehq/stagehand';
import 'dotenv/config';

const { SEARCH_INPUT } = process.env;
if (!SEARCH_INPUT) {
  console.error('Error: SEARCH_INPUT environment variable must be set');
  process.exit(1);
}

export async function fetchCredentials(stagehand: Stagehand): Promise<{ username: string; password: string }> {
  const page = stagehand.page;

  // Open the 1Password extension via keyboard shortcut
  await page.act('Press Ctrl+Shift+X to open the 1Password extension');
  await page.waitForLoadState('networkidle');

  // Focus the Search field and type the search term
  await page.act('Click the Search 1Password field');
  await page.act(`Type "${SEARCH_INPUT}" into the Search 1Password field`);
  await page.waitForLoadState('networkidle');

  // Copy the username
  await page.act('Hover over the username field');
  await page.act('Click the Copy button next to the username');
  const username = await page.evaluate(() => navigator.clipboard.readText());

  // Copy the password
  await page.act('Hover over the password field');
  await page.act('Click the Copy button next to the password');
  const password = await page.evaluate(() => navigator.clipboard.readText());

  return { username, password };
}