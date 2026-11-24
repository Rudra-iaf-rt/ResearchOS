import { addDays, subDays, subHours, subMinutes } from "date-fns";
import {
  createSeedDecisions,
  createSeedEvidence,
  createSeedExperiments,
  createSeedHypotheses,
  createSeedRuns,
  createSeedSnapshots,
  createSeedVersions,
} from "./reasoning-seed";
import type {
  ActivityEvent,
  AnalyticsPoint,
  AppNotification,
  ArtifactRef,
  CitationLink,
  Folder,
  GraphEdge,
  GraphNode,
  Milestone,
  Notebook,
  Paper,
  Person,
  Project,
  ResearchDatabase,
  ResearchFile,
  ResearchLogEntry,
  ResearchMode,
  Task,
  UserProfile,
} from "@/types";

const iso = (date: Date) => date.toISOString();
const daysFromNow = (days: number) => iso(addDays(new Date(), days));
const daysAgo = (days: number) => iso(subDays(new Date(), days));
const hoursAgo = (hours: number) => iso(subHours(new Date(), hours));
const minutesAgo = (minutes: number) => iso(subMinutes(new Date(), minutes));

export const people: Record<string, Person> = {
  maya: {
    id: "person_maya",
    name: "Dr. Maya Chen",
    initials: "MC",
    role: "Principal Investigator",
    color: "#0D9488",
  },
  arjun: {
    id: "person_arjun",
    name: "Arjun Rao",
    initials: "AR",
    role: "PhD Candidate",
    color: "#6366F1",
  },
  lena: {
    id: "person_lena",
    name: "Lena Fischer",
    initials: "LF",
    role: "Postdoctoral Researcher",
    color: "#D97706",
  },
  tomas: {
    id: "person_tomas",
    name: "Tomás Alvarez",
    initials: "TA",
    role: "Research Assistant",
    color: "#0284C7",
  },
  priya: {
    id: "person_priya",
    name: "Priya Nair",
    initials: "PN",
    role: "Data Scientist",
    color: "#DB2777",
  },
  samuel: {
    id: "person_samuel",
    name: "Samuel Okafor",
    initials: "SO",
    role: "Lab Technician",
    color: "#7C3AED",
  },
};

export const currentUser: UserProfile = {
  id: "user_maya",
  name: "Dr. Maya Chen",
  email: "maya.chen@northlight.edu",
  initials: "MC",
  role: "Principal Investigator",
  institution: "Northlight Institute for Brain Science",
  field: "Computational Neuroscience",
  bio: "Studying how distributed cortical networks support working memory, with a focus on translational biomarkers for cognitive decline.",
  timezone: "Asia/Kolkata",
  avatarColor: "#0D9488",
};

const projects: Project[] = [
  {
    id: "proj_cortical",
    title: "Cortical Dynamics of Working Memory",
    description:
      "Characterizing theta–gamma coupling across prefrontal and parietal networks during sustained working-memory load in healthy adults.",
    objectives: [
      "Collect high-density EEG from 60 participants across three load conditions.",
      "Identify network-level signatures that predict working-memory capacity.",
      "Validate a reproducible preprocessing pipeline for multi-site replication.",
      "Publish the primary analysis and release an anonymized dataset.",
    ],
    status: "active",
    progress: 68,
    tags: ["Neuroscience", "EEG", "Cognition"],
    startDate: daysAgo(112),
    targetDate: daysFromNow(54),
    createdAt: daysAgo(140),
    updatedAt: hoursAgo(3),
    owner: people.maya,
    members: [people.maya, people.arjun, people.priya, people.tomas],
    accent: "teal",
  },
  {
    id: "proj_catalysts",
    title: "Photocatalytic Water Splitting Catalysts",
    description:
      "Screening earth-abundant metal-oxide heterostructures for visible-light hydrogen evolution under neutral pH conditions.",
    objectives: [
      "Synthesize and characterize twelve candidate heterostructures.",
      "Benchmark hydrogen evolution rates against a standard reference.",
      "Assess long-term photostability over 100-hour cycles.",
    ],
    status: "active",
    progress: 42,
    tags: ["Materials", "Catalysis", "Sustainability"],
    startDate: daysAgo(86),
    targetDate: daysFromNow(96),
    createdAt: daysAgo(98),
    updatedAt: hoursAgo(9),
    owner: people.lena,
    members: [people.lena, people.samuel, people.maya],
    accent: "indigo",
  },
  {
    id: "proj_heat",
    title: "Urban Heat Island Mapping — Bengaluru",
    description:
      "Combining Landsat thermal imagery with street-level sensor data to model intra-urban heat exposure and inform cooling interventions.",
    objectives: [
      "Build a 30 m resolution surface temperature mosaic for summer 2026.",
      "Calibrate satellite estimates against 40 ground sensors.",
      "Identify priority wards for tree-canopy intervention.",
    ],
    status: "active",
    progress: 81,
    tags: ["Climate", "Remote Sensing", "Urban"],
    startDate: daysAgo(210),
    targetDate: daysFromNow(21),
    createdAt: daysAgo(230),
    updatedAt: daysAgo(1),
    owner: people.arjun,
    members: [people.arjun, people.priya, people.tomas],
    accent: "amber",
  },
  {
    id: "proj_gut",
    title: "Single-Cell Atlas of the Human Gut",
    description:
      "Assembling a cross-sectional single-cell transcriptomic atlas of the intestinal epithelium across age groups.",
    objectives: [
      "Harmonize six public scRNA-seq cohorts.",
      "Annotate rare epithelial cell states.",
      "Release an interactive atlas for the consortium.",
    ],
    status: "planning",
    progress: 15,
    tags: ["Genomics", "Single-cell", "Microbiome"],
    startDate: daysFromNow(7),
    targetDate: daysFromNow(180),
    createdAt: daysAgo(18),
    updatedAt: daysAgo(2),
    owner: people.priya,
    members: [people.priya, people.maya],
    accent: "sky",
  },
  {
    id: "proj_amr",
    title: "Antimicrobial Resistance Surveillance",
    description:
      "Longitudinal surveillance of resistance profiles in tertiary-care hospitals across three districts.",
    objectives: [
      "Standardize isolate collection across sites.",
      "Sequence 500 resistant isolates.",
      "Produce a quarterly resistance dashboard.",
    ],
    status: "on-hold",
    progress: 55,
    tags: ["Public Health", "Genomics", "Epidemiology"],
    startDate: daysAgo(300),
    targetDate: daysFromNow(120),
    createdAt: daysAgo(320),
    updatedAt: daysAgo(9),
    owner: people.maya,
    members: [people.maya, people.samuel],
    accent: "rose",
  },
  {
    id: "proj_quantum",
    title: "Quantum Error Correction Benchmarks",
    description:
      "A reproducible benchmark suite comparing surface-code decoders under realistic noise models.",
    objectives: [
      "Implement three decoder baselines.",
      "Publish benchmark harness and result artifacts.",
    ],
    status: "completed",
    progress: 100,
    tags: ["Quantum", "Benchmarks", "Open Science"],
    startDate: daysAgo(420),
    targetDate: daysAgo(30),
    createdAt: daysAgo(450),
    updatedAt: daysAgo(27),
    owner: people.arjun,
    members: [people.arjun, people.lena],
    accent: "teal",
  },
];

