// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const PORT = Number(process.env.PORT) || 8111;

// Normally Playwright finds the browser it installed itself. Set CHROMIUM_PATH
// to point at an existing Chromium instead - useful on CI images and sandboxes
// that ship one already, where re-downloading is wasted.
const launchOptions = process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {};

module.exports = defineConfig({
    testDir: "./tests",
    // The save tests drive one game through a sequence of states, so the files
    // run one at a time rather than racing each other for the same port.
    fullyParallel: false,
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
    },

    projects: [
        {
            name: "desktop",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 1280, height: 800 },
                launchOptions,
            },
            testIgnore: /touch\.spec\.js/,
        },
        {
            // The menu button and the slot panel have to work under a thumb as
            // well as a mouse - that is the only way to save on a phone.
            name: "phone",
            use: {
                ...devices["Desktop Chrome"],
                viewport: { width: 844, height: 390 },
                hasTouch: true,
                isMobile: true,
                launchOptions,
            },
            testMatch: /touch\.spec\.js/,
        },
    ],

    webServer: {
        command: "node tests/server.js",
        url: `http://127.0.0.1:${PORT}/index.html`,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
    },
});
