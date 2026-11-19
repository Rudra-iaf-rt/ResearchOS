import { describe, expect, it } from "vitest";
import { parseBibtex, doiUrl } from "@/features/library/lib";

describe("library helpers", () => {
  it("parses a BibTeX entry into a paper input", () => {
    const [paper] = parseBibtex(`
      @article{chen2026memory,
        title = {Cortical {Dynamics} of Working Memory},
        author = {Chen, Maya and Rao, Arjun},
        year = {2026},
        journal = {Journal of Cognitive Neuroscience},
        doi = {10.1000/example.2026},
        abstract = {A study of theta-gamma coupling.},
      }
    `);

    expect(paper).toMatchObject({
      title: "Cortical Dynamics of Working Memory",
      authors: ["Maya Chen", "Arjun Rao"],
      year: 2026,
      journal: "Journal of Cognitive Neuroscience",
      doi: "10.1000/example.2026",
      abstract: "A study of theta-gamma coupling.",
    });
  });

  it("skips entries without a title", () => {
    expect(parseBibtex("@article{empty, author = {Ada Lovelace}}")).toEqual([]);
    expect(parseBibtex("")).toEqual([]);
  });

  it("normalizes DOI links", () => {
    expect(doiUrl("10.1000/example")).toBe("https://doi.org/10.1000/example");
    expect(doiUrl("https://doi.org/10.1000/example")).toBe(
      "https://doi.org/10.1000/example",
    );
    expect(doiUrl("")).toBe("");
  });
});