const tasks: Task[] = [
  {
    id: "task_1",
    title: "Finalize EEG preprocessing pipeline",
    description:
      "Lock filter parameters, ICA rejection thresholds, and document the pipeline for the methods section.",
    status: "in-progress",
    priority: "high",
    projectId: "proj_cortical",
    assignee: people.arjun,
    dueDate: daysFromNow(2),
    tags: ["Analysis", "EEG"],
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(2),
    completedAt: null,
  },
  {
    id: "task_2",
    title: "Run theta–gamma coupling analysis on cohort B",
    description: "Apply the validated pipeline and export subject-level coupling indices.",
    status: "todo",
    priority: "high",
    projectId: "proj_cortical",
    assignee: people.priya,
    dueDate: daysFromNow(5),
    tags: ["Analysis"],
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
    completedAt: null,
  },
  {
    id: "task_3",
    title: "Draft results section outline",
    status: "todo",
    priority: "medium",
    projectId: "proj_cortical",
    assignee: people.maya,
    dueDate: daysFromNow(9),
    tags: ["Writing"],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    completedAt: null,
  },
  {
    id: "task_4",
    title: "Recruit final 8 participants",
    description: "Coordinate with the participant registry and confirm session slots for cohort C.",
    status: "in-progress",
    priority: "urgent",
    projectId: "proj_cortical",
    assignee: people.tomas,
    dueDate: daysFromNow(1),
    tags: ["Recruitment"],
    createdAt: daysAgo(20),
    updatedAt: hoursAgo(6),
    completedAt: null,
  },
  {
    id: "task_5",
    title: "Pilot analysis notebook reviewed",
    status: "completed",
    priority: "medium",
    projectId: "proj_cortical",
    assignee: people.priya,
    dueDate: daysAgo(3),
    tags: ["Analysis"],
    createdAt: daysAgo(15),
    updatedAt: daysAgo(3),
    completedAt: daysAgo(3),
  },
  {
    id: "task_6",
    title: "Synthesize Ni-doped TiO₂ heterostructures",
    description: "Batch 4 at three doping concentrations; record XRD immediately after calcination.",
    status: "in-progress",
    priority: "high",
    projectId: "proj_catalysts",
    assignee: people.samuel,
    dueDate: daysFromNow(3),
    tags: ["Synthesis", "Lab"],
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(9),
    completedAt: null,
  },
  {
    id: "task_7",
    title: "Order reference platinum electrode",
    status: "todo",
    priority: "medium",
    projectId: "proj_catalysts",
    assignee: people.lena,
    dueDate: daysFromNow(6),
    tags: ["Procurement"],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    completedAt: null,
  },
  {
    id: "task_8",
    title: "Analyze 100-hour photostability run",
    status: "todo",
    priority: "low",
    projectId: "proj_catalysts",
    assignee: people.lena,
    dueDate: daysFromNow(14),
    tags: ["Analysis"],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    completedAt: null,
  },
  {
    id: "task_9",
    title: "Cross-validate ground sensor calibration",
    description: "Compare sensor readings against the Landsat surface temperature mosaic for 40 sites.",
    status: "in-progress",
    priority: "urgent",
    projectId: "proj_heat",
    assignee: people.arjun,
    dueDate: daysFromNow(1),
    tags: ["Remote Sensing", "Validation"],
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(4),
    completedAt: null,
  },
  {
    id: "task_10",
    title: "Prepare ward-level intervention brief",
    status: "todo",
    priority: "high",
    projectId: "proj_heat",
    assignee: people.priya,
    dueDate: daysFromNow(7),
    tags: ["Policy", "Writing"],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    completedAt: null,
  },
  {
    id: "task_11",
    title: "Export summer mosaic tiles",
    status: "completed",
    priority: "medium",
    projectId: "proj_heat",
    assignee: people.tomas,
    dueDate: daysAgo(6),
    tags: ["Data"],
    createdAt: daysAgo(18),
    updatedAt: daysAgo(6),
    completedAt: daysAgo(6),
  },
  {
    id: "task_12",
    title: "Scope cohort harmonization requirements",
    status: "todo",
    priority: "medium",
    projectId: "proj_gut",
    assignee: people.priya,
    dueDate: daysFromNow(12),
    tags: ["Data", "Planning"],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    completedAt: null,
  },
  {
    id: "task_13",
    title: "Draft data management plan",
    status: "todo",
    priority: "low",
    projectId: "proj_gut",
    assignee: people.maya,
    dueDate: daysFromNow(18),
    tags: ["Planning", "Compliance"],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    completedAt: null,
  },
  {
    id: "task_14",
    title: "Archive sequencing reads to repository",
    description: "Deposit raw reads under controlled access; verify checksums after transfer.",
    status: "todo",
    priority: "high",
    projectId: "proj_amr",
    assignee: people.samuel,
    dueDate: daysAgo(2),
    tags: ["Data", "Compliance"],
    createdAt: daysAgo(12),
    updatedAt: daysAgo(8),
    completedAt: null,
  },
  {
    id: "task_15",
    title: "Review quarterly resistance report",
    status: "completed",
    priority: "medium",
    projectId: "proj_amr",
    assignee: people.maya,
    dueDate: daysAgo(11),
    tags: ["Review"],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(11),
    completedAt: daysAgo(11),
  },
  {
    id: "task_16",
    title: "Publish decoder benchmark artifacts",
    status: "completed",
    priority: "high",
    projectId: "proj_quantum",
    assignee: people.arjun,
    dueDate: daysAgo(28),
    tags: ["Open Science"],
    createdAt: daysAgo(60),
    updatedAt: daysAgo(28),
    completedAt: daysAgo(28),
  },
  {
    id: "task_17",
    title: "Update lab website with project abstracts",
    status: "todo",
    priority: "low",
    projectId: null,
    assignee: people.lena,
    dueDate: daysFromNow(16),
    tags: ["Outreach"],
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
    completedAt: null,
  },
  {
    id: "task_18",
    title: "Schedule Q4 lab review",
    status: "in-progress",
    priority: "medium",
    projectId: null,
    assignee: people.maya,
    dueDate: daysFromNow(4),
    tags: ["Operations"],
    createdAt: daysAgo(7),
    updatedAt: hoursAgo(20),
    completedAt: null,
  },
  {
    id: "task_19",
    title: "Clean up shared figure library",
    status: "completed",
    priority: "low",
    projectId: null,
    assignee: people.tomas,
    dueDate: daysAgo(1),
    tags: ["Operations"],
    createdAt: daysAgo(8),
    updatedAt: daysAgo(1),
    completedAt: daysAgo(1),
  },
  {
    id: "task_20",
    title: "Draft pre-registration for cohort C",
    status: "todo",
    priority: "urgent",
    projectId: "proj_cortical",
    assignee: people.maya,
    dueDate: daysFromNow(3),
    tags: ["Writing", "Compliance"],
    createdAt: hoursAgo(30),
    updatedAt: hoursAgo(30),
    completedAt: null,
  },
  {
    id: "task_21",
    title: "Document ICA rejection thresholds",
    status: "in-progress",
    priority: "medium",
    projectId: "proj_cortical",
    assignee: people.arjun,
    dueDate: daysFromNow(2),
    tags: ["Analysis", "Documentation"],
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(6),
    completedAt: null,
    parentTaskId: "task_1",
    milestoneId: "ms_1",
  },
  {
    id: "task_22",
    title: "Record XRD immediately after calcination",
    status: "todo",
    priority: "medium",
    projectId: "proj_catalysts",
    assignee: people.samuel,
    dueDate: daysFromNow(3),
    tags: ["Synthesis", "Lab"],
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
    completedAt: null,
    parentTaskId: "task_6",
    milestoneId: "ms_4",
  },
  {
    id: "task_23",
    title: "Export calibration residuals for review",
    status: "todo",
    priority: "high",
    projectId: "proj_heat",
    assignee: people.arjun,
    dueDate: daysFromNow(1),
    tags: ["Validation", "Data"],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    completedAt: null,
    parentTaskId: "task_9",
    milestoneId: "ms_6",
  },
];

/**
 * Milestone placement for the seeded tasks. Kept separate so the original
 * task records stay readable while the Phase 2 project tree remains realistic.
 */
const taskMilestoneSeed: Record<string, string> = {
  task_1: "ms_1",
  task_2: "ms_2",
  task_3: "ms_3",
  task_4: "ms_1",
  task_5: "ms_2",
  task_20: "ms_3",
  task_6: "ms_4",
  task_7: "ms_4",
  task_8: "ms_5",
  task_9: "ms_6",
  task_10: "ms_7",
  task_11: "ms_6",
  task_12: "ms_8",
  task_13: "ms_8",
  task_14: "ms_9",
  task_15: "ms_9",
  task_16: "ms_10",
};

const milestones: Milestone[] = [
  {
    id: "ms_1",
    projectId: "proj_cortical",
    title: "Full cohort data collection",
    description: "All 60 participants complete the three-load EEG protocol with usable recordings.",
    dueDate: daysFromNow(6),
    status: "in-progress",
    progress: 87,
  },
  {
    id: "ms_2",
    projectId: "proj_cortical",
    title: "Primary analysis complete",
    description: "Subject-level coupling metrics and group-level statistics frozen for the manuscript.",
    dueDate: daysFromNow(28),
    status: "upcoming",
    progress: 15,
  },
  {
    id: "ms_3",
    projectId: "proj_cortical",
    title: "Manuscript submission",
    description: "Submit the primary results paper to a peer-reviewed journal.",
    dueDate: daysFromNow(54),
    status: "upcoming",
    progress: 0,
  },
  {
    id: "ms_4",
    projectId: "proj_catalysts",
    title: "Synthesis batch complete",
    description: "Twelve candidate heterostructures synthesized and structurally characterized.",
    dueDate: daysFromNow(11),
    status: "in-progress",
    progress: 58,
  },
  {
    id: "ms_5",
    projectId: "proj_catalysts",
    title: "Photostability validation",
    description: "Complete 100-hour stability measurements for the top three candidates.",
    dueDate: daysFromNow(42),
    status: "at-risk",
    progress: 20,
  },
  {
    id: "ms_6",
    projectId: "proj_heat",
    title: "Sensor calibration report",
    description: "Validated calibration between 40 ground sensors and satellite estimates.",
    dueDate: daysFromNow(3),
    status: "at-risk",
    progress: 72,
  },
  {
    id: "ms_7",
    projectId: "proj_heat",
    title: "City stakeholder workshop",
    description: "Present ward-level priority maps to the municipal climate cell.",
    dueDate: daysFromNow(19),
    status: "upcoming",
    progress: 10,
  },
  {
    id: "ms_8",
    projectId: "proj_gut",
    title: "Data use agreements signed",
    description: "All six cohorts cleared for harmonized secondary analysis.",
    dueDate: daysFromNow(24),
    status: "upcoming",
    progress: 0,
  },
  {
    id: "ms_9",
    projectId: "proj_amr",
    title: "Isolate sequencing complete",
    description: "500 resistant isolates sequenced and quality-controlled.",
    dueDate: daysFromNow(35),
    status: "in-progress",
    progress: 48,
  },
  {
    id: "ms_10",
    projectId: "proj_quantum",
    title: "Public benchmark release",
    description: "Harness, decoders, and result artifacts released under an open license.",
    dueDate: daysAgo(28),
    status: "completed",
    progress: 100,
  },
];

const entryMaya = { ...people.maya };
const entryArjun = { ...people.arjun };
const entryLena = { ...people.lena };
const entryPriya = { ...people.priya };

