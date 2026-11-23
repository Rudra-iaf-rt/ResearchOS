import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import type { Folder, GraphEdge, GraphNode, ResearchFile, Task } from "@/types";
import { DEMO_DB_KEY } from "@/services/mock/storage";
import { graphApi } from "./api";
import { useGraphFocus } from "./hooks/use-graph-focus";
import { citationNeighborhood, citationTagSet, citationYearRange } from "./lib/citation";
import { filterCitationGraph, filterGraph } from "./lib/filters";
import { buildFileTree, canMoveFolder, folderDescendantIds } from "./lib/file-tree";
import { computeLayout } from "./lib/layouts";
import {
  buildOutlineTree,
  extractOutline,
  moveOutlineSection,
} from "./lib/outline";
import { buildStressGraph } from "./lib/stress";
import {
  buildProjectTaskTree,
  isTaskDescendant,
  validateTaskReparent,
} from "./lib/task-tree";
import {
  filterValidEdges,
  relatedNodeIds,
  validateGraph,
} from "./lib/validation";
import { filesApi } from "@/features/files/api";
import { tasksApi } from "@/features/tasks/api";
import { NodeDetailPanel } from "./components/node-detail-panel";

const node = (
  id: string,
  type: GraphNode["type"],
  extra: Partial<GraphNode> = {},
): GraphNode => ({ id, type, label: id, ...extra });

const edge = (
  id: string,
  from: string,
  to: string,
  type: GraphEdge["type"] = "depends",
): GraphEdge => ({ id, from, to, type });

describe("graph validation", () => {
  it("reports duplicate ids, dangling edges, and self links", () => {
    const nodes = [node("a", "project"), node("a", "project"), node("b", "experiment")];
    const result = validateGraph(nodes, [
      edge("e1", "a", "missing"),
      edge("e2", "b", "b"),
    ]);

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("Duplicate node id"))).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("missing node"))).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("itself"))).toBe(true);
  });

  it("drops edges that reference nodes outside the visible graph", () => {
    const nodes = [node("a", "project"), node("b", "experiment")];
    const kept = filterValidEdges(nodes, [
      edge("keep", "a", "b"),
      edge("drop", "a", "gone"),
      edge("self", "a", "a"),
    ]);

    expect(kept.map((item) => item.id)).toEqual(["keep"]);
  });

  it("dims unrelated nodes relative to a focus node", () => {
    const related = relatedNodeIds("b", [edge("e1", "a", "b"), edge("e2", "c", "d")]);
    expect(Array.from(related).sort()).toEqual(["a", "b"]);
  });
});

describe("graph layouts", () => {
  const nodes = [
    node("p", "project"),
    node("h", "hypothesis"),
    node("e", "experiment"),
    node("r", "run"),
  ];
  const edges = [
    edge("e1", "p", "h", "depends"),
    edge("e2", "h", "e", "branches"),
    edge("e3", "e", "r", "tests"),
  ];

  it("positions every node for each supported layout", () => {
    (["dagre-lr", "dagre-tb", "radial", "manual"] as const).forEach((layout) => {
      const positions = computeLayout(nodes, edges, layout);
      expect(Object.keys(positions).sort()).toEqual(["e", "h", "p", "r"]);
      Object.values(positions).forEach((point) => {
        expect(Number.isFinite(point.x)).toBe(true);
        expect(Number.isFinite(point.y)).toBe(true);
      });
    });
  });

  it("is deterministic and honours stored manual coordinates", () => {
    const first = computeLayout(nodes, edges, "dagre-lr");
    const second = computeLayout(nodes, edges, "dagre-lr");
    expect(first).toEqual(second);

    const manual = computeLayout(
      [node("m", "dataset", { metadata: { position: { x: 42, y: 84 } } })],
      [],
      "manual",
    );
    expect(manual.m).toEqual({ x: 42, y: 84 });
  });

  it("lays out a 200-node stress graph with valid edges", () => {
    const graph = buildStressGraph(200);
    expect(graph.nodes).toHaveLength(200);
    expect(validateGraph(graph.nodes, graph.edges).valid).toBe(true);

    const started = performance.now();
    const positions = computeLayout(graph.nodes, graph.edges, "dagre-lr");
    const elapsed = performance.now() - started;

    expect(Object.keys(positions)).toHaveLength(200);
    // Generous ceiling: this guards against accidental quadratic blow-ups,
    // not a frame-rate claim.
    expect(elapsed).toBeLessThan(4000);
  });
});

