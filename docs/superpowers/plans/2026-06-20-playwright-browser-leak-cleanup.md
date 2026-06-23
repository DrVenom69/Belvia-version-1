# Playwright Browser Lifecycle Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure that the Playwright headless Chromium instance closes properly on server exit, shutdown, or restart.

**Architecture:** Register lifecycle listeners on-demand during the browser's first launch to handle SIGINT/SIGTERM/SIGUSR2 signals and exit events.

**Tech Stack:** Node.js Process API, Playwright (Chromium)

---

### Task 1: Implement Lifecycle Cleanup in Scraper

**Files:**
- Modify: `tools/makerworld_scraper.ts:13-35`

- [ ] **Step 1: Add the listener flag and listener function**

Add the registration logic above `getBrowser()`.

```typescript
let processListenersRegistered = false;

function registerProcessListeners() {
  if (processListenersRegistered) return;
  processListenersRegistered = true;

  const cleanUp = async (signal: string) => {
    if (browserInstance) {
      console.log(`[Scraper] Received ${signal}. Closing Chromium browser singleton...`);
      try {
        await browserInstance.close();
        browserInstance = null;
        console.log(`[Scraper] Chromium browser closed successfully.`);
      } catch (err: any) {
        console.error(`[Scraper] Error closing browser during ${signal} cleanup:`, err.message);
      }
    }
  };

  const signals = ["SIGINT", "SIGTERM", "SIGUSR2"];
  signals.forEach((signal) => {
    process.once(signal, async () => {
      await cleanUp(signal);
      process.exit(0);
    });
  });

  process.on("exit", () => {
    if (browserInstance) {
      console.warn("[Scraper] Process exiting with open browser instance.");
    }
  });
}
```

- [ ] **Step 2: Update `getBrowser` to invoke `registerProcessListeners`**

```typescript
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-infobars",
        "--window-size=1280,900",
        "--disable-extensions",
        "--no-first-run",
        "--disable-default-apps",
        "--lang=en-US",
      ],
    });
    // Register process lifecycle listeners on-demand
    registerProcessListeners();
  }
  return browserInstance;
}
```

---

### Task 2: Build and Verification

- [ ] **Step 1: Run TypeScript checks and build**

Run in terminal:
```powershell
npm run lint
npm run build
```
Expected output: Success with no lint errors and successful Vite build.

- [ ] **Step 2: Verify runtime scraper functionality**

Start the dev server:
```powershell
npm run dev
```
Use the admin portal or trigger a scraper endpoint call to ensure that the scraper still functions normally and opens the browser.
Shut down the server using `Ctrl+C` and verify that the console outputs:
```
[Scraper] Received SIGINT. Closing Chromium browser singleton...
[Scraper] Chromium browser closed successfully.
```
