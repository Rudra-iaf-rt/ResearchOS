/**
 * Outline helpers for the notebook editor.
 *
 * TipTap serializes headings as plain `<h1>`–`<h6>` elements. We read the
 * document HTML rather than the ProseMirror JSON so the outline always
 * reflects exactly what is rendered, and reorder whole sections by moving
 * those elements around. Inline formatting inside each block is untouched.
 */

export interface OutlineHeading {
  /** Stable within one document snapshot: `heading-<dom index>`. */
  id: string;
  index: number;
  level: number;
  text: string;
}

export interface OutlineTreeNode extends OutlineHeading {
  children: OutlineTreeNode[];
}

export type OutlineDropPosition = "before" | "after" | "inside";

const HEADING_SELECTOR = "h1,h2,h3,h4,h5,h6";

function headingLevel(element: Element): number {
  const level = Number(element.tagName.slice(1));
  return Number.isFinite(level) && level >= 1 && level <= 6 ? level : 1;
}

export function extractOutline(content: string): OutlineHeading[] {
  if (!content || typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(content, "text/html");
  return Array.from(doc.querySelectorAll(HEADING_SELECTOR)).map((element, index) => ({
    id: `heading-${index}`,
    index,
    level: headingLevel(element),
    text: element.textContent?.trim() || "Untitled heading",
  }));
}

/** Nest headings by level, tolerating documents that skip levels. */
export function buildOutlineTree(headings: OutlineHeading[]): OutlineTreeNode[] {
  const roots: OutlineTreeNode[] = [];
  const stack: OutlineTreeNode[] = [];

  headings.forEach((heading) => {
    const node: OutlineTreeNode = { ...heading, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else roots.push(node);
    stack.push(node);
  });

  return roots;
}

function sectionsFor(blocks: Element[]): {
  heading: Element;
  level: number;
  start: number;
  end: number;
}[] {
  const headings = blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => /^H[1-6]$/.test(block.tagName));

  return headings.map(({ block, index }, headingIndex) => {
    const level = headingLevel(block);
    let end = blocks.length;
    for (let cursor = headingIndex + 1; cursor < headings.length; cursor += 1) {
      const next = headings[cursor];
      if (headingLevel(next.block) <= level) {
        end = next.index;
        break;
      }
    }
    return { heading: block, level, start: index, end };
  });
}

function replaceHeadingLevel(doc: Document, element: Element, level: number): Element {
  const replacement = doc.createElement(`h${Math.min(6, Math.max(1, level))}`);
  Array.from(element.attributes).forEach((attribute) => {
    replacement.setAttribute(attribute.name, attribute.value);
  });
  replacement.innerHTML = element.innerHTML;
  return replacement;
}

/**
 * Move a heading section relative to another heading section.
 *
 * A section owns its heading plus every following block until the next
 * heading at the same or a higher level, so moving a parent moves its
 * descendants too. `inside` nests the source one level deeper.
 *
 * Returns the original content unchanged for invalid moves (same target,
 * dropping a section into itself, or ids that no longer exist).
 */
export function moveOutlineSection(
  content: string,
  sourceId: string,
  targetId: string,
  position: OutlineDropPosition,
): string {
  if (!content || sourceId === targetId || typeof DOMParser === "undefined") return content;

  const doc = new DOMParser().parseFromString(content, "text/html");
  const body = doc.body;
  const blocks = Array.from(body.children);
  const sections = sectionsFor(blocks);

  const sourceOrdinal = Number(sourceId.replace("heading-", ""));
  const targetOrdinal = Number(targetId.replace("heading-", ""));
  const source = sections[sourceOrdinal];
  const target = sections[targetOrdinal];
  if (!source || !target) return content;

  // Moving a section into itself would lose content.
  if (target.start > source.start && target.start < source.end) return content;

  const sectionNodes = blocks.slice(source.start, source.end);
  const remaining = blocks.filter((_, index) => index < source.start || index >= source.end);
  const targetHeading = target.heading;
  const targetPosition = remaining.indexOf(targetHeading);
  if (targetPosition === -1) return content;

  let insertAt = targetPosition;
  if (position !== "before") {
    let end = remaining.length;
    for (let cursor = targetPosition + 1; cursor < remaining.length; cursor += 1) {
      const candidate = remaining[cursor];
      if (/^H[1-6]$/.test(candidate.tagName) && headingLevel(candidate) <= target.level) {
        end = cursor;
        break;
      }
    }
    insertAt = end;
  }

  let orderedSection = sectionNodes;
  if (position === "inside") {
    orderedSection = sectionNodes.map((element) =>
      /^H[1-6]$/.test(element.tagName)
        ? replaceHeadingLevel(doc, element, headingLevel(element) + 1)
        : element,
    );
  }

  const ordered = [
    ...remaining.slice(0, insertAt),
    ...orderedSection,
    ...remaining.slice(insertAt),
  ];
  body.replaceChildren(...ordered);

  return body.innerHTML;
}

/** Scroll an editor's rendered heading at `index` into view. */
export function scrollToHeading(root: HTMLElement, index: number) {
  const headings = root.querySelectorAll(HEADING_SELECTOR);
  const heading = headings.item(index);
  if (!heading) return false;
  heading.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