describe("graph filters", () => {
  const nodes = [
    node("p", "project", { status: "active" }),
    node("h", "hypothesis", { status: "supported" }),
    node("e", "experiment", { status: "running" }),
    node("r", "run", { status: "completed" }),
  ];
  const edges = [
    edge("e1", "p", "h"),
    edge("e2", "h", "e"),
    edge("e3", "e", "r"),
  ];
  const graph = { nodes, edges };

  it("filters by node type, run visibility, and status", () => {
    expect(
      filterGraph(graph, { nodeTypes: ["hypothesis", "experiment"] }).nodes.map((item) => item.id),
    ).toEqual(["h", "e"]);

    expect(filterGraph(graph, { showRuns: false }).nodes.map((item) => item.id)).toEqual([
      "p",
      "h",
      "e",
    ]);

    expect(
      filterGraph(graph, { statuses: ["running"] }).nodes.map((item) => item.id),
    ).toEqual(["e"]);
  });

  it("filters by search text and prunes invalid edges", () => {
    const result = filterGraph(graph, { search: "h" });
    expect(result.nodes.map((item) => item.id)).toEqual(["h"]);
    expect(result.edges).toEqual([]);
  });
});

describe("citation helpers", () => {
  const paper = (id: string, year: number, tags: string[], inLibrary = true): GraphNode =>
    node(id, "paper", {
      label: `Paper ${id}`,
      metadata: { year, tags, inLibrary },
    });

  const nodes = [
    paper("seed", 2020, ["eeg"]),
    paper("near", 2021, ["eeg", "methods"]),
    paper("far", 2019, ["review"], false),
    paper("isolated", 2022, ["other"]),
  ];
  const edges = [
    edge("c1", "seed", "near", "cites"),
    edge("c2", "near", "far", "cites"),
  ];

  it("expands an undirected neighbourhood by radius", () => {
    expect(Array.from(citationNeighborhood("seed", edges, 1)).sort()).toEqual([
      "near",
      "seed",
    ]);
    expect(Array.from(citationNeighborhood("seed", edges, 2)).sort()).toEqual([
      "far",
      "near",
      "seed",
    ]);
  });

  it("derives year and tag facets", () => {
    expect(citationYearRange(nodes)).toEqual({ min: 2019, max: 2022 });
    expect(citationTagSet(nodes)).toEqual(["eeg", "methods", "other", "review"]);
  });

  it("applies library, year, and tag filters while keeping the seed", () => {
    const graph = { nodes, edges };
    const onlyLibrary = filterCitationGraph(graph, "seed", {
      radius: 2,
      onlyLibrary: true,
    });
    expect(onlyLibrary.nodes.map((item) => item.id)).not.toContain("far");

    const recent = filterCitationGraph(graph, "seed", {
      radius: 2,
      yearFrom: 2020,
      yearTo: 2021,
      onlyLibrary: false,
    });
    expect(recent.nodes.map((item) => item.id)).toEqual(["seed", "near"]);

    const tagged = filterCitationGraph(graph, "seed", {
      radius: 2,
      tags: ["review"],
      onlyLibrary: false,
    });
    expect(tagged.nodes.map((item) => item.id)).toContain("seed");
    expect(tagged.nodes.map((item) => item.id)).toContain("far");
    expect(tagged.nodes.map((item) => item.id)).not.toContain("near");
  });
});

describe("graph API payloads", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("builds a valid project DAG from seeded records", async () => {
    const payload = await graphApi.project("proj_cortical");
    expect(payload.projectTitle.length).toBeGreaterThan(0);
    expect(payload.nodes.some((item) => item.type === "hypothesis")).toBe(true);
    expect(payload.nodes.some((item) => item.type === "experiment")).toBe(true);
    expect(payload.nodes.some((item) => item.type === "run")).toBe(true);
    expect(validateGraph(payload.nodes, payload.edges).valid).toBe(true);
  });

  it("builds a knowledge graph from explicit links only", async () => {
    const payload = await graphApi.knowledge();
    expect(payload.empty).toBe(false);
    expect(payload.nodes.some((item) => item.type === "notebook")).toBe(true);
    expect(payload.nodes.some((item) => item.type === "decision")).toBe(true);
    expect(validateGraph(payload.nodes, payload.edges).valid).toBe(true);
  });

  it("returns a seed-centred citation neighbourhood", async () => {
    const universe = await graphApi.citationUniverse();
    expect(universe.nodes.length).toBeGreaterThan(1);

    const payload = await graphApi.citations(universe.seedId, 1);
    expect(payload.seedPaper?.id).toBe(universe.seedId);
    expect(payload.nodes.some((item) => item.id === universe.seedId)).toBe(true);
    expect(validateGraph(payload.nodes, payload.edges).valid).toBe(true);
  });
});

