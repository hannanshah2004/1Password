import { Stagehand } from '@browserbasehq/stagehand';
import 'dotenv/config';
import { z } from 'zod';

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

  // 0) If prompted, log in with the master password
  await page.act('Click the Password field');
  await page.act(`Type "${MASTER_PASSWORD}" into the Password field`);
  await page.act('Click the Sign In button');
  await page.waitForLoadState('networkidle');

  // 1) Click the 'Search in all vaults' field and type the search term
  await page.act('Click the Search in all vaults field');
  await page.act(`Type "${SEARCH_INPUT}" into the Search in all vaults field`);
  await page.waitForLoadState('networkidle');

  // 2) Click the matching item in the results
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