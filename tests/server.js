// A static file server for the test run.
//
// The game needs to be served over http rather than opened from disk: browsers
// give file:// pages an opaque origin, and localStorage - which is where saved
// games live - either throws or is thrown away there. This is deliberately
// dependency-free so `npm test` works on a clone with nothing else installed.

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 8111;

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".mp3": "audio/mpeg",
};

const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const target = path.join(ROOT, url === "/" ? "index.html" : url);

    // Never serve anything from outside the project, whatever the path says.
    if (!target.startsWith(ROOT + path.sep) && target !== path.join(ROOT, "index.html")) {
        res.writeHead(403).end("Forbidden");
        return;
    }

    fs.readFile(target, (err, body) => {
        if (err) {
            res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
            return;
        }
        res.writeHead(200, {
            "Content-Type": TYPES[path.extname(target).toLowerCase()] || "application/octet-stream",
            // Every test run should see the files as they are on disk right now.
            "Cache-Control": "no-store",
        }).end(body);
    });
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`serving ${ROOT} on http://127.0.0.1:${PORT}`);
});