const notebooks: Notebook[] = [
  {
    id: "nb_cortical_analysis",
    title: "Theta–gamma coupling analysis log",
    description:
      "Working analysis log for cohort B: preprocessing decisions, quality checks, and emerging effects.",
    projectId: "proj_cortical",
    tags: ["Analysis", "EEG", "Cohort B"],
    favorite: true,
    createdAt: daysAgo(34),
    updatedAt: hoursAgo(3),
    author: entryMaya,
    entries: [
      {
        id: "entry_1",
        title: "Cohort B quality control — week 6",
        updatedAt: hoursAgo(3),
        createdAt: daysAgo(9),
        author: entryMaya,
        content: `<h2>Quality control summary</h2>
<p>We reviewed all 42 cohort B recordings collected so far. Three sessions were excluded due to persistent electrode bridging in the parietal montage, and one was flagged for excessive muscle artifact above 45 Hz.</p>
<ul>
<li><strong>Included:</strong> 38 participants (19 female, 19 male; mean age 26.4)</li>
<li><strong>Excluded:</strong> 4 participants (3 bridging, 1 muscle artifact)</li>
<li><strong>Usable epochs:</strong> 91.4% after rejection</li>
</ul>
<h3>Decision: ICA component threshold</h3>
<p>We compared 20- and 30-component decompositions. The 30-component solution removed eye-blink artifacts more cleanly without attenuating frontal theta power. Locking this in for the full analysis.</p>
<blockquote>Note for the methods section: report the ICA rejection criteria and the proportion of variance removed per subject, not just the component count.</blockquote>
<table><tbody>
<tr><th>Subject group</th><th>n</th><th>Mean usable epochs</th><th>Flagged</th></tr>
<tr><td>Cohort A</td><td>20</td><td>184</td><td>1</td></tr>
<tr><td>Cohort B</td><td>38</td><td>177</td><td>4</td></tr>
<tr><td>Cohort C</td><td>8</td><td>181</td><td>0</td></tr>
</tbody></table>
<h3>Next steps</h3>
<ul data-type="taskList">
<li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Re-run ICA with locked parameters</p></div></li>
<li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Export subject-level PSD summaries</p></div></li>
<li data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Compare coupling estimates against behavioral capacity</p></div></li>
</ul>`,
      },
      {
        id: "entry_2",
        title: "Preprocessing pipeline specification",
        updatedAt: daysAgo(9),
        createdAt: daysAgo(21),
        author: entryArjun,
        content: `<h2>Pipeline specification v1.3</h2>
<p>This entry documents the frozen preprocessing pipeline used for all cohorts. Any change requires a version bump and a re-run of the cohort A benchmark.</p>
<h3>Parameters</h3>
<ol>
<li>Band-pass filter: 0.5–45 Hz, zero-phase FIR (order 1650)</li>
<li>Line noise: 50 Hz notch + harmonic</li>
<li>Re-reference: average of 64 scalp electrodes</li>
<li>ICA: extended Infomax, 30 components</li>
<li>Epoching: −1.0 to 2.0 s around stimulus onset</li>
<li>Baseline: −200 to 0 ms</li>
</ol>
<h3>Reference implementation</h3>
<pre><code>def preprocess(raw, cfg):
    raw.filter(cfg.l_freq, cfg.h_freq, fir_design="firwin")
    raw.notch_filter(cfg.line_freq, picks="eeg")
    raw.set_eeg_reference("average", projection=False)
    ica = ICA(n_components=30, method="infomax", random_state=42)
    ica.fit(raw)
    return ica.apply(raw)</code></pre>
<p>Runtime on the lab workstation is approximately 4.5 minutes per participant. The pipeline is deterministic given the fixed random state.</p>`,
      },
    ],
  },
  {
    id: "nb_catalysts_synthesis",
    title: "Synthesis log — oxide heterostructures",
    description:
      "Bench notes for the twelve candidate photocatalysts, including calcination conditions and XRD observations.",
    projectId: "proj_catalysts",
    tags: ["Lab", "Synthesis", "Materials"],
    favorite: true,
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(9),
    author: entryLena,
    entries: [
      {
        id: "entry_3",
        title: "Batch 4 — Ni-doped TiO₂",
        updatedAt: hoursAgo(9),
        createdAt: daysAgo(4),
        author: entryLena,
        content: `<h2>Batch 4 synthesis</h2>
<p>Prepared three doping concentrations (1, 3, and 5 mol%) via sol–gel. All precursors were from the same lot to control for trace metal contamination.</p>
<h3>Conditions</h3>
<ul>
<li>Calcination: 450 °C for 4 h in air, ramp 2 °C/min</li>
<li>Cooling: furnace to 120 °C, then desiccator</li>
<li>Post-treatment: none (this batch is for baseline comparison)</li>
</ul>
<h3>Observations</h3>
<p>The 5 mol% sample developed a faint grey tint after calcination, suggesting partial reduction. We will re-run with a slower ramp and compare XRD linewidths.</p>
<table><tbody>
<tr><th>Sample</th><th>Dopant</th><th>Yield</th><th>Appearance</th></tr>
<tr><td>B4-1</td><td>1 mol%</td><td>82%</td><td>White</td></tr>
<tr><td>B4-2</td><td>3 mol%</td><td>79%</td><td>Off-white</td></tr>
<tr><td>B4-3</td><td>5 mol%</td><td>74%</td><td>Light grey</td></tr>
</tbody></table>
<p><strong>Action:</strong> Do not proceed to photocatalytic testing on B4-3 until XRD confirms phase purity.</p>`,
      },
    ],
  },
  {
    id: "nb_heat_protocol",
    title: "Heat mapping protocol & calibration notes",
    description:
      "Field protocol for ground sensors, satellite processing steps, and the calibration experiment design.",
    projectId: "proj_heat",
    tags: ["Protocol", "Remote Sensing"],
    favorite: false,
    createdAt: daysAgo(120),
    updatedAt: daysAgo(1),
    author: entryArjun,
    entries: [
      {
        id: "entry_4",
        title: "Ground sensor deployment protocol",
        updatedAt: daysAgo(1),
        createdAt: daysAgo(42),
        author: entryArjun,
        content: `<h2>Field deployment protocol</h2>
<p>Forty sensors were deployed across 20 wards, stratified by building density and canopy cover. Each site has two sensors at 1.5 m and 3.0 m to capture near-surface gradients.</p>
<h3>Daily checks</h3>
<ul>
<li>Confirm logger timestamp drift is under 60 seconds.</li>
<li>Inspect radiation shield for debris and standing water.</li>
<li>Download readings every 72 hours; upload to the shared drive the same day.</li>
</ul>
<h3>Calibration window</h3>
<p>We will use cloud-free Landsat passes within ±45 minutes of local noon. Preliminary comparison suggests a mean bias of 1.8 K, which is within the expected range for uncalibrated emissivity assumptions.</p>`,
      },
      {
        id: "entry_5",
        title: "Ward prioritization logic",
        updatedAt: daysAgo(15),
        createdAt: daysAgo(15),
        author: entryPriya,
        content: `<h2>Draft prioritization logic</h2>
<p>Priority score combines heat exposure, population vulnerability, and canopy deficit. All components are z-scored within the city boundary.</p>
<pre><code>priority = 0.45 * exposure_z
         + 0.35 * vulnerability_z
         + 0.20 * canopy_deficit_z</code></pre>
<p>Weights are provisional and will be reviewed with the municipal climate cell before the workshop. Sensitivity analysis will test equal weighting and exposure-dominant weighting.</p>`,
      },
    ],
  },
  {
    id: "nb_reading_group",
    title: "Reading group — predictive coding",
    description:
      "Weekly notes from the lab reading group on predictive processing, precision, and neural oscillations.",
    projectId: null,
    tags: ["Literature", "Theory"],
    favorite: true,
    createdAt: daysAgo(80),
    updatedAt: daysAgo(5),
    author: entryMaya,
    entries: [
      {
        id: "entry_6",
        title: "Session 8 — precision and oscillatory gain",
        updatedAt: daysAgo(5),
        createdAt: daysAgo(5),
        author: entryMaya,
        content: `<h2>Session 8 notes</h2>
<p>Discussion centered on whether alpha-band activity reflects precision-weighted prediction error rather than simple inhibition. The evidence remains correlational, but the framework makes a useful distinction between gain modulation and signal suppression.</p>
<h3>Open questions</h3>
<ul>
<li>Can we dissociate precision from attention using our current task?</li>
<li>Would a parametric manipulation of cue reliability give us a cleaner test?</li>
<li>Is there a principled way to compare model predictions across individuals?</li>
</ul>
<p>Assigned reading for next week: the 2025 review on hierarchical message passing, plus the two empirical papers on cue reliability.</p>`,
      },
    ],
  },
  {
    id: "nb_gut_inventory",
    title: "Gut atlas — data inventory",
    description:
      "Cohort-level inventory of available single-cell datasets, access status, and harmonization risks.",
    projectId: "proj_gut",
    tags: ["Data", "Genomics", "Planning"],
    favorite: false,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(2),
    author: entryPriya,
    entries: [
      {
        id: "entry_7",
        title: "Cohort inventory and access status",
        updatedAt: daysAgo(2),
        createdAt: daysAgo(12),
        author: entryPriya,
        content: `<h2>Cohort inventory</h2>
<p>Six candidate cohorts identified. Two have open access processed matrices, three require data use agreements, and one has raw reads only.</p>
<table><tbody>
<tr><th>Cohort</th><th>Donors</th><th>Assay</th><th>Access</th></tr>
<tr><td>C1</td><td>24</td><td>10x 3'</td><td>Open</td></tr>
<tr><td>C2</td><td>18</td><td>10x 3'</td><td>Open</td></tr>
<tr><td>C3</td><td>31</td><td>10x 5'</td><td>DUA pending</td></tr>
<tr><td>C4</td><td>12</td><td>Smart-seq2</td><td>DUA pending</td></tr>
<tr><td>C5</td><td>40</td><td>10x 3'</td><td>DUA pending</td></tr>
<tr><td>C6</td><td>16</td><td>10x 3'</td><td>Raw only</td></tr>
</tbody></table>
<h3>Harmonization risks</h3>
<ul>
<li>Different reference genomes (GRCh38 vs. T2T) across cohorts.</li>
<li>Batch effects likely confounded with donor age in C4.</li>
<li>Cell-type annotations use inconsistent ontologies.</li>
</ul>`,
      },
    ],
  },
  {
    id: "nb_operations",
    title: "Lab operations handbook",
    description:
      "Shared protocols for equipment booking, onboarding, data retention, and meeting cadence.",
    projectId: null,
    tags: ["Operations", "Handbook"],
    favorite: false,
    createdAt: daysAgo(200),
    updatedAt: daysAgo(11),
    author: entryMaya,
    entries: [
      {
        id: "entry_8",
        title: "Meeting cadence and decision records",
        updatedAt: daysAgo(11),
        createdAt: daysAgo(90),
        author: entryMaya,
        content: `<h2>Meeting cadence</h2>
<ul>
<li><strong>Monday 9:30:</strong> Lab stand-up (15 min, blockers only)</li>
<li><strong>Wednesday 14:00:</strong> Analysis clinic (bring a notebook)</li>
<li><strong>Friday 15:00:</strong> Reading group (rotating chair)</li>
</ul>
<h3>Decision records</h3>
<p>Every project-level decision that changes scope, methods, or authorship should be recorded in the project notebook within 48 hours. Include the date, attendees, options considered, and rationale.</p>
<blockquote>A decision that is not written down is a decision the lab will relitigate.</blockquote>`,
      },
    ],
  },
];

