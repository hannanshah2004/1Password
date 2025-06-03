import { Stagehand } from '@browserbasehq/stagehand';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export async function spotifyLogin(stagehand: Stagehand, username: string, password: string): Promise<void> {
  const page = stagehand.page;
  const TARGET_WEBSITE = process.env.SPOTIFY_LOGIN_URL!;

  // Navigate to Spotify login page
  await page.goto(TARGET_WEBSITE);
  await page.waitForLoadState('networkidle');

  // Enter username and proceed
  await page.act(`Type "${username}" into the email or username field`);
  await page.act('Click the Continue button');
  await page.waitForLoadState('networkidle');

  // Switch to password login if needed
  await page.act('Click the "Log in with password" link or button');
  await page.waitForLoadState('networkidle');

  // Enter password and submit
  await page.act(`Type "${password}" into the password field`);
  await page.act('Click the login or submit button');
  await page.waitForLoadState('networkidle');

  // Verify login success
  const verifySchema = z.object({ success: z.boolean(), message: z.string() });
  const result = await page.extract({
    instruction: 'Check if the user is logged in to Spotify by looking for a profile or logout button',
    schema: verifySchema,
  });
  console.log(`Login ${result.success ? 'successful' : 'failed'}: ${result.message}`);

  // Take a screenshot of the result
  await page.screenshot({ path: 'spotify-login-result.png' });
}