describe("outline helpers", () => {
  const html = [
    "<h1>Intro</h1>",
    "<p>Opening paragraph.</p>",
    "<h2>Methods</h2>",
    "<p><strong>Bold</strong> method text.</p>",
    "<h3>Details</h3>",
    "<p>Detail text.</p>",
    "<h2>Results</h2>",
    "<p>Result text.</p>",
  ].join("");

  it("extracts real headings and nests them by level", () => {
    const headings = extractOutline(html);
    expect(headings.map((item) => item.text)).toEqual([
      "Intro",
      "Methods",
      "Details",
      "Results",
    ]);

    const tree = buildOutlineTree(headings);
    expect(tree).toHaveLength(1);
    expect(tree[0].children.map((item) => item.text)).toEqual(["Methods", "Results"]);
    expect(tree[0].children[0].children[0].text).toBe("Details");
  });

  it("moves a parent section with its children and preserves formatting", () => {
    const moved = moveOutlineSection(html, "heading-1", "heading-3", "after");
    const headings = extractOutline(moved);
    expect(headings.map((item) => item.text)).toEqual([
      "Intro",
      "Results",
      "Methods",
      "Details",
    ]);
    expect(moved).toContain("<strong>Bold</strong>");
  });

  it("rejects moving a section inside itself", () => {
    expect(moveOutlineSection(html, "heading-1", "heading-2", "inside")).toBe(html);
  });
});

describe("project tree helpers", () => {
  const project = {
    id: "p1",
    title: "Project",
    description: "",
    status: "active" as const,
    progress: 0,
    startDate: "2026-01-01",
    targetDate: "2026-12-31",
    tags: [],
    objectives: [],
    owner: { id: "u", name: "Owner", initials: "O", color: "#000" },
    members: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    accent: "teal" as const,
  };

  const task = (id: string, parentTaskId: string | null = null): Task => ({
    id,
    title: id,
    description: "",
    status: "todo",
    priority: "medium",
    projectId: "p1",
    assignee: null,
    dueDate: null,
    tags: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    completedAt: null,
    milestoneId: null,
    parentTaskId,
  });

  it("builds project → milestone → task → subtask and breaks cycles", () => {
    const tasks = [task("parent"), task("child", "parent"), task("loop", "loop")];
    const tree = buildProjectTaskTree(project, [], tasks);
    const unassigned = tree.children[0];
    const parent = unassigned.children.find((item) => item.recordId === "parent");
    expect(parent?.children[0].recordId).toBe("child");
    expect(isTaskDescendant(tasks, "child", "parent")).toBe(true);
  });

  it("rejects self, descendant, and second-level parents", () => {
    const tasks = [task("a"), task("b", "a"), task("c")];
    expect(validateTaskReparent(tasks, "a", "a", "p1")).toContain("its own parent");
    expect(validateTaskReparent(tasks, "a", "b", "p1")).toContain("one level deep");
    expect(validateTaskReparent(tasks, "c", "b", "p1")).toContain("one level deep");
    expect(validateTaskReparent(tasks, "a", null, "p1")).toBeNull();
  });

  it("persists a rename and rejects an invalid re-parent without losing the task", async () => {
    window.localStorage.removeItem(DEMO_DB_KEY);
    const renamed = await tasksApi.rename("task_2", "Renamed analysis task");
    expect(renamed.title).toBe("Renamed analysis task");

    await expect(
      tasksApi.reparent("task_1", { parentTaskId: "task_21", milestoneId: "ms_1" }),
    ).rejects.toThrow(/one level deep/i);

    const stored = JSON.parse(window.localStorage.getItem(DEMO_DB_KEY) ?? "{}") as {
      tasks: Task[];
    };
    const task1 = stored.tasks.find((item) => item.id === "task_1");
    expect(task1?.parentTaskId ?? null).toBeNull();
    expect(stored.tasks.find((item) => item.id === "task_2")?.title).toBe(
      "Renamed analysis task",
    );

    await tasksApi.reparent("task_21", { parentTaskId: "task_2", milestoneId: "ms_2" });
    const after = JSON.parse(window.localStorage.getItem(DEMO_DB_KEY) ?? "{}") as {
      tasks: Task[];
    };
    expect(after.tasks.find((item) => item.id === "task_21")?.parentTaskId).toBe("task_2");
  });
});