const papers: Paper[] = [
  {
    id: "paper_1",
    title: "Theta–gamma coupling predicts working-memory capacity across the adult lifespan",
    authors: ["S. Nakamura", "L. Moreau", "M. Chen"],
    year: 2025,
    journal: "Nature Neuroscience",
    doi: "10.1038/s41593-025-01482-7",
    abstract:
      "Cross-frequency coupling between frontal theta and parietal gamma has been proposed as a mechanism for maintaining information in working memory. Across three independent cohorts (N = 312), we show that coupling strength predicts individual capacity, is stable within participants, and partially mediates age-related decline. Effects were specific to memory load and absent during passive viewing.",
    tags: ["EEG", "Working Memory", "Aging"],
    projectId: "proj_cortical",
    readStatus: "read",
    favorite: true,
    citations: 48,
    addedAt: daysAgo(58),
    notes: "Key comparison for our coupling metric. Their normalization approach differs from ours; worth a supplementary analysis.",
  },
  {
    id: "paper_2",
    title: "Precision-weighted prediction errors shape alpha-band dynamics in human cortex",
    authors: ["A. Kowalski", "R. Devi", "J. Thompson"],
    year: 2024,
    journal: "Neuron",
    doi: "10.1016/j.neuron.2024.08.011",
    abstract:
      "We manipulated cue reliability parametrically while recording MEG to test whether alpha power tracks precision-weighted prediction error. Alpha suppression scaled with reliability, while alpha peak frequency tracked the expected precision of the forthcoming stimulus. The results support a gain-control account of alpha.",
    tags: ["Oscillations", "Predictive Coding", "MEG"],
    projectId: "proj_cortical",
    readStatus: "reading",
    favorite: true,
    citations: 112,
    addedAt: daysAgo(33),
  },
  {
    id: "paper_3",
    title: "A reproducible pipeline for multi-site high-density EEG harmonization",
    authors: ["T. Alvarez", "M. Chen", "P. Nair", "K. Sørensen"],
    year: 2025,
    journal: "Journal of Neuroscience Methods",
    doi: "10.1016/j.jneumeth.2025.110231",
    abstract:
      "Multi-site EEG studies require pipelines that remain stable across hardware and recording environments. We present an open-source pipeline with locked preprocessing parameters, automated quality metrics, and a validation suite. Across four sites, subject-level spectral estimates showed ICCs above 0.82 after harmonization.",
    tags: ["Methods", "Reproducibility", "EEG"],
    projectId: "proj_cortical",
    readStatus: "read",
    favorite: false,
    citations: 27,
    addedAt: daysAgo(74),
  },
  {
    id: "paper_4",
    title: "Earth-abundant metal oxides for visible-light water splitting: a critical assessment",
    authors: ["H. Watanabe", "C. Osei", "F. Rossi"],
    year: 2024,
    journal: "Chemical Reviews",
    doi: "10.1021/acs.chemrev.4c00217",
    abstract:
      "We review recent progress in earth-abundant metal-oxide photocatalysts for water splitting, with attention to apparent versus intrinsic activity, photostability, and the role of surface reconstruction. Standardized reporting recommendations are proposed for hydrogen evolution measurements.",
    tags: ["Photocatalysis", "Materials", "Review"],
    projectId: "proj_catalysts",
    readStatus: "reading",
    favorite: false,
    citations: 340,
    addedAt: daysAgo(40),
  },
  {
    id: "paper_5",
    title: "Surface reconstruction governs long-term photostability of doped titania",
    authors: ["N. Ibrahim", "S. Park", "L. Fischer"],
    year: 2025,
    journal: "ACS Catalysis",
    doi: "10.1021/acscatal.5c01844",
    abstract:
      "Using operando X-ray scattering, we track surface reconstruction in doped titania during prolonged illumination. Reversible reconstruction initially improves activity, but irreversible oxygen loss after 60 hours leads to activity decay. Dopant choice modulates the onset of degradation.",
    tags: ["Titania", "Stability", "Operando"],
    projectId: "proj_catalysts",
    readStatus: "unread",
    favorite: true,
    citations: 19,
    addedAt: daysAgo(12),
  },
  {
    id: "paper_6",
    title: "Urban heat exposure and cardiovascular outcomes: a systematic review",
    authors: ["E. Gómez", "R. Singh", "A. Patel"],
    year: 2023,
    journal: "Environmental Health Perspectives",
    doi: "10.1289/EHP12044",
    abstract:
      "We synthesized 84 studies on intra-urban heat exposure and cardiovascular outcomes. Evidence consistently links heat exposure to acute events, with the strongest associations in neighborhoods with low canopy cover and limited cooling access. Measurement heterogeneity remains a major limitation.",
    tags: ["Heat", "Health", "Review"],
    projectId: "proj_heat",
    readStatus: "read",
    favorite: false,
    citations: 205,
    addedAt: daysAgo(95),
  },
  {
    id: "paper_7",
    title: "Calibrating satellite land surface temperature with low-cost ground sensors",
    authors: ["J. Mensah", "K. Ito"],
    year: 2025,
    journal: "Remote Sensing of Environment",
    doi: "10.1016/j.rse.2025.114302",
    abstract:
      "Low-cost temperature sensors can complement satellite land surface temperature products, but calibration biases vary with siting and shield design. We quantify bias across 120 sites and propose a correction model that reduces RMSE by 38% relative to raw comparisons.",
    tags: ["Landsat", "Calibration", "Sensors"],
    projectId: "proj_heat",
    readStatus: "reading",
    favorite: true,
    citations: 14,
    addedAt: daysAgo(22),
  },
  {
    id: "paper_8",
    title: "A single-cell atlas of the human intestinal epithelium across the lifespan",
    authors: ["Y. Zhao", "M. Béranger", "P. Nair"],
    year: 2025,
    journal: "Cell",
    doi: "10.1016/j.cell.2025.02.014",
    abstract:
      "We profiled 1.2 million epithelial cells from 186 donors aged 2 to 92, identifying age-associated shifts in enterocyte maturation, stem-cell niche composition, and rare tuft-cell states. An interactive atlas is available for the research community.",
    tags: ["Single-cell", "Gut", "Atlas"],
    projectId: "proj_gut",
    readStatus: "unread",
    favorite: true,
    citations: 88,
    addedAt: daysAgo(8),
  },
  {
    id: "paper_9",
    title: "Harmonization strategies for cross-cohort single-cell transcriptomics",
    authors: ["D. Kim", "R. Adeyemi", "S. Voss"],
    year: 2024,
    journal: "Genome Biology",
    doi: "10.1186/s13059-024-03188-2",
    abstract:
      "Benchmarking twelve integration methods across six real cross-cohort datasets, we find that no single method dominates. We provide decision guidance based on donor overlap, sequencing depth, and the downstream task, and highlight failure modes in rare-cell-type recovery.",
    tags: ["Benchmark", "Integration", "scRNA-seq"],
    projectId: "proj_gut",
    readStatus: "reading",
    favorite: false,
    citations: 61,
    addedAt: daysAgo(5),
  },
  {
    id: "paper_10",
    title: "Genomic surveillance of antimicrobial resistance in South Asian tertiary care",
    authors: ["S. Okafor", "M. Chen", "V. Krishnan"],
    year: 2024,
    journal: "The Lancet Microbe",
    doi: "10.1016/S2666-5247(24)00128-9",
    abstract:
      "We sequenced 1,840 resistant isolates from 14 tertiary-care hospitals over three years. Carbapenemase prevalence increased significantly in two districts, with evidence of clonal expansion rather than repeated de novo acquisition. Findings support regional genomic surveillance.",
    tags: ["AMR", "Genomics", "Surveillance"],
    projectId: "proj_amr",
    readStatus: "read",
    favorite: false,
    citations: 73,
    addedAt: daysAgo(140),
  },
  {
    id: "paper_11",
    title: "Surface-code decoders under realistic noise: a standardized benchmark",
    authors: ["A. Rao", "L. Fischer", "J. Whitfield"],
    year: 2025,
    journal: "Quantum",
    doi: "10.22331/q-2025-06-12-1188",
    abstract:
      "Decoder performance claims are difficult to compare across studies. We introduce a benchmark harness with standardized noise models and open artifacts, and evaluate three decoder families under circuit-level noise. Runtime and logical error rate trade-offs differ substantially from idealized comparisons.",
    tags: ["Quantum", "Benchmarks", "Open Science"],
    projectId: "proj_quantum",
    readStatus: "read",
    favorite: true,
    citations: 31,
    addedAt: daysAgo(52),
  },
  {
    id: "paper_12",
    title: "Open science practices and citation impact in computational biology",
    authors: ["R. Lindqvist", "H. Almeida"],
    year: 2023,
    journal: "PLOS Biology",
    doi: "10.1371/journal.pbio.3002098",
    abstract:
      "Analyzing 12,000 computational biology papers, we find that open data and code availability associate with higher citation counts, after adjusting for journal, field, and team size. The association is strongest for papers releasing reusable pipelines.",
    tags: ["Open Science", "Meta-research"],
    projectId: null,
    readStatus: "unread",
    favorite: false,
    citations: 154,
    addedAt: daysAgo(17),
  },
];

const folders: Folder[] = [
  {
    id: "folder_datasets",
    name: "Datasets",
    parentId: null,
    createdAt: daysAgo(180),
    projectId: null,
  },
  {
    id: "folder_eeg_raw",
    name: "EEG Raw",
    parentId: "folder_datasets",
    createdAt: daysAgo(150),
    projectId: "proj_cortical",
  },
  {
    id: "folder_manuscripts",
    name: "Manuscripts",
    parentId: null,
    createdAt: daysAgo(180),
    projectId: null,
  },
  {
    id: "folder_protocols",
    name: "Protocols",
    parentId: null,
    createdAt: daysAgo(170),
    projectId: null,
  },
  {
    id: "folder_figures",
    name: "Figures",
    parentId: null,
    createdAt: daysAgo(120),
    projectId: null,
  },
];

const files: ResearchFile[] = [
  {
    id: "file_1",
    name: "cortical-cohortA-preprocessed.zip",
    kind: "dataset",
    size: 3_420_000_000,
    folderId: "folder_eeg_raw",
    projectId: "proj_cortical",
    uploadedAt: daysAgo(4),
    uploadedBy: people.arjun,
    starred: true,
    description: "Preprocessed EEG epochs for cohort A, 20 participants.",
  },
  {
    id: "file_2",
    name: "cortical-B-quality-metrics.csv",
    kind: "spreadsheet",
    size: 2_840_000,
    folderId: "folder_datasets",
    projectId: "proj_cortical",
    uploadedAt: hoursAgo(8),
    uploadedBy: people.priya,
    starred: false,
    description: "Subject-level quality metrics for cohort B.",
  },
  {
    id: "file_3",
    name: "working-memory-manuscript-v3.docx",
    kind: "document",
    size: 4_112_000,
    folderId: "folder_manuscripts",
    projectId: "proj_cortical",
    uploadedAt: daysAgo(2),
    uploadedBy: people.maya,
    starred: true,
    description: "Primary results manuscript, third internal revision.",
  },
  {
    id: "file_4",
    name: "theta-gamma-coupling-figure.svg",
    kind: "image",
    size: 1_240_000,
    folderId: "folder_figures",
    projectId: "proj_cortical",
    uploadedAt: daysAgo(3),
    uploadedBy: people.priya,
    starred: false,
  },
  {
    id: "file_5",
    name: "photostability-100h-raw.xlsx",
    kind: "spreadsheet",
    size: 8_920_000,
    folderId: "folder_datasets",
    projectId: "proj_catalysts",
    uploadedAt: daysAgo(6),
    uploadedBy: people.samuel,
    starred: false,
    description: "Hydrogen evolution measurements over 100-hour runs.",
  },
  {
    id: "file_6",
    name: "synthesis-protocol-v2.pdf",
    kind: "pdf",
    size: 1_780_000,
    folderId: "folder_protocols",
    projectId: "proj_catalysts",
    uploadedAt: daysAgo(20),
    uploadedBy: people.lena,
    starred: true,
  },
  {
    id: "file_7",
    name: "bengaluru-wards-heat-priority.geojson",
    kind: "dataset",
    size: 24_600_000,
    folderId: "folder_datasets",
    projectId: "proj_heat",
    uploadedAt: daysAgo(1),
    uploadedBy: people.arjun,
    starred: true,
    description: "Ward polygons with composite heat priority scores.",
  },
  {
    id: "file_8",
    name: "sensor-calibration-model.py",
    kind: "code",
    size: 48_000,
    folderId: "folder_datasets",
    projectId: "proj_heat",
    uploadedAt: daysAgo(7),
    uploadedBy: people.arjun,
    starred: false,
  },
  {
    id: "file_9",
    name: "ward-priority-map.png",
    kind: "image",
    size: 6_300_000,
    folderId: "folder_figures",
    projectId: "proj_heat",
    uploadedAt: daysAgo(2),
    uploadedBy: people.priya,
    starred: false,
  },
  {
    id: "file_10",
    name: "gut-atlas-cohort-inventory.xlsx",
    kind: "spreadsheet",
    size: 640_000,
    folderId: "folder_datasets",
    projectId: "proj_gut",
    uploadedAt: daysAgo(10),
    uploadedBy: people.priya,
    starred: false,
  },
  {
    id: "file_11",
    name: "amr-sequencing-reads-archive.tar.gz",
    kind: "archive",
    size: 12_800_000_000,
    folderId: "folder_datasets",
    projectId: "proj_amr",
    uploadedAt: daysAgo(30),
    uploadedBy: people.samuel,
    starred: false,
    description: "Compressed raw reads awaiting repository deposit.",
  },
  {
    id: "file_12",
    name: "lab-data-retention-policy.pdf",
    kind: "pdf",
    size: 380_000,
    folderId: "folder_protocols",
    projectId: null,
    uploadedAt: daysAgo(60),
    uploadedBy: people.maya,
    starred: false,
  },
];

