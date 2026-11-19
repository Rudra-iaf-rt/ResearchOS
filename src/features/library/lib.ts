import type { Paper } from "@/types";
import type { PaperInput } from "./api";

interface BibFields {
  [key: string]: string;
}

function cleanBraces(value: string) {
  return value
    .replace(/[{}]/g, "")
    .replace(/\\&/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFields(body: string): BibFields {
  const fields: BibFields = {};
  const keyRegex = /([A-Za-z][\w-]*)\s*=\s*/g;
  let index = 0;

  while (index < body.length) {
    keyRegex.lastIndex = index;
    const match = keyRegex.exec(body);
    if (!match) break;

    const key = match[1].toLowerCase();
    let cursor = keyRegex.lastIndex;
    let raw = "";

    if (body[cursor] === "{") {
      const start = cursor + 1;
      let depth = 0;
      let escaped = false;

      for (; cursor < body.length; cursor += 1) {
        const character = body[cursor];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (character === "\\") {
          escaped = true;
          continue;
        }
        if (character === "{") depth += 1;
        if (character === "}") {
          depth -= 1;
          if (depth === 0) {
            raw = body.slice(start, cursor);
            cursor += 1;
            break;
          }
        }
      }
    } else if (body[cursor] === '"') {
      const start = cursor + 1;
      let escaped = false;
      cursor += 1;

      for (; cursor < body.length; cursor += 1) {
        const character = body[cursor];
        if (escaped) {
          escaped = false;
          continue;
        }
        if (character === "\\") {
          escaped = true;
          continue;
        }
        if (character === '"') {
          raw = body.slice(start, cursor);
          cursor += 1;
          break;
        }
      }
    } else {
      const start = cursor;
      while (cursor < body.length && body[cursor] !== "," && body[cursor] !== "\n") {
        cursor += 1;
      }
      raw = body.slice(start, cursor);
    }

    fields[key] = cleanBraces(raw);
    index = cursor;
  }

  return fields;
}

function normalizeAuthor(value: string) {
  const cleaned = cleanBraces(value);
  const [last, ...rest] = cleaned.split(",").map((part) => part.trim());
  if (rest.length === 0) return cleaned;

  const given = rest.join(" ").trim();
  return given ? `${given} ${last}` : cleaned;
}

export function parseBibtex(text: string): PaperInput[] {
  const chunks = text.split(/@(?=\w+\s*[{(])/).filter((chunk) => chunk.trim());
  const papers: PaperInput[] = [];

  for (const chunk of chunks) {
    const opening = chunk.search(/[{(]/);
    if (opening === -1) continue;
    const body = chunk.slice(opening + 1);
    const fields = parseFields(body);
    if (!fields.title) continue;

    const year = Number.parseInt(fields.year ?? "", 10);
    const authors = (fields.author ?? "")
      .split(/\s+and\s+/)
      .map(normalizeAuthor)
      .filter(Boolean);

    papers.push({
      title: fields.title,
      authors: authors.length > 0 ? authors : ["Unknown author"],
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      journal: fields.journal || fields.booktitle || fields.publisher || "Unpublished",
      doi: fields.doi ?? "",
      abstract: fields.abstract ?? "",
      tags: (fields.keywords ?? "")
        .split(/[,;]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8),
      projectId: null,
      notes: fields.note ?? "",
    });
  }

  return papers;
}

const demoBibtex = `@article{chen2025coupling,
  title = {Theta–gamma coupling predicts working-memory capacity},
  author = {Chen, Maya and Rao, Arjun},
  journal = {Journal of Cognitive Neuroscience},
  year = {2025},
  doi = {10.1162/jocn.2025.0012},
  keywords = {EEG, Working Memory}
}`;

export const sampleBibtex = demoBibtex;

/** "S. Nakamura, L. Moreau, and M. Chen" */
export function formatAuthorList(authors: string[]) {
  if (authors.length === 0) return "Unknown authors";
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors[authors.length - 1]}`;
}

/** A compact APA-style citation assembled from the stored metadata. */
export function formatCitation(paper: Paper) {
  const authors = formatAuthorList(paper.authors);
  const journal = paper.journal.endsWith(".") ? paper.journal : `${paper.journal}.`;
  const doi = paper.doi ? ` https://doi.org/${paper.doi.replace(/^https?:\/\/doi\.org\//, "")}` : "";
  return `${authors} (${paper.year}). ${paper.title}. ${journal}${doi}`;
}

export function doiUrl(doi: string) {
  if (!doi) return "";
  return `https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//, "")}`;
}