describe("file tree helpers", () => {
  const folder = (id: string, parentId: string | null = null): Folder => ({
    id,
    name: id,
    parentId,
    createdAt: "2026-01-01",
    projectId: null,
  });
  const file = (id: string, folderId: string | null, size: number): ResearchFile => ({
    id,
    name: id,
    kind: "dataset",
    size,
    folderId,
    projectId: null,
    uploadedAt: "2026-01-01",
    uploadedBy: { id: "u", name: "Owner", initials: "O", color: "#000" },
    starred: false,
    description: "",
  });

  it("rolls up folder sizes through descendants and keeps orphans visible", () => {
    const folders = [folder("root"), folder("child", "root"), folder("orphan", "missing")];
    const files = [
      file("a", "root", 100),
      file("b", "child", 50),
      file("c", null, 25),
      file("d", "gone", 5),
    ];
    const tree = buildFileTree(folders, files);
    const root = tree.roots.find((item) => item.id === "root");
    expect(root?.size).toBe(150);
    expect(root?.fileCount).toBe(2);
    expect(tree.roots.some((item) => item.id === "orphan")).toBe(true);
    expect(tree.unfiled.map((item) => item.id).sort()).toEqual(["c", "d"]);
  });

  it("prevents moving a folder into itself or a descendant", () => {
    const folders = [folder("a"), folder("b", "a"), folder("c", "b")];
    expect(canMoveFolder(folders, "a", "a")).toBe(false);
    expect(canMoveFolder(folders, "a", "c")).toBe(false);
    expect(canMoveFolder(folders, "c", "a")).toBe(true);
    expect(canMoveFolder(folders, "a", null)).toBe(true);
    expect(Array.from(folderDescendantIds(folders, "a")).sort()).toEqual(["b", "c"]);
  });

  it("rejects an invalid move and preserves the stored folder record", async () => {
    window.localStorage.removeItem(DEMO_DB_KEY);
    await expect(filesApi.moveFolder("folder_datasets", "folder_eeg_raw")).rejects.toThrow(
      /cannot move into itself/i,
    );
    const stored = JSON.parse(window.localStorage.getItem(DEMO_DB_KEY) ?? "{}") as {
      folders: Folder[];
    };
    const parent = stored.folders.find((item) => item.id === "folder_datasets");
    expect(parent?.parentId).toBeNull();

    const moved = await filesApi.moveFolder("folder_eeg_raw", null);
    expect(moved.parentId).toBeNull();
  });
});

describe("node detail panel", () => {
  const hypothesis = node("h1", "hypothesis", {
    label: "Alpha predicts capacity",
    status: "supported",
    metadata: {
      kind: "conclusion",
      description: "Alpha power predicts working-memory capacity.",
      owner: "Maya Chen",
      tags: ["EEG"],
      href: "/app/projects/p1",
      metrics: [{ label: "Confidence", value: "High" }],
    },
  });
  const run = node("r1", "run", { label: "run/7", status: "completed" });
  const connections = [edge("e1", "r1", "h1", "tests")];

  it("renders the selected node, metadata, links, and related nodes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSelect = vi.fn();

    render(
      <NodeDetailPanel
        node={hypothesis}
        nodes={[hypothesis, run]}
        edges={connections}
        onClose={onClose}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.getByRole("complementary", { name: "Details for Alpha predicts capacity" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hypothesis · Conclusion")).toBeInTheDocument();
    expect(screen.getByText("supported")).toBeInTheDocument();
    expect(screen.getByText("Confidence")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open artifact/i })).toHaveAttribute(
      "href",
      "/app/projects/p1",
    );

    await user.click(screen.getByRole("button", { name: /run\/7/ }));
    expect(onSelect).toHaveBeenCalledWith("r1");

    await user.click(screen.getByRole("button", { name: "Close node details" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with Escape and renders an empty relationship state", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <NodeDetailPanel
        node={run}
        nodes={[run]}
        edges={[]}
        onClose={onClose}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByText("No connections in this view yet.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function FocusProbe({ ids }: { ids: string[] }) {
  const { focusId, setFocus, clearFocus } = useGraphFocus(ids);
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div>
      <span data-testid="focus">{focusId ?? "none"}</span>
      <span data-testid="search">{location.search}</span>
      <button type="button" onClick={() => setFocus("node-b")}>
        select b
      </button>
      <button type="button" onClick={() => setFocus("node-a")}>
        select a
      </button>
      <button type="button" onClick={clearFocus}>
        clear
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        back
      </button>
    </div>
  );
}

describe("shared graph focus URL state", () => {
  const ids = ["node-a", "node-b"];

  it("restores focus from a direct load and pushes history for changes", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/app/knowledge?focus=node-a"]}>
        <FocusProbe ids={ids} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("focus")).toHaveTextContent("node-a");
    await user.click(screen.getByRole("button", { name: "select b" }));
    expect(screen.getByTestId("focus")).toHaveTextContent("node-b");

    await user.click(screen.getByRole("button", { name: "back" }));
    expect(screen.getByTestId("focus")).toHaveTextContent("node-a");
  });

  it("removes an invalid focus without breaking the view", async () => {
    render(
      <MemoryRouter initialEntries={["/app/knowledge?focus=deleted-node"]}>
        <FocusProbe ids={ids} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("focus")).toHaveTextContent("none");
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent(""));
  });

  it("clears the parameter when focus is cleared", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/app/knowledge?focus=node-a"]}>
        <FocusProbe ids={ids} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "clear" }));
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });
});
