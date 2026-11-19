export function stripHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body.textContent ?? "";
}

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const block = (content: string) => `${content.trim()}\n\n`;

function inlineToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (!(node instanceof HTMLElement)) return "";

  const children = Array.from(node.childNodes).map(inlineToMarkdown).join("");

  switch (node.tagName.toLowerCase()) {
    case "strong":
    case "b":
      return `**${children}**`;
    case "em":
    case "i":
      return `*${children}*`;
    case "s":
    case "del":
      return `~~${children}~~`;
    case "code":
      return `\`${children}\``;
    case "a": {
      const href = node.getAttribute("href") ?? "";
      return href ? `[${children}](${href})` : children;
    }
    case "br":
      return "  \n";
    case "img":
      return `![${node.getAttribute("alt") ?? ""}](${node.getAttribute("src") ?? ""})`;
    default:
      return children;
  }
}

function nodeToMarkdown(node: Node, listDepth = 0): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";

  const tag = node.tagName.toLowerCase();
  const children = node.children;
  const inner = () => inlineToMarkdown(node);

  if (/^h[1-6]$/.test(tag)) {
    return block(`${"#".repeat(Number(tag[1]))} ${inner()}`);
  }
  if (tag === "p") {
    return block(inner());
  }
  if (tag === "blockquote") {
    const content = Array.from(node.childNodes)
      .map((child) => nodeToMarkdown(child, listDepth))
      .join("")
      .trim();
    return block(
      content
        .split("\n")
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join("\n"),
    );
  }
  if (tag === "pre") {
    return block(`\`\`\`\n${node.textContent ?? ""}\n\`\`\``);
  }
  if (tag === "ul" || tag === "ol") {
    const items = Array.from(children).map((item, index) => {
      if (!(item instanceof HTMLElement)) return "";
      const content = Array.from(item.childNodes)
        .map((child) => nodeToMarkdown(child, listDepth + 1))
        .join("")
        .trim()
        .replace(/\n{2,}/g, "\n");
      const marker = tag === "ol" ? `${index + 1}.` : "-";
      const isTask = item.getAttribute("data-checked");
      const prefix = isTask ? (isTask === "true" ? "- [x]" : "- [ ]") : marker;
      const indent = "  ".repeat(listDepth);
      return `${indent}${prefix} ${content}`;
    });
    return `${items.join("\n")}\n\n`;
  }
  if (tag === "table") {
    const rows = Array.from(node.querySelectorAll("tr")).map((row) =>
      Array.from(row.querySelectorAll("th,td")).map((cell) =>
        inlineToMarkdown(cell).replaceAll("|", "\\|"),
      ),
    );
    if (rows.length === 0) return "";
    const header = `| ${rows[0].join(" | ")} |`;
    const divider = `| ${rows[0].map(() => "---").join(" | ")} |`;
    const body = rows.slice(1).map((row) => `| ${row.join(" | ")} |`).join("\n");
    return block(`${header}\n${divider}${body ? `\n${body}` : ""}`);
  }
  if (tag === "hr") return block("---");
  if (tag === "br") return "\n";

  return Array.from(node.childNodes)
    .map((child) => nodeToMarkdown(child, listDepth))
    .join("");
}

export function htmlToMarkdown(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  return Array.from(document.body.childNodes)
    .map((node) => nodeToMarkdown(node))
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