const activity: ActivityEvent[] = [
  {
    id: "act_1",
    category: "notebook",
    action: "updated the analysis log",
    target: "Theta–gamma coupling analysis log",
    detail: "Added week 6 quality-control summary and locked ICA parameters.",
    actor: people.maya,
    projectId: "proj_cortical",
    createdAt: minutesAgo(35),
  },
  {
    id: "act_2",
    category: "task",
    action: "moved a task to In progress",
    target: "Cross-validate ground sensor calibration",
    actor: people.arjun,
    projectId: "proj_heat",
    createdAt: hoursAgo(2),
  },
  {
    id: "act_3",
    category: "file",
    action: "uploaded a dataset",
    target: "cortical-B-quality-metrics.csv",
    detail: "2.7 MB · Datasets",
    actor: people.priya,
    projectId: "proj_cortical",
    createdAt: hoursAgo(8),
  },
  {
    id: "act_4",
    category: "notebook",
    action: "added an entry",
    target: "Synthesis log — oxide heterostructures",
    detail: "Batch 4 — Ni-doped TiO₂",
    actor: people.lena,
    projectId: "proj_catalysts",
    createdAt: hoursAgo(9),
  },
  {
    id: "act_5",
    category: "task",
    action: "completed a task",
    target: "Clean up shared figure library",
    actor: people.tomas,
    projectId: null,
    createdAt: daysAgo(1),
  },
  {
    id: "act_6",
    category: "milestone",
    action: "flagged a milestone at risk",
    target: "Sensor calibration report",
    detail: "Ground sensor comparison is behind schedule.",
    actor: people.arjun,
    projectId: "proj_heat",
    createdAt: daysAgo(1),
  },
  {
    id: "act_7",
    category: "paper",
    action: "started reading a paper",
    target: "Calibrating satellite land surface temperature with low-cost ground sensors",
    actor: people.priya,
    projectId: "proj_heat",
    createdAt: daysAgo(2),
  },
  {
    id: "act_8",
    category: "task",
    action: "completed a task",
    target: "Pilot analysis notebook reviewed",
    actor: people.priya,
    projectId: "proj_cortical",
    createdAt: daysAgo(3),
  },
  {
    id: "act_9",
    category: "file",
    action: "uploaded a manuscript revision",
    target: "working-memory-manuscript-v3.docx",
    actor: people.maya,
    projectId: "proj_cortical",
    createdAt: daysAgo(3),
  },
  {
    id: "act_10",
    category: "project",
    action: "updated project objectives",
    target: "Cortical Dynamics of Working Memory",
    detail: "Added the reproducibility objective ahead of the manuscript.",
    actor: people.maya,
    projectId: "proj_cortical",
    createdAt: daysAgo(4),
  },
  {
    id: "act_11",
    category: "paper",
    action: "added a paper to the library",
    target: "A single-cell atlas of the human intestinal epithelium across the lifespan",
    actor: people.priya,
    projectId: "proj_gut",
    createdAt: daysAgo(8),
  },
  {
    id: "act_12",
    category: "milestone",
    action: "completed a milestone",
    target: "Public benchmark release",
    actor: people.arjun,
    projectId: "proj_quantum",
    createdAt: daysAgo(28),
  },
  {
    id: "act_13",
    category: "task",
    action: "completed a task",
    target: "Publish decoder benchmark artifacts",
    actor: people.arjun,
    projectId: "proj_quantum",
    createdAt: daysAgo(28),
  },
  {
    id: "act_14",
    category: "project",
    action: "marked the project complete",
    target: "Quantum Error Correction Benchmarks",
    actor: people.arjun,
    projectId: "proj_quantum",
    createdAt: daysAgo(27),
  },
  {
    id: "act_15",
    category: "paper",
    action: "finished reading a paper",
    target: "Genomic surveillance of antimicrobial resistance in South Asian tertiary care",
    actor: people.maya,
    projectId: "proj_amr",
    createdAt: daysAgo(30),
  },
  {
    id: "act_16",
    category: "file",
    action: "uploaded a protocol",
    target: "lab-data-retention-policy.pdf",
    actor: people.maya,
    projectId: null,
    createdAt: daysAgo(60),
  },
];

const notifications: AppNotification[] = [
  {
    id: "note_1",
    kind: "deadline",
    title: "Calibration report is due in 3 days",
    description: "The sensor calibration milestone is currently marked at risk.",
    createdAt: hoursAgo(1),
    read: false,
    href: "/app/projects/proj_heat",
  },
  {
    id: "note_2",
    kind: "assignment",
    title: "Arjun assigned you a review",
    description: "Preprocessing pipeline specification v1.3 needs sign-off.",
    createdAt: hoursAgo(5),
    read: false,
    href: "/app/notebooks/nb_cortical_analysis",
  },
  {
    id: "note_3",
    kind: "mention",
    title: "Lena mentioned you in a synthesis note",
    description: "“Can you confirm the 5 mol% sample should be re-run?”",
    createdAt: daysAgo(1),
    read: false,
    href: "/app/notebooks/nb_catalysts_synthesis",
  },
  {
    id: "note_4",
    kind: "system",
    title: "Weekly research digest is ready",
    description: "12 tasks completed, 3 notebooks updated, 2 papers added.",
    createdAt: daysAgo(2),
    read: true,
    href: "/app/activity",
  },
];

const reviewNotifications: AppNotification[] = [
  {
    id: "note_review_1",
    kind: "review",
    title: "Review requested: preprocessing pipeline v1.3",
    description:
      "Arjun Rao requested sign-off on the frozen EEG pipeline before the cohort B rerun.",
    createdAt: hoursAgo(4),
    read: false,
    href: "/app/notebooks/nb_cortical_analysis",
  },
  {
    id: "note_review_2",
    kind: "review",
    title: "Decision review: ICA component count",
    description:
      "Lena Fischer asked for a second opinion on the 30-component ICA decision.",
    createdAt: daysAgo(2),
    read: false,
    href: "/app/notebooks/nb_cortical_analysis",
  },
  {
    id: "note_review_3",
    kind: "review",
    title: "Review completed: sensor calibration report",
    description: "Your review of the Bengaluru calibration report was submitted.",
    createdAt: daysAgo(6),
    read: true,
    href: "/app/projects/proj_heat",
  },
];

export function createSeedReviewNotifications(): AppNotification[] {
  return structuredClone(reviewNotifications);
}

function logEntry(input: {
  id: string;
  actorId: string;
  projectId: string | null;
  mode: ResearchMode;
  title: string;
  notes?: string;
  durationMinutes: number;
  artifact?: ArtifactRef | null;
  occurredAt: string;
}): ResearchLogEntry {
  return {
    workspaceId: "ws_northlight",
    id: input.id,
    actorId: input.actorId,
    projectId: input.projectId,
    mode: input.mode,
    title: input.title,
    notes: input.notes,
    durationMinutes: input.durationMinutes,
    artifact: input.artifact ?? null,
    occurredAt: input.occurredAt,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  };
}

const notebookCoupling: ArtifactRef = {
  type: "notebook",
  id: "nb_cortical_analysis",
  label: "Theta–gamma coupling analysis log",
};
const notebookSynthesis: ArtifactRef = {
  type: "notebook",
  id: "nb_catalysts_synthesis",
  label: "Synthesis log — oxide heterostructures",
};
const notebookHeat: ArtifactRef = {
  type: "notebook",
  id: "nb_heat_protocol",
  label: "Heat mapping protocol & calibration notes",
};

