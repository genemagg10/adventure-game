const { test, expect } = require("@playwright/test");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

test("the changelog names every merged pull request, newest first", () => {
    const file = path.join(__dirname, "..", "CHANGELOG.md");
    const text = fs.readFileSync(file, "utf8");
    expect(text.startsWith("# Changelog"), "the chronicle has a title").toBe(true);

    const versions = text.split(/^## v/m).slice(1);
    expect(versions.length).toBeGreaterThan(0);
    const firstBullet = versions[0].split("\n").find((line) => line.startsWith("- "));
    expect(firstBullet, "the newest version has an entry").toBeTruthy();

    const mentioned = [...text.matchAll(/\/pull\/(\d+)/g)].map((match) => Number(match[1]));
    const newest = Math.max(...mentioned);
    expect(firstBullet).toContain(`/pull/${newest}`);

    const log = execSync("git log --first-parent --pretty=%s HEAD", { encoding: "utf8" });
    const history = new Set();
    for (const match of log.matchAll(/\(#(\d+)\)/g)) history.add(Number(match[1]));
    for (const match of log.matchAll(/Merge pull request #(\d+)/g)) history.add(Number(match[1]));
    expect(history.size).toBeGreaterThan(0);
    const missing = [...history].filter((n) => !mentioned.includes(n)).sort((a, b) => a - b);
    expect(missing, "changelog is missing merged pull requests").toEqual([]);
});
