const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('PAGE LOG:', msg.text());
  });
  
  // Login as Agency user
  await page.goto('http://localhost:3000/login');
  await page.selectOption('[data-testid="email"]', 'agency-a@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('http://localhost:3000/dashboard');
  
  // Wait a bit for menu to load
  await page.waitForTimeout(2000);
  
  // Check menu visibility
  const blockUsersMenu = page.locator('[data-testid="menu-block-users"]');
  const isVisible = await blockUsersMenu.isVisible();
  console.log('Block Users menu visible:', isVisible);
  
  // Get all menu items
  const menuItems = await page.locator('[data-testid^="menu-"]').all();
  console.log('Found menu items:', menuItems.length);
  
  for (const item of menuItems) {
    const testId = await item.getAttribute('data-testid');
    const isVisible = await item.isVisible();
    const display = await item.evaluate(el => getComputedStyle(el).display);
    console.log(`Menu ${testId}: visible=${isVisible}, display=${display}`);
  }
  
  // Check specifically for menu-block-users
  const blockUsersMenuCount = await blockUsersMenu.count();
  console.log('Block Users menu count:', blockUsersMenuCount);
  
  if (blockUsersMenuCount > 0) {
    const isVisible = await blockUsersMenu.isVisible();
    const display = await blockUsersMenu.evaluate(el => getComputedStyle(el).display);
    console.log(`Block Users menu: visible=${isVisible}, display=${display}`);
  }
  
  await browser.close();
})();