const researchLogSeed: ResearchLogEntry[] = [
  logEntry({
    id: "log_1",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "analysis",
    title: "Re-ran ICA with the locked 30-component solution",
    notes: "Cohort B now clean across all 38 included participants. Exported component diagnostics for the methods appendix.",
    durationMinutes: 95,
    artifact: notebookCoupling,
    occurredAt: hoursAgo(2),
  }),
  logEntry({
    id: "log_2",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "reading",
    title: "Read Nakamura et al. on theta–gamma coupling",
    notes: "Their normalization differs from ours; worth a supplementary sensitivity analysis.",
    durationMinutes: 45,
    artifact: { type: "paper", id: "paper_1", label: "Theta–gamma coupling predicts working-memory capacity" },
    occurredAt: hoursAgo(5),
  }),
  logEntry({
    id: "log_3",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "writing",
    title: "Drafted the results section outline",
    durationMinutes: 60,
    artifact: notebookCoupling,
    occurredAt: hoursAgo(8),
  }),
  logEntry({
    id: "log_4",
    actorId: people.lena.id,
    projectId: "proj_catalysts",
    mode: "experiment",
    title: "Batch 4 synthesis and XRD checks",
    notes: "5 mol% sample shows a grey tint; held photocatalytic testing until phase purity is confirmed.",
    durationMinutes: 180,
    artifact: notebookSynthesis,
    occurredAt: daysAgo(1),
  }),
  logEntry({
    id: "log_5",
    actorId: people.priya.id,
    projectId: "proj_heat",
    mode: "analysis",
    title: "Ward-level priority score QA",
    durationMinutes: 70,
    artifact: { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
    occurredAt: daysAgo(1),
  }),
  logEntry({
    id: "log_6",
    actorId: people.maya.id,
    projectId: "proj_catalysts",
    mode: "admin",
    title: "Ordered reference electrode and updated procurement log",
    durationMinutes: 25,
    occurredAt: daysAgo(1),
  }),
  logEntry({
    id: "log_7",
    actorId: people.arjun.id,
    projectId: "proj_heat",
    mode: "analysis",
    title: "Calibrated 12 ground sensors against the Landsat mosaic",
    durationMinutes: 120,
    artifact: { type: "file", id: "file_8", label: "sensor-calibration-model.py" },
    occurredAt: daysAgo(2),
  }),
  logEntry({
    id: "log_8",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "review",
    title: "Reviewed the preprocessing pipeline specification",
    notes: "Requested one clarification on the ICA variance reporting before sign-off.",
    durationMinutes: 40,
    artifact: notebookCoupling,
    occurredAt: daysAgo(2),
  }),
  logEntry({
    id: "log_9",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "writing",
    title: "Rewrote the methods paragraph on ICA rejection",
    durationMinutes: 75,
    artifact: notebookCoupling,
    occurredAt: daysAgo(3),
  }),
  logEntry({
    id: "log_10",
    actorId: people.maya.id,
    projectId: "proj_catalysts",
    mode: "reading",
    title: "Skimmed the surface reconstruction paper",
    durationMinutes: 30,
    artifact: { type: "paper", id: "paper_5", label: "Surface reconstruction governs long-term photostability" },
    occurredAt: daysAgo(3),
  }),
  logEntry({
    id: "log_11",
    actorId: people.priya.id,
    projectId: "proj_heat",
    mode: "analysis",
    title: "Draft prioritization weight sensitivity check",
    durationMinutes: 80,
    artifact: notebookHeat,
    occurredAt: daysAgo(3),
  }),
  logEntry({
    id: "log_12",
    actorId: people.arjun.id,
    projectId: "proj_heat",
    mode: "writing",
    title: "Outlined the sensor calibration report",
    durationMinutes: 45,
    occurredAt: daysAgo(4),
  }),
  logEntry({
    id: "log_13",
    actorId: people.lena.id,
    projectId: "proj_catalysts",
    mode: "experiment",
    title: "Photostability run — 24 hour checkpoint",
    notes: "Hydrogen evolution rate stable within 4% of baseline.",
    durationMinutes: 90,
    occurredAt: daysAgo(4),
  }),
  logEntry({
    id: "log_14",
    actorId: people.maya.id,
    projectId: null,
    mode: "review",
    title: "Reading group — precision and oscillatory gain",
    durationMinutes: 60,
    artifact: { type: "notebook", id: "nb_reading_group", label: "Reading group — predictive coding" },
    occurredAt: daysAgo(5),
  }),
  logEntry({
    id: "log_15",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "analysis",
    title: "Subject-level PSD export and quality control",
    durationMinutes: 110,
    artifact: { type: "file", id: "file_2", label: "cortical-B-quality-metrics.csv" },
    occurredAt: daysAgo(6),
  }),
  logEntry({
    id: "log_16",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "writing",
    title: "Pre-registration draft for cohort C",
    durationMinutes: 85,
    occurredAt: daysAgo(7),
  }),
  logEntry({
    id: "log_17",
    actorId: people.maya.id,
    projectId: "proj_gut",
    mode: "admin",
    title: "Data management plan review",
    durationMinutes: 35,
    occurredAt: daysAgo(8),
  }),
  logEntry({
    id: "log_18",
    actorId: people.maya.id,
    projectId: "proj_gut",
    mode: "reading",
    title: "Read the cross-cohort harmonization benchmark",
    durationMinutes: 50,
    artifact: { type: "paper", id: "paper_9", label: "Harmonization strategies for cross-cohort single-cell transcriptomics" },
    occurredAt: daysAgo(9),
  }),
  logEntry({
    id: "log_19",
    actorId: people.samuel.id,
    projectId: "proj_amr",
    mode: "experiment",
    title: "Archive checksum verification for sequencing reads",
    durationMinutes: 65,
    artifact: { type: "file", id: "file_11", label: "amr-sequencing-reads-archive.tar.gz" },
    occurredAt: daysAgo(11),
  }),
  logEntry({
    id: "log_20",
    actorId: people.tomas.id,
    projectId: "proj_cortical",
    mode: "reading",
    title: "Re-read the participant recruitment protocol",
    durationMinutes: 25,
    occurredAt: daysAgo(12),
  }),
  logEntry({
    id: "log_21",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "writing",
    title: "Restructured the manuscript discussion",
    durationMinutes: 55,
    artifact: { type: "file", id: "file_3", label: "working-memory-manuscript-v3.docx" },
    occurredAt: daysAgo(14),
  }),
  logEntry({
    id: "log_22",
    actorId: people.maya.id,
    projectId: "proj_amr",
    mode: "review",
    title: "Reviewed the quarterly resistance report",
    durationMinutes: 40,
    occurredAt: daysAgo(16),
  }),
  logEntry({
    id: "log_23",
    actorId: people.maya.id,
    projectId: "proj_heat",
    mode: "reading",
    title: "Read the urban heat exposure systematic review",
    durationMinutes: 65,
    artifact: { type: "paper", id: "paper_6", label: "Urban heat exposure and cardiovascular outcomes" },
    occurredAt: daysAgo(19),
  }),
  logEntry({
    id: "log_24",
    actorId: people.maya.id,
    projectId: null,
    mode: "admin",
    title: "Lab meeting notes and action items",
    durationMinutes: 30,
    artifact: { type: "notebook", id: "nb_operations", label: "Lab operations handbook" },
    occurredAt: daysAgo(23),
  }),
  logEntry({
    id: "log_25",
    actorId: people.arjun.id,
    projectId: "proj_quantum",
    mode: "experiment",
    title: "Surface-code decoder benchmark run",
    durationMinutes: 140,
    occurredAt: daysAgo(27),
  }),
  logEntry({
    id: "log_26",
    actorId: people.maya.id,
    projectId: "proj_cortical",
    mode: "analysis",
    title: "Cohort A preprocessing benchmark",
    durationMinutes: 100,
    artifact: { type: "file", id: "file_1", label: "cortical-cohortA-preprocessed.zip" },
    occurredAt: daysAgo(41),
  }),
];

export function createSeedResearchLog(): ResearchLogEntry[] {
  return structuredClone(researchLogSeed);
}

const graphNodes: GraphNode[] = [
  // Cortical Dynamics — hypothesis → experiment → run DAG
  {
    id: "hyp_cortical_theta",
    type: "hypothesis",
    label: "Theta–gamma coupling predicts working-memory capacity",
    status: "supported",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_cortical",
      owner: "Dr. Maya Chen",
      description:
        "Frontal theta coupling with parietal gamma should scale with working-memory load and predict individual capacity.",
      date: daysAgo(58),
    },
  },
  {
    id: "hyp_cortical_alpha",
    type: "hypothesis",
    label: "Precision-weighted prediction errors sharpen alpha gain",
    status: "testing",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_cortical",
      owner: "Dr. Priya Nair",
      description:
        "Cue reliability should modulate alpha suppression in proportion to the expected precision of the forthcoming stimulus.",
      date: daysAgo(33),
    },
  },
  {
    id: "hyp_cortical_pipeline",
    type: "hypothesis",
    label: "Locked preprocessing generalizes across recording sites",
    status: "supported",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      description:
        "A frozen preprocessing pipeline should preserve subject-level spectral estimates across four acquisition sites.",
      date: daysAgo(74),
    },
  },
  {
    id: "hyp_cortical_conclusion",
    type: "hypothesis",
    label: "Coupling indexes load-dependent maintenance, not arousal",
    status: "supported",
    metadata: {
      kind: "conclusion",
      projectId: "proj_cortical",
      owner: "Dr. Maya Chen",
      description:
        "Runs from cohorts A and B converge on a load-specific coupling effect that is absent during passive viewing.",
      date: daysAgo(6),
    },
  },
  {
    id: "exp_cortical_cohort_a",
    type: "experiment",
    label: "Cohort A — high-density EEG",
    status: "completed",
    metadata: {
      projectId: "proj_cortical",
      owner: "Dr. Maya Chen",
      description: "20 participants, three working-memory load conditions.",
      date: daysAgo(64),
      action: "open-experiment",
      metrics: [
        { label: "Participants", value: "20" },
        { label: "Usable epochs", value: "94%" },
      ],
    },
  },
  {
    id: "exp_cortical_cohort_b",
    type: "experiment",
    label: "Cohort B — replication",
    status: "running",
    metadata: {
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      description: "38 included participants with the locked preprocessing pipeline.",
      date: hoursAgo(5),
      action: "open-experiment",
      metrics: [
        { label: "Participants", value: "38" },
        { label: "Completed", value: "31" },
      ],
    },
  },
  {
    id: "exp_cortical_alpha",
    type: "experiment",
    label: "Alpha precision MEG",
    status: "planned",
    metadata: {
      projectId: "proj_cortical",
      owner: "Dr. Priya Nair",
      description: "Parametric cue-reliability manipulation with MEG.",
      action: "open-experiment",
    },
  },
  {
    id: "exp_cortical_multisite",
    type: "experiment",
    label: "Four-site harmonization",
    status: "analysis",
    metadata: {
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      description: "Replication of the pipeline across four acquisition sites.",
      action: "open-experiment",
      metrics: [{ label: "Sites", value: "4" }],
    },
  },
  {
    id: "run_cortical_a_preprocess",
    type: "run",
    label: "cohort-a/preprocess-v2",
    status: "completed",
    metadata: {
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      date: daysAgo(9),
      action: "open-run-logs",
      metrics: [
        { label: "Duration", value: "42 min" },
        { label: "Rejected ICs", value: "30" },
      ],
    },
  },
  {
    id: "run_cortical_a_coupling",
    type: "run",
    label: "cohort-a/coupling-v3",
    status: "completed",
    metadata: {
      projectId: "proj_cortical",
      owner: "Dr. Priya Nair",
      date: daysAgo(8),
      action: "open-run-logs",
      metrics: [{ label: "Subjects", value: "20" }],
    },
  },
  {
    id: "run_cortical_b_preprocess",
    type: "run",
    label: "cohort-b/preprocess-v2",
    status: "running",
    metadata: {
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      date: hoursAgo(4),
      action: "open-run-logs",
      metrics: [{ label: "Subjects", value: "38" }],
    },
  },
  {
    id: "run_cortical_b_coupling",
    type: "run",
    label: "cohort-b/coupling-v3",
    status: "queued",
    metadata: {
      projectId: "proj_cortical",
      owner: "Dr. Priya Nair",
      action: "open-run-logs",
    },
  },
  {
    id: "run_cortical_alpha_1",
    type: "run",
    label: "alpha-meg/pilot-1",
    status: "planned",
    metadata: {
      projectId: "proj_cortical",
      owner: "Dr. Priya Nair",
      action: "open-run-logs",
    },
  },
  {
    id: "run_cortical_multisite_1",
    type: "run",
    label: "multisite/harmonize-v1",
    status: "completed",
    metadata: {
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      date: daysAgo(20),
      action: "open-run-logs",
      metrics: [{ label: "ICC", value: "0.84" }],
    },
  },
  {
    id: "run_cortical_multisite_2",
    type: "run",
    label: "multisite/validate-v2",
    status: "analysis",
    metadata: {
      projectId: "proj_cortical",
      owner: "Arjun Rao",
      date: daysAgo(3),
      action: "open-run-logs",
    },
  },
  // Catalysts
  {
    id: "hyp_catalysts_ni_doping",
    type: "hypothesis",
    label: "5 mol% Ni doping maximizes visible-light hydrogen evolution",
    status: "testing",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_catalysts",
      owner: "Dr. Lena Fischer",
      description:
        "Moderate Ni substitution should improve charge separation without introducing recombination centres.",
      date: daysAgo(8),
    },
  },
  {
    id: "hyp_catalysts_stability",
    type: "hypothesis",
    label: "Surface reconstruction predicts 100-hour photostability",
    status: "supported",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_catalysts",
      owner: "Samuel Okafor",
      description:
        "Reversible surface reconstruction should precede irreversible oxygen loss and activity decay.",
      date: daysAgo(12),
    },
  },
  {
    id: "exp_catalysts_batch4",
    type: "experiment",
    label: "Batch 4 — Ni-doped TiO₂",
    status: "running",
    metadata: {
      projectId: "proj_catalysts",
      owner: "Samuel Okafor",
      description: "Three doping concentrations synthesized with XRD after calcination.",
      date: hoursAgo(9),
      action: "open-experiment",
    },
  },
  {
    id: "exp_catalysts_stability",
    type: "experiment",
    label: "100-hour photostability",
    status: "planned",
    metadata: {
      projectId: "proj_catalysts",
      owner: "Dr. Lena Fischer",
      action: "open-experiment",
    },
  },
  {
    id: "run_catalysts_batch4_synth",
    type: "run",
    label: "batch4/synthesis",
    status: "completed",
    metadata: {
      projectId: "proj_catalysts",
      owner: "Samuel Okafor",
      date: daysAgo(5),
      action: "open-run-logs",
    },
  },
  {
    id: "run_catalysts_batch4_xrd",
    type: "run",
    label: "batch4/xrd",
    status: "analysis",
    metadata: {
      projectId: "proj_catalysts",
      owner: "Samuel Okafor",
      date: hoursAgo(9),
      action: "open-run-logs",
    },
  },
  {
    id: "run_catalysts_stability_1",
    type: "run",
    label: "stability/100h",
    status: "planned",
    metadata: {
      projectId: "proj_catalysts",
      owner: "Dr. Lena Fischer",
      action: "open-run-logs",
    },
  },
  // Urban heat
  {
    id: "hyp_heat_canopy",
    type: "hypothesis",
    label: "Low canopy cover predicts ward-level heat exposure",
    status: "supported",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_heat",
      owner: "Arjun Rao",
      description:
        "Ward composites of surface temperature and canopy cover should rank heat priority consistently.",
      date: daysAgo(18),
    },
  },
  {
    id: "hyp_heat_calibration",
    type: "hypothesis",
    label: "Bias-corrected sensors reproduce Landsat rankings",
    status: "testing",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_heat",
      owner: "Dr. Priya Nair",
      description:
        "A siting-aware correction model should reduce RMSE enough to preserve ward-level rankings.",
      date: daysAgo(10),
    },
  },
  {
    id: "exp_heat_mosaic",
    type: "experiment",
    label: "Summer surface-temperature mosaic",
    status: "completed",
    metadata: {
      projectId: "proj_heat",
      owner: "Tomas Lindqvist",
      date: daysAgo(6),
      action: "open-experiment",
      metrics: [{ label: "Resolution", value: "30 m" }],
    },
  },
  {
    id: "exp_heat_calibration",
    type: "experiment",
    label: "Ground-sensor calibration",
    status: "running",
    metadata: {
      projectId: "proj_heat",
      owner: "Arjun Rao",
      date: hoursAgo(2),
      action: "open-experiment",
      metrics: [{ label: "Sensors", value: "40" }],
    },
  },
  {
    id: "run_heat_mosaic",
    type: "run",
    label: "landsat/summer-mosaic",
    status: "completed",
    metadata: {
      projectId: "proj_heat",
      owner: "Tomas Lindqvist",
      date: daysAgo(6),
      action: "open-run-logs",
    },
  },
  {
    id: "run_heat_calibration",
    type: "run",
    label: "sensors/calibrate-v1",
    status: "completed",
    metadata: {
      projectId: "proj_heat",
      owner: "Arjun Rao",
      date: daysAgo(4),
      action: "open-run-logs",
    },
  },
  {
    id: "run_heat_validation",
    type: "run",
    label: "sensors/cross-validate-v2",
    status: "running",
    metadata: {
      projectId: "proj_heat",
      owner: "Arjun Rao",
      date: hoursAgo(4),
      action: "open-run-logs",
    },
  },
  // Gut atlas planning hypothesis
  {
    id: "hyp_gut_atlas",
    type: "hypothesis",
    label: "Cross-cohort harmonization preserves rare epithelial states",
    status: "planned",
    metadata: {
      kind: "hypothesis",
      projectId: "proj_gut",
      owner: "Dr. Priya Nair",
      description:
        "Batch correction should retain rare tuft-cell and enteroendocrine populations across six cohorts.",
      date: daysAgo(9),
    },
  },
  // Decisions (compatible graph nodes until the Decisions module lands)
  {
    id: "dec_ica_components",
    type: "decision",
    label: "Use the 30-component ICA solution",
    status: "accepted",
    metadata: {
      kind: "decision",
      projectId: "proj_cortical",
      owner: "Dr. Lena Fischer",
      description:
        "Component count frozen at 30 after visual inspection and replication of cohort A artifacts.",
      date: daysAgo(2),
    },
  },
  {
    id: "dec_batch4_ph",
    type: "decision",
    label: "Hold batch 4 at 5 mol% doping",
    status: "proposed",
    metadata: {
      kind: "decision",
      projectId: "proj_catalysts",
      owner: "Dr. Lena Fischer",
      description: "Awaiting XRD confirmation before the next synthesis batch.",
      date: daysAgo(1),
    },
  },
  {
    id: "dec_heat_calibration",
    type: "decision",
    label: "Adopt bias-corrected sensor calibration",
    status: "proposed",
    metadata: {
      kind: "decision",
      projectId: "proj_heat",
      owner: "Arjun Rao",
      description: "Reviewing residuals before locking the correction model.",
      date: hoursAgo(4),
    },
  },
  // Reference-only papers used by the citation graph to demonstrate the
  // "Only in my library" filter. They are explicitly marked as external.
  {
    id: "paper_ext_nakamura2019",
    type: "paper",
    label: "Oscillatory mechanisms of working-memory maintenance",
    metadata: {
      inLibrary: false,
      year: 2019,
      journal: "Trends in Cognitive Sciences",
      authors: ["S. Nakamura", "K. Ito"],
      tags: ["Working Memory", "Review"],
      description:
        "Reference-only mock citation record. Not part of the local library and not externally verified.",
    },
  },
  {
    id: "paper_ext_gomez2021",
    type: "paper",
    label: "Urban canopy cover and intra-urban heat exposure",
    metadata: {
      inLibrary: false,
      year: 2021,
      journal: "Urban Climate",
      authors: ["E. Gómez", "R. Singh"],
      tags: ["Heat", "Urban"],
      description:
        "Reference-only mock citation record. Not part of the local library and not externally verified.",
    },
  },
  {
    id: "paper_ext_watanabe2022",
    type: "paper",
    label: "Stability descriptors for oxide photocatalysts",
    metadata: {
      inLibrary: false,
      year: 2022,
      journal: "ACS Catalysis",
      authors: ["H. Watanabe"],
      tags: ["Photocatalysis", "Stability"],
      description:
        "Reference-only mock citation record. Not part of the local library and not externally verified.",
    },
  },
];

const graphEdges: GraphEdge[] = [
  // Cortical hypothesis branches
  { id: "ge_c1", from: "project:proj_cortical", to: "hyp_cortical_theta", type: "depends" },
  { id: "ge_c2", from: "project:proj_cortical", to: "hyp_cortical_alpha", type: "depends" },
  { id: "ge_c3", from: "project:proj_cortical", to: "hyp_cortical_pipeline", type: "depends" },
  { id: "ge_c4", from: "hyp_cortical_theta", to: "exp_cortical_cohort_a", type: "branches" },
  { id: "ge_c5", from: "hyp_cortical_theta", to: "exp_cortical_cohort_b", type: "branches" },
  { id: "ge_c6", from: "hyp_cortical_alpha", to: "exp_cortical_alpha", type: "branches" },
  { id: "ge_c7", from: "hyp_cortical_pipeline", to: "exp_cortical_multisite", type: "branches" },
  { id: "ge_c8", from: "exp_cortical_cohort_a", to: "run_cortical_a_preprocess", type: "tests" },
  { id: "ge_c9", from: "run_cortical_a_preprocess", to: "run_cortical_a_coupling", type: "depends" },
  { id: "ge_c10", from: "exp_cortical_cohort_b", to: "run_cortical_b_preprocess", type: "tests" },
  { id: "ge_c11", from: "run_cortical_b_preprocess", to: "run_cortical_b_coupling", type: "depends" },
  { id: "ge_c12", from: "exp_cortical_alpha", to: "run_cortical_alpha_1", type: "tests" },
  { id: "ge_c13", from: "exp_cortical_multisite", to: "run_cortical_multisite_1", type: "tests" },
  { id: "ge_c14", from: "run_cortical_multisite_1", to: "run_cortical_multisite_2", type: "depends" },
  { id: "ge_c15", from: "run_cortical_a_coupling", to: "hyp_cortical_conclusion", type: "derived_from" },
  { id: "ge_c16", from: "run_cortical_b_coupling", to: "hyp_cortical_conclusion", type: "derived_from" },
  { id: "ge_c17", from: "run_cortical_multisite_2", to: "hyp_cortical_pipeline", type: "derived_from" },
  { id: "ge_c18", from: "paper:paper_1", to: "hyp_cortical_theta", type: "tests" },
  { id: "ge_c19", from: "paper:paper_3", to: "hyp_cortical_pipeline", type: "tests" },
  { id: "ge_c20", from: "paper:paper_2", to: "hyp_cortical_alpha", type: "tests" },
  { id: "ge_c21", from: "notebook:nb_cortical_analysis", to: "hyp_cortical_theta", type: "links" },
  { id: "ge_c22", from: "notebook:nb_cortical_analysis", to: "dataset:file_2", type: "links" },
  { id: "ge_c23", from: "dataset:file_1", to: "run_cortical_a_preprocess", type: "links" },
  { id: "ge_c24", from: "notebook:nb_reading_group", to: "paper:paper_2", type: "links" },
  // Catalysts
  { id: "ge_k1", from: "project:proj_catalysts", to: "hyp_catalysts_ni_doping", type: "depends" },
  { id: "ge_k2", from: "project:proj_catalysts", to: "hyp_catalysts_stability", type: "depends" },
  { id: "ge_k3", from: "hyp_catalysts_ni_doping", to: "exp_catalysts_batch4", type: "branches" },
  { id: "ge_k4", from: "hyp_catalysts_stability", to: "exp_catalysts_stability", type: "branches" },
  { id: "ge_k5", from: "exp_catalysts_batch4", to: "run_catalysts_batch4_synth", type: "tests" },
  { id: "ge_k6", from: "run_catalysts_batch4_synth", to: "run_catalysts_batch4_xrd", type: "depends" },
  { id: "ge_k7", from: "exp_catalysts_stability", to: "run_catalysts_stability_1", type: "tests" },
  { id: "ge_k8", from: "run_catalysts_batch4_xrd", to: "hyp_catalysts_ni_doping", type: "derived_from" },
  { id: "ge_k9", from: "run_catalysts_stability_1", to: "hyp_catalysts_stability", type: "derived_from" },
  { id: "ge_k10", from: "notebook:nb_catalysts_synthesis", to: "hyp_catalysts_ni_doping", type: "links" },
  { id: "ge_k11", from: "notebook:nb_catalysts_synthesis", to: "dataset:file_5", type: "links" },
  { id: "ge_k12", from: "paper:paper_4", to: "hyp_catalysts_ni_doping", type: "tests" },
  { id: "ge_k13", from: "paper:paper_5", to: "hyp_catalysts_stability", type: "tests" },
  // Urban heat
  { id: "ge_h1", from: "project:proj_heat", to: "hyp_heat_canopy", type: "depends" },
  { id: "ge_h2", from: "project:proj_heat", to: "hyp_heat_calibration", type: "depends" },
  { id: "ge_h3", from: "hyp_heat_canopy", to: "exp_heat_mosaic", type: "branches" },
  { id: "ge_h4", from: "hyp_heat_calibration", to: "exp_heat_calibration", type: "branches" },
  { id: "ge_h5", from: "exp_heat_mosaic", to: "run_heat_mosaic", type: "tests" },
  { id: "ge_h6", from: "exp_heat_calibration", to: "run_heat_calibration", type: "tests" },
  { id: "ge_h7", from: "run_heat_calibration", to: "run_heat_validation", type: "depends" },
  { id: "ge_h8", from: "run_heat_mosaic", to: "hyp_heat_canopy", type: "derived_from" },
  { id: "ge_h9", from: "run_heat_validation", to: "hyp_heat_calibration", type: "derived_from" },
  { id: "ge_h10", from: "notebook:nb_heat_protocol", to: "dataset:file_7", type: "links" },
  { id: "ge_h11", from: "paper:paper_6", to: "hyp_heat_canopy", type: "tests" },
  { id: "ge_h12", from: "paper:paper_7", to: "hyp_heat_calibration", type: "tests" },
  // Gut atlas
  { id: "ge_g1", from: "project:proj_gut", to: "hyp_gut_atlas", type: "depends" },
  { id: "ge_g2", from: "notebook:nb_gut_inventory", to: "hyp_gut_atlas", type: "links" },
  { id: "ge_g3", from: "paper:paper_9", to: "hyp_gut_atlas", type: "tests" },
  { id: "ge_g4", from: "paper:paper_8", to: "dataset:file_10", type: "links" },
  // Decisions
  { id: "ge_d1", from: "dec_ica_components", to: "notebook:nb_cortical_analysis", type: "links" },
  { id: "ge_d2", from: "dec_ica_components", to: "hyp_cortical_theta", type: "links" },
  { id: "ge_d3", from: "dec_batch4_ph", to: "notebook:nb_catalysts_synthesis", type: "links" },
  { id: "ge_d4", from: "dec_batch4_ph", to: "hyp_catalysts_ni_doping", type: "links" },
  { id: "ge_d5", from: "dec_heat_calibration", to: "notebook:nb_heat_protocol", type: "links" },
  { id: "ge_d6", from: "dec_heat_calibration", to: "hyp_heat_calibration", type: "links" },
  // Knowledge links across artifacts
  { id: "ge_kg1", from: "notebook:nb_cortical_analysis", to: "paper:paper_1", type: "links" },
  { id: "ge_kg2", from: "notebook:nb_catalysts_synthesis", to: "paper:paper_5", type: "links" },
  { id: "ge_kg3", from: "notebook:nb_heat_protocol", to: "paper:paper_7", type: "links" },
  { id: "ge_kg4", from: "notebook:nb_gut_inventory", to: "paper:paper_8", type: "links" },
  { id: "ge_kg5", from: "paper:paper_4", to: "dataset:file_5", type: "links" },
  { id: "ge_kg6", from: "paper:paper_6", to: "dataset:file_7", type: "links" },
  { id: "ge_kg7", from: "paper:paper_1", to: "paper:paper_ext_nakamura2019", type: "cites" },
  { id: "ge_kg8", from: "paper:paper_6", to: "paper:paper_ext_gomez2021", type: "cites" },
];

