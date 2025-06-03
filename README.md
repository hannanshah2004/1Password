# 1Password Browserbase Automation with Stagehand

This project demonstrates how to use the 1Password Chrome extension with Browserbase to automate password filling on websites using Stagehand.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A Browserbase account with API key
- 1Password Chrome extension

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

3. Prepare the 1Password extension:
   - Download the 1Password Chrome extension from the Chrome Web Store
   - Unzip the extension to a local folder
   - Zip the contents (ensuring `manifest.json` is at the root) into `1password.zip`
   - Place this zip file in the root directory of this project

4. Create environment variables:
   - Copy `.env-example` to `.env`
   - Fill in your Browserbase API key, project ID, 1Password master password, and target website

## Usage

Run the automation:

```
npm start
```

## How It Works

This script uses Stagehand's natural language automation to:

1. Upload the 1Password extension to Browserbase
2. Initialize Stagehand with the extension ID
3. Navigate to the extension's popup page and unlock 1Password with the master password
4. Go to your target website and detect if the 1Password inline button is available
5. Either click the inline button or use keyboard shortcuts to trigger 1Password autofill
6. Submit the login form and verify if the login was successful
7. Take a screenshot for verification
8. Clean up by closing Stagehand (which also closes the Browserbase session)

## Technical Details

- Uses the `@browserbasehq/sdk` to upload the extension and manage sessions
- Uses `@browserbasehq/stagehand` for natural-language browser automation
- Uses `zod` for schema validation of extracted data
- Implements error handling and graceful fallbacks

## Troubleshooting

- If the extension doesn't unlock properly, check that you're using the correct master password
- If autofill doesn't work, the script will try both the inline button and keyboard shortcut methods
- Check the screenshot generated (`login-result.png`) to see what happened during the automation

## Notes

- The 1Password extension UI may change over time, but Stagehand's natural language approach is resilient to these changes
- For security, never commit your `.env` file to version control 