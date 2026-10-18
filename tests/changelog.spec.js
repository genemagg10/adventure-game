const { test, expect } = require("@playwright/test");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

test("the changelog names every merged pull request, newest first", () => {
    const file = path.join(__dirname, "..", "CHANGELOG.md");
    const text = fs.readFileSync(file, "utf8");
    expect(text.startsWith("# Changelog"), "the chronicle has a title").toBe(true);

    expect(text, "versions are pull request numbers, not a separate scheme").not.toMatch(/^## v0\./m);
    expect(text, "the chronicle names a secret it should only hint at").not.toMatch(
        /Laser Gun|Copper Key|Jade Key|Crystal Key|beating Luca|Beat Luca|meet Luca|hidden door|secret meeting/
    );
    const record = text.split(/^## Highlights/m)[0];
    const firstBullet = record.split("\n").find((line) => line.startsWith("- **v"));
    expect(firstBullet, "the newest entry has a version").toBeTruthy();

    const mentioned = [...text.matchAll(/\/pull\/(\d+)/g)].map((match) => Number(match[1]));
    const newest = Math.max(...mentioned);
    expect(firstBullet).toMatch(new RegExp(`^- \\*\\*v${newest}\\*\\*`));
    expect(firstBullet).toContain(`/pull/${newest}`);

    const log = execSync("git log --first-parent --pretty=%s HEAD", { encoding: "utf8" });
    const history = new Set();
    for (const match of log.matchAll(/\(#(\d+)\)/g)) history.add(Number(match[1]));
    for (const match of log.matchAll(/Merge pull request #(\d+)/g)) history.add(Number(match[1]));
    expect(history.size).toBeGreaterThan(0);
    const missing = [...history].filter((n) => !mentioned.includes(n)).sort((a, b) => a - b);
    expect(missing, "changelog is missing merged pull requests").toEqual([]);
    for (const n of history) {
        const line = record.split("\n").find((entry) => entry.includes(`/pull/${n})`));
        expect(line, `v${n} is missing`).toMatch(new RegExp(`\\*\\*v${n}\\*\\*`));
    }
});
