// Turns CHANGELOG.md into chronicle nodes. Text is never parsed as HTML.
const Chronicle = {
    render(root, markdown) {
        root.replaceChildren();
        const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
        const intro = [];
        const versions = [];
        const rest = [];
        let bucket = intro;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith("# ")) continue;
            if (line.startsWith("## ")) {
                const title = line.slice(3).trim();
                const section = { title: title, lines: [] };
                if (/^v\d/i.test(title)) {
                    versions.push(section);
                    bucket = section.lines;
                } else {
                    rest.push(section);
                    bucket = section.lines;
                }
                continue;
            }
            bucket.push(line);
        }
        this.renderLines(root, intro);
        for (let i = 0; i < versions.length; i++) {
            root.appendChild(this.heading(versions[i].title));
            this.renderLines(root, versions[i].lines);
        }
        for (let i = 0; i < rest.length; i++) {
            root.appendChild(this.heading(rest[i].title));
            this.renderLines(root, rest[i].lines);
        }
    },

    renderLines(root, lines) {
        let list = null;
        let para = null;
        const endBlocks = () => {
            list = null;
            para = null;
        };
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trimEnd();
            if (!line.trim()) {
                endBlocks();
                continue;
            }
            if (line.startsWith("- ")) {
                para = null;
                const item = line.slice(2).trim();
                const entry = this.entryFrom(item);
                if (entry) {
                    if (!list || list.className !== "news-entries") {
                        list = document.createElement("div");
                        list.className = "news-entries";
                        root.appendChild(list);
                    }
                    list.appendChild(entry);
                } else {
                    if (!list || list.tagName !== "UL") {
                        list = document.createElement("ul");
                        list.className = "news-plain";
                        root.appendChild(list);
                    }
                    const li = document.createElement("li");
                    this.appendInline(li, item);
                    list.appendChild(li);
                }
                continue;
            }
            list = null;
            if (!para) {
                para = document.createElement("p");
                para.className = "news-prose";
                root.appendChild(para);
            } else {
                para.appendChild(document.createTextNode(" "));
            }
            this.appendInline(para, line.trim());
        }
    },

    heading(title) {
        const h = document.createElement("h3");
        const parts = title.split(/\s+—\s+/);
        if (parts.length === 2 && /^v\d/i.test(parts[0])) {
            h.className = "news-version";
            const mark = document.createElement("span");
            mark.className = "news-version-mark";
            mark.textContent = parts[0];
            h.appendChild(mark);
            h.appendChild(document.createTextNode(parts[1]));
            return h;
        }
        h.className = "news-banner";
        h.textContent = title;
        return h;
    },

    entryFrom(item) {
        const versioned = item.match(/^\*\*(v[\d.]+|Direct)\*\*\s+—\s+\*\*([^*]+)\*\*\s+—\s+(?:\[([^\]]+)\]\(([^)\s]+)\)\s+—\s+)?([\s\S]+)$/);
        if (versioned) {
            return this.entryRow(versioned[1], versioned[2], versioned[4], versioned[5]);
        }
        const plain = item.match(/^\*\*([^*]+)\*\*\s+—\s+(?:\[([^\]]+)\]\(([^)\s]+)\)\s+—\s+)?([\s\S]+)$/);
        if (!plain) return null;
        return this.entryRow(null, plain[1], plain[3], plain[4]);
    },

    entryRow(version, date, href, rest) {
        const row = document.createElement("article");
        row.className = "news-entry";
        if (version) {
            const badge = document.createElement("div");
            badge.className = "news-version-badge";
            if (href && this.safeUrl(href)) {
                badge.appendChild(this.link(version, href, "news-version-link"));
            } else {
                badge.textContent = version;
            }
            row.appendChild(badge);
        }
        const body = document.createElement("div");
        body.className = "news-entry-body";
        const head = document.createElement("div");
        head.className = "news-entry-head";
        const when = document.createElement("span");
        when.className = "news-date";
        when.textContent = date.trim();
        head.appendChild(when);
        body.appendChild(head);
        const text = document.createElement("p");
        text.className = "news-text";
        this.appendInline(text, rest);
        body.appendChild(text);
        row.appendChild(body);
        return row;
    },

    safeUrl(href) {
        if (href.startsWith("/") && !href.startsWith("//")) return true;
        try {
            const url = new URL(href, "https://luca.maggio.xyz");
            return url.protocol === "https:" || url.protocol === "http:";
        } catch (e) {
            return false;
        }
    },

    link(label, href, className) {
        const a = document.createElement("a");
        if (className) a.className = className;
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = label;
        return a;
    },

    appendInline(parent, text) {
        const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
        let last = 0;
        let found;
        while ((found = pattern.exec(text))) {
            if (found.index > last) {
                parent.appendChild(document.createTextNode(text.slice(last, found.index)));
            }
            if (found[1] != null) {
                const strong = document.createElement("strong");
                strong.textContent = found[1];
                parent.appendChild(strong);
            } else if (this.safeUrl(found[3])) {
                parent.appendChild(this.link(found[2], found[3]));
            } else {
                parent.appendChild(document.createTextNode(found[2]));
            }
            last = found.index + found[0].length;
        }
        if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
    },
};