const citations: CitationLink[] = [
  { id: "cite_1", from: "paper_2", to: "paper_1" },
  { id: "cite_2", from: "paper_1", to: "paper_3" },
  { id: "cite_3", from: "paper_3", to: "paper_1" },
  { id: "cite_4", from: "paper_2", to: "paper_3" },
  { id: "cite_5", from: "paper_4", to: "paper_5" },
  { id: "cite_6", from: "paper_5", to: "paper_4" },
  { id: "cite_7", from: "paper_6", to: "paper_7" },
  { id: "cite_8", from: "paper_7", to: "paper_6" },
  { id: "cite_9", from: "paper_9", to: "paper_8" },
  { id: "cite_10", from: "paper_12", to: "paper_11" },
  { id: "cite_11", from: "paper_11", to: "paper_12" },
  { id: "cite_12", from: "paper_1", to: "paper_ext_nakamura2019" },
  { id: "cite_13", from: "paper_2", to: "paper_ext_nakamura2019" },
  { id: "cite_14", from: "paper_6", to: "paper_ext_gomez2021" },
  { id: "cite_15", from: "paper_7", to: "paper_ext_gomez2021" },
  { id: "cite_16", from: "paper_4", to: "paper_ext_watanabe2022" },
  { id: "cite_17", from: "paper_5", to: "paper_ext_watanabe2022" },
];

const analytics: AnalyticsPoint[] = [
  { week: "Sep 29", tasks: 6, notes: 3, papers: 1 },
  { week: "Oct 6", tasks: 9, notes: 5, papers: 2 },
  { week: "Oct 13", tasks: 7, notes: 4, papers: 0 },
  { week: "Oct 20", tasks: 12, notes: 6, papers: 3 },
  { week: "Oct 27", tasks: 8, notes: 3, papers: 1 },
  { week: "Nov 3", tasks: 14, notes: 7, papers: 2 },
  { week: "Nov 10", tasks: 11, notes: 5, papers: 4 },
  { week: "Nov 17", tasks: 9, notes: 6, papers: 2 },
];

export function createSeedGraphNodes(): GraphNode[] {
  return structuredClone(graphNodes);
}

export function createSeedGraphEdges(): GraphEdge[] {
  return structuredClone(graphEdges);
}

export function createSeedCitations(): CitationLink[] {
  return structuredClone(citations);
}

export function createSeedGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return { nodes: createSeedGraphNodes(), edges: createSeedGraphEdges() };
}

function seedTasks(): Task[] {
  return structuredClone(tasks).map((task) => ({
    ...task,
    milestoneId: task.milestoneId ?? taskMilestoneSeed[task.id] ?? null,
    parentTaskId: task.parentTaskId ?? null,
  }));
}

export function createSeedTaskMilestoneAssignments(): Record<string, string> {
  return structuredClone(taskMilestoneSeed);
}

export function createSeedSubtasks(): Task[] {
  return seedTasks().filter((task) => Boolean(task.parentTaskId));
}

export function createSeedDatabase(): ResearchDatabase {
  const seedNotebooks = structuredClone(notebooks);
  const seedExperiments = createSeedExperiments();
  const seedProjects = structuredClone(projects);
  return {
    version: 4,
    user: currentUser,
    workspace: {
      id: "ws_northlight",
      name: "Northlight Cognition Lab",
      slug: "northlight-cognition",
      plan: "Research Lab",
      description:
        "A cognitive neuroscience lab studying memory, attention, and the mechanisms that support flexible behavior.",
      createdAt: daysAgo(420),
    },
    preferences: {
      theme: "light",
      density: "comfortable",
      reduceMotion: false,
      notifications: {
        taskAssignments: true,
        deadlineReminders: true,
        mentions: true,
        weeklyDigest: true,
        productUpdates: false,
      },
    },
    projects: seedProjects,
    tasks: seedTasks(),
    milestones: structuredClone(milestones),
    notebooks: seedNotebooks,
    papers: structuredClone(papers),
    files: structuredClone(files),
    folders: structuredClone(folders),
    activity: structuredClone(activity),
    researchLog: createSeedResearchLog(),
    notifications: [...structuredClone(notifications), ...createSeedReviewNotifications()],
    analytics: structuredClone(analytics),
    graphNodes: createSeedGraphNodes(),
    graphEdges: createSeedGraphEdges(),
    citations: createSeedCitations(),
    experiments: seedExperiments,
    experimentRuns: createSeedRuns(),
    hypotheses: createSeedHypotheses(),
    evidence: createSeedEvidence(),
    decisions: createSeedDecisions(),
    snapshots: createSeedSnapshots(),
    versions: createSeedVersions({
      notebooks: seedNotebooks,
      experiments: seedExperiments,
      projects: seedProjects,
    }),
  };
}
