import { _electron as electron } from 'playwright';
import path from 'node:path';

(async () => {
  console.log("Starting QA test with Playwright for Electron app...");
  const root = process.cwd();
  const exe = path.join(root, "node_modules", "electron", "dist", "electron");
  
  const launchEnv = { ...process.env };
  delete launchEnv.ELECTRON_RUN_AS_NODE;
  
  const app = await electron.launch({ executablePath: exe, args: ["."], cwd: root, env: launchEnv });
  
  try {
    const page = await app.firstWindow();
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    console.log("Waiting for app to load...");
    // Just wait for some content to appear to ensure React hydrated
    await page.waitForSelector('body', { timeout: 15000 });
    await page.waitForTimeout(2000); 
    
    const title = await page.title();
    console.log(`App loaded. Window Title: ${title}`);
    
    const expectedTabs = [
      "Overview", "Activity & logs", "Accounts", "Inventory", 
      "Drive setup", "Backup", "Shared items", "Verification", 
      "Gmail migration", "Contacts migration", "Calendar migration", 
      "Photos + Keep", "Security", "Final report"
    ];
    
    for (const name of expectedTabs) {
      console.log(`Navigating to ${name}...`);
      const navButton = page.getByRole("button", { name, exact: true });
      if (await navButton.count() > 0) {
        await navButton.first().click();
        await page.waitForTimeout(500); 
        const heading = await page.locator("main h1, h1").first().textContent().catch(() => 'No heading found');
        console.log(`  -> Page loaded. Heading: ${heading?.trim()}`);
      } else {
        console.log(`  -> Could not find navigation button for ${name}`);
      }
    }
    
    console.log("\n--- QA Results ---");
    if (errors.length > 0) {
      console.log("Encountered errors during QA:");
      errors.forEach(e => console.log(e));
    } else {
      console.log("No console or page errors encountered!");
    }
    
  } catch (err) {
    console.error("Test failed to execute:", err);
  } finally {
    await app.close();
  }
})();
