import { beforeEach, describe, expect, it } from "vitest";
import { experimentsApi } from "@/features/experiments/api";
import { runsApi } from "@/features/runs/api";
import { hypothesesApi } from "@/features/hypotheses/api";
import { evidenceApi } from "@/features/evidence/api";
import { decisionsApi } from "@/features/decisions/api";
import { snapshotsApi } from "@/features/snapshots/api";
import { historyApi } from "@/features/history/api";
import { htmlToText, parseTableText } from "@/features/history/lib";
import { projectsApi } from "@/features/projects/api";
import { DEMO_DB_KEY } from "@/services/mock/storage";

describe("scientific reasoning flows", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("creates an experiment, enforces transitions, and freezes run parameters", async () => {
    const projects = await projectsApi.list();
    const created = await experimentsApi.create({
      title: "Test coupling replication",
      projectId: projects[0].id,
      hypothesisId: null,
      description: "Automated test experiment.",
      parameters: [
        { id: "p1", key: "coupling", value: "0.42" },
        { id: "p2", key: "epochs", value: "120" },
      ],
    });

    expect(created.status).toBe("draft");
    expect(created.parameters).toHaveLength(2);
    await expect(experimentsApi.setStatus(created.id, "succeeded")).rejects.toThrow();

    const queued = await experimentsApi.setStatus(created.id, "queued");
    expect(queued.status).toBe("queued");

    const run = await runsApi.create(created.id, { label: "replication-a" });
    expect(run.runNumber).toBeGreaterThan(0);
    expect(run.status).toBe("queued");
    expect(run.parameters.map((parameter) => parameter.value)).toEqual(["0.42", "120"]);

    const updated = await experimentsApi.saveParameters(created.id, [
      { id: "p1", key: "coupling", value: "0.99" },
    ]);
    expect(updated.parameters[0].value).toBe("0.99");

    const frozen = await runsApi.get(run.id);
    expect(frozen.parameters[0].value).toBe("0.42");

    await expect(runsApi.setStatus(run.id, "succeeded")).rejects.toThrow();
    await runsApi.setStatus(run.id, "running");
    const finished = await runsApi.setStatus(run.id, "succeeded");
    expect(finished.status).toBe("succeeded");
    expect(finished.startedAt).toBeTruthy();
    expect(finished.endedAt).toBeTruthy();
    expect(finished.logs).toContain("Run finished successfully");
  });

  it("moves hypotheses through evidence-backed statuses", async () => {
    const projects = await projectsApi.list();
    const hypothesis = await hypothesesApi.create({
      researchQuestion: "Does coupling track behaviour?",
      statement: "Coupling strength predicts behavioural performance.",
      projectId: projects[0].id,
    });
    expect(hypothesis.status).toBe("proposed");

    const supporting = await evidenceApi.create(hypothesis.id, {
      stance: "supports",
      description: "Higher coupling tracked faster responses.",
    });
    const contradicting = await evidenceApi.create(hypothesis.id, {
      stance: "contradicts",
      description: "One cohort reversed the effect.",
    });
    expect(supporting.stance).toBe("supports");
    expect(contradicting.stance).toBe("contradicts");

    const all = await evidenceApi.list(hypothesis.id);
    expect(all).toHaveLength(2);

    await hypothesesApi.setStatus(hypothesis.id, "testing");
    const promoted = await hypothesesApi.setStatus(hypothesis.id, "supported");
    expect(promoted.status).toBe("supported");

    await evidenceApi.remove(contradicting.id);
    expect(await evidenceApi.list(hypothesis.id)).toHaveLength(1);
  });

  it("records ADR-style decisions with alternatives", async () => {
    const projects = await projectsApi.list();
    const decision = await decisionsApi.create({
      title: "Choose the 30-component solution",
      projectId: projects[0].id,
      context: "The 20-component model underfit the held-out cohort.",
      decision: "Adopt 30 components for all downstream analyses.",
      alternatives: [
        {
          id: "alt_a",
          title: "Retain 20 components",
          rationale: "More interpretable but underfit.",
        },
      ],
      artifacts: [],
      status: "accepted",
    });

    expect(decision.alternatives).toHaveLength(1);
    const updated = await decisionsApi.update(decision.id, {
      status: "superseded",
      context: "A larger replication replicated the 30-component result.",
    });
    expect(updated.status).toBe("superseded");
    expect(updated.alternatives[0].title).toBe("Retain 20 components");

    await decisionsApi.remove(decision.id);
    expect((await decisionsApi.list()).some((item) => item.id === decision.id)).toBe(false);
  });

  it("freezes snapshot manifests at creation time", async () => {
    const projects = await projectsApi.list();
    const project = projects.find((item) => item.id === "proj_cortical") ?? projects[0];
    const candidates = await snapshotsApi.candidates(project.id);
    expect(candidates.length).toBeGreaterThan(0);

    const snapshot = await snapshotsApi.create({
      label: "Automated freeze",
      projectId: project.id,
      description: "Created by the reasoning test suite.",
      doi: "",
      itemKeys: candidates.slice(0, 2).map((candidate) => candidate.key),
    });

    expect(snapshot.manifest).toHaveLength(2);
    expect(snapshot.doi).toBeNull();
    expect(snapshot.manifest[0].selectedAt).toBe(snapshot.createdAt);

    const firstEntry = snapshot.manifest[0];
    if (firstEntry.artifactType === "experiment") {
      await experimentsApi.update(firstEntry.artifactId, {
        title: "Renamed after the snapshot",
      });
    }

    const reloaded = await snapshotsApi.get(snapshot.id);
    expect(reloaded.manifest[0].title).toBe(firstEntry.title);

    const exported = await snapshotsApi.manifestExport(reloaded);
    expect(exported.schema).toBe("researchos.snapshot.manifest");
    expect(exported.manifestCount).toBe(2);
    expect(exported.notice).toContain("Metadata manifest only");
  });

  it("restores a historical version without deleting earlier versions", async () => {
    const experiments = await experimentsApi.list();
    const experiment = experiments[0];
    const originalTitle = experiment.title;
    const before = await historyApi.list("experiment", experiment.id);

    const baseline = await historyApi.create("experiment", experiment.id, {
      label: "Automated baseline",
      summary: "Captured before the test edit.",
    });

    await experimentsApi.update(experiment.id, { title: "Edited by the test suite" });
    const changed = await historyApi.list("experiment", experiment.id);
    expect(changed.length).toBe(before.length + 1);
    expect(changed[changed.length - 1].content).toContain(originalTitle);

    const restored = await historyApi.restore(baseline.id);
    expect(restored.label).toContain("Restored");

    const after = await historyApi.list("experiment", experiment.id);
    expect(after.length).toBe(before.length + 2);
    before.forEach((version) => {
      expect(after.some((item) => item.id === version.id)).toBe(true);
    });

    const reloaded = await experimentsApi.get(experiment.id);
    expect(reloaded.title).toBe(originalTitle);
    expect(after[after.length - 1].content).toBe(baseline.content);
  });
});

describe("version diff helpers", () => {
  it("converts TipTap HTML to readable text", () => {
    const text = htmlToText("<h2>Observations</h2><p>Alpha &amp; beta</p><ul><li>One</li></ul>");
    expect(text).toContain("Observations");
    expect(text).toContain("Alpha & beta");
    expect(text.split("\n").filter(Boolean)).toHaveLength(3);
  });

  it("parses markdown tables and ignores separator rows", () => {
    const table = parseTableText(
      "| Metric | Value |\n| --- | --- |\n| Coupling | 0.42 |\n| Epochs | 120 |",
    );
    expect(table.rows).toEqual([
      ["Metric", "Value"],
      ["Coupling", "0.42"],
      ["Epochs", "120"],
    ]);
  });
});
