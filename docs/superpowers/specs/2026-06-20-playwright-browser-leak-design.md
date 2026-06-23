# Playwright Browser Lifecycle Cleanup Design Spec

## Goal
Ensure that the Playwright headless Chromium instance launched by the MakerWorld scraper is closed properly on server exit, shutdown, or restart, preventing orphaned Chrome processes from leaking in the background.

## Proposed Changes

### [makerworld_scraper.ts](file:///g:/Antigravity%20Projects/Belvia%20version%201/tools/makerworld_scraper.ts)

- Introduce a flag `processListenersRegistered` to ensure we register signal and exit listeners on-demand when the browser is first launched.
- Register listeners for termination signals: `SIGINT` (Ctrl+C), `SIGTERM` (production termination/PM2), and `SIGUSR2` (nodemon restarts).
- In the signal handlers, perform asynchronous cleanup by calling `browserInstance.close()`, resetting the singleton reference to `null`, and exiting the process.
- Register an `exit` event listener for best-effort warning/logging.

## Verification Plan

### Automated Verification
- Run `npm run lint` and `npm run build` to ensure the scraper type-checks and builds correctly with the new process lifecycle code.

### Manual Verification
1. Start the server via `npm run dev`.
2. Access the admin portal to trigger a MakerWorld scrape (this instantiates the browser singleton).
3. Shut down the server (using Ctrl+C or triggering a file change if nodemon is active).
4. Verify that the terminal displays:
   ```
   [Scraper] Received SIGINT. Closing Chromium browser singleton...
   [Scraper] Chromium browser closed successfully.
   ```
5. Check process explorer to ensure no orphaned Chromium processes remain active.
