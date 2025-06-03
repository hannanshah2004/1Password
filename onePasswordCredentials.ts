import { Stagehand } from '@browserbasehq/stagehand';
import 'dotenv/config';
import { z } from 'zod';

const { SEARCH_INPUT } = process.env;
if (!SEARCH_INPUT) {
  console.error('Error: SEARCH_INPUT environment variable must be set');
  process.exit(1);
}

export async function fetchCredentials(stagehand: Stagehand): Promise<{ username: string; password: string }> {
  const page = stagehand.page;

  await page.goto('https://www.google.com/');
  await page.waitForLoadState('networkidle');

  // 1) Click the Extensions toolbar icon
  await page.act('Click the Extensions toolbar icon');
  await page.waitForLoadState('networkidle');

  // 2) Click the 1Password extension entry in the dropdown
  await page.act('Click the 1Password extension in the Extensions dropdown');
  await page.waitForLoadState('networkidle');

  // 3) Focus the Search field and type the search term
  await page.act('Click the Search 1Password field');
  await page.act(`Type "${SEARCH_INPUT}" into the Search 1Password field`);
  await page.waitForLoadState('networkidle');

  // 4) Click the matching item in search results
  await page.act(`Click the "${SEARCH_INPUT}" item in the search results`);
  await page.waitForLoadState('networkidle');

  // Extract username and password from the opened item
  const credsSchema = z.object({ username: z.string(), password: z.string() });
  const { username, password } = await page.extract({
    instruction: 'Extract the username and password fields from the current 1Password item',
    schema: credsSchema,
  });

  return { username, password };
}