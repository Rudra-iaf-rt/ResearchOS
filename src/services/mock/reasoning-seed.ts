import { subDays, subHours } from "date-fns";
import type {
  ArtifactVersion,
  Experiment,
  ExperimentRun,
  Hypothesis,
  HypothesisEvidence,
  Notebook,
  Person,
  Project,
  ResearchDecision,
  ResearchSnapshot,
  SnapshotManifestEntry,
} from "@/types";

const iso = (date: Date) => date.toISOString();
const daysAgo = (days: number) => iso(subDays(new Date(), days));
const hoursAgo = (hours: number) => iso(subHours(new Date(), hours));

const maya: Person = {
  id: "person_maya",
  name: "Dr. Maya Chen",
  initials: "MC",
  role: "Principal Investigator",
  color: "#0D9488",
};
const arjun: Person = {
  id: "person_arjun",
  name: "Arjun Rao",
  initials: "AR",
  role: "PhD Candidate",
  color: "#6366F1",
};
const lena: Person = {
  id: "person_lena",
  name: "Lena Fischer",
  initials: "LF",
  role: "Postdoctoral Researcher",
  color: "#D97706",
};
const tomas: Person = {
  id: "person_tomas",
  name: "Tomás Alvarez",
  initials: "TA",
  role: "Research Assistant",
  color: "#0284C7",
};
const priya: Person = {
  id: "person_priya",
  name: "Priya Nair",
  initials: "PN",
  role: "Data Scientist",
  color: "#DB2777",
};
const samuel: Person = {
  id: "person_samuel",
  name: "Samuel Okafor",
  initials: "SO",
  role: "Lab Technician",
  color: "#7C3AED",
};

const p = (id: string, key: string, value: string) => ({ id: `${id}_${key}`, key, value });

const cohortAParams = [
  p("cohort_a", "participants", "20"),
  p("cohort_a", "load_levels", "3"),
  p("cohort_a", "sampling_rate", "1000 Hz"),
  p("cohort_a", "pipeline", "preprocess-v2"),
];

const cohortBParams = [
  p("cohort_b", "participants", "38"),
  p("cohort_b", "completed_sessions", "31"),
  p("cohort_b", "sampling_rate", "1000 Hz"),
  p("cohort_b", "pipeline", "preprocess-v2-locked"),
];

const experiments: Experiment[] = [
  {
    id: "exp_cortical_cohort_a",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    hypothesisId: "hyp_cortical_theta",
    title: "Cohort A — high-density EEG",
    description:
      "Twenty participants completed three working-memory load conditions while high-density EEG was recorded. This cohort established the primary theta–gamma coupling estimate.",
    status: "succeeded",
    parameters: cohortAParams,
    notes:
      "<h2>Outcome</h2><p>Coupling scaled with load in 18 of 20 participants. Usable epochs remained above 94% after artifact rejection.</p><blockquote><p>Locked the preprocessing parameters after visual inspection of component 12.</p></blockquote>",
    artifactRefs: [
      { type: "notebook", id: "nb_cortical_analysis", label: "Theta–gamma coupling analysis log" },
      { type: "file", id: "file_1", label: "cortical-cohortA-preprocessed.zip" },
      { type: "file", id: "file_2", label: "cortical-B-quality-metrics.csv" },
    ],
    owner: maya,
    createdBy: "user_maya",
    createdAt: daysAgo(64),
    updatedAt: daysAgo(8),
  },
  {
    id: "exp_cortical_cohort_b",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    hypothesisId: "hyp_cortical_theta",
    title: "Cohort B — replication",
    description:
      "Independent replication of the Cohort A coupling effect using the frozen preprocessing pipeline. Thirty-one of 38 participants have completed acquisition.",
    status: "running",
    parameters: cohortBParams,
    notes:
      "<p>Acquisition is complete. The remaining work is the locked coupling analysis and sensitivity check requested during methods review.</p><ul><li>Thirty-eight included participants</li><li>Pipeline frozen at preprocess-v2</li></ul>",
    artifactRefs: [
      { type: "notebook", id: "nb_cortical_analysis", label: "Theta–gamma coupling analysis log" },
      { type: "file", id: "file_2", label: "cortical-B-quality-metrics.csv" },
    ],
    owner: arjun,
    createdBy: "user_maya",
    createdAt: daysAgo(41),
    updatedAt: hoursAgo(4),
  },
  {
    id: "exp_cortical_alpha",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    hypothesisId: "hyp_cortical_alpha",
    title: "Alpha precision MEG",
    description:
      "Parametric cue-reliability manipulation with MEG to test whether alpha suppression tracks the expected precision of upcoming stimuli.",
    status: "draft",
    parameters: [
      p("alpha", "cue_reliability", "0.40 / 0.70 / 0.95"),
      p("alpha", "modality", "MEG"),
      p("alpha", "trials_per_condition", "96"),
    ],
    notes:
      "<p>Protocol drafted. Awaiting ethics amendment for the additional MEG sessions before the pilot is queued.</p>",
    artifactRefs: [{ type: "paper", id: "paper_2", label: "Expectation modulates alpha power" }],
    owner: priya,
    createdBy: "user_maya",
    createdAt: daysAgo(33),
    updatedAt: daysAgo(31),
  },
  {
    id: "exp_cortical_multisite",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    hypothesisId: "hyp_cortical_pipeline",
    title: "Four-site harmonization",
    description:
      "Replication of the locked preprocessing pipeline across four acquisition sites to verify that subject-level spectral estimates remain comparable.",
    status: "running",
    parameters: [
      p("multisite", "sites", "4"),
      p("multisite", "pipeline", "locked-v2"),
      p("multisite", "reference", "common-average"),
    ],
    notes:
      "<p>Site-level harmonization finished with ICC 0.84. Validation is running against the held-out site.</p>",
    artifactRefs: [{ type: "file", id: "file_1", label: "cortical-cohortA-preprocessed.zip" }],
    owner: arjun,
    createdBy: "user_maya",
    createdAt: daysAgo(74),
    updatedAt: daysAgo(3),
  },
  {
    id: "exp_catalysts_batch4",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    hypothesisId: "hyp_catalysts_ni_doping",
    title: "Batch 4 — Ni-doped TiO₂",
    description:
      "Three doping concentrations synthesized in parallel with XRD after calcination. The 5 mol% sample is being checked for phase purity before photocatalytic testing.",
    status: "running",
    parameters: [
      p("batch4", "doping", "0 / 5 / 10 mol%"),
      p("batch4", "calcination_temp", "450 °C"),
      p("batch4", "atmosphere", "air"),
    ],
    notes:
      "<p>The 5 mol% sample shows a grey tint. Held photocatalytic testing until the XRD refinement confirms phase purity.</p>",
    artifactRefs: [
      { type: "notebook", id: "nb_catalysts_synthesis", label: "Synthesis log — oxide heterostructures" },
      { type: "file", id: "file_5", label: "ni-doped-tio2-xrd-batch4.csv" },
    ],
    owner: samuel,
    createdBy: "user_maya",
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(9),
  },
  {
    id: "exp_catalysts_stability",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    hypothesisId: "hyp_catalysts_stability",
    title: "100-hour photostability",
    description:
      "Continuous photostability measurement of the best-performing surface reconstruction to test whether reversible reconstruction predicts sustained activity.",
    status: "draft",
    parameters: [
      p("stability", "duration", "100 h"),
      p("stability", "irradiance", "1 sun"),
      p("stability", "sampling_interval", "15 min"),
    ],
    notes: "<p>Protocol prepared. The reactor is booked for next week.</p>",
    artifactRefs: [
      { type: "notebook", id: "nb_catalysts_synthesis", label: "Synthesis log — oxide heterostructures" },
      { type: "paper", id: "paper_5", label: "Surface reconstruction governs long-term photostability" },
    ],
    owner: lena,
    createdBy: "user_maya",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
  },
  {
    id: "exp_heat_mosaic",
    workspaceId: "ws_northlight",
    projectId: "proj_heat",
    hypothesisId: "hyp_heat_canopy",
    title: "Summer surface-temperature mosaic",
    description:
      "Landsat summer composite at 30 m resolution, used to rank wards by surface temperature and canopy cover.",
    status: "succeeded",
    parameters: [
      p("mosaic", "resolution", "30 m"),
      p("mosaic", "season", "summer 2025"),
      p("mosaic", "cloud_mask", "QA_PIXEL"),
    ],
    notes:
      "<p>Mosaic accepted. Ward rankings were stable across the two acquisition windows.</p>",
    artifactRefs: [
      { type: "notebook", id: "nb_heat_protocol", label: "Heat mapping protocol & calibration notes" },
      { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
    ],
    owner: tomas,
    createdBy: "user_maya",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(6),
  },
  {
    id: "exp_heat_calibration",
    workspaceId: "ws_northlight",
    projectId: "proj_heat",
    hypothesisId: "hyp_heat_calibration",
    title: "Ground-sensor calibration",
    description:
      "Siting-aware bias correction for 40 ground sensors, evaluated against the Landsat mosaic at ward level.",
    status: "running",
    parameters: [
      p("calibration", "sensors", "40"),
      p("calibration", "model", "siting-aware v2"),
      p("calibration", "validation", "leave-one-site-out"),
    ],
    notes:
      "<p>Correction model fitted. Cross-validation is running on the held-out sensor cluster.</p>",
    artifactRefs: [
      { type: "notebook", id: "nb_heat_protocol", label: "Heat mapping protocol & calibration notes" },
      { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
      { type: "file", id: "file_8", label: "sensor-calibration-model.py" },
    ],
    owner: arjun,
    createdBy: "user_maya",
    createdAt: daysAgo(24),
    updatedAt: hoursAgo(2),
  },
];

function run(
  input: Omit<ExperimentRun, "workspaceId" | "projectId" | "updatedAt"> &
    Partial<Pick<ExperimentRun, "updatedAt">>,
): ExperimentRun {
  const experiment = experiments.find((item) => item.id === input.experimentId);
  return {
    workspaceId: "ws_northlight",
    projectId: experiment?.projectId ?? "proj_cortical",
    updatedAt: input.endedAt ?? input.startedAt ?? input.createdAt,
    ...input,
  };
}

const runs: ExperimentRun[] = [
  run({
    id: "run_cortical_a_preprocess",
    experimentId: "exp_cortical_cohort_a",
    runNumber: 1,
    label: "cohort-a/preprocess-v2",
    status: "succeeded",
    parameters: cohortAParams,
    logs: `[09:02:11] INFO  Loaded 20 participants from cortical-cohortA-preprocessed.zip
[09:03:48] INFO  Applied band-pass 1–40 Hz and 50 Hz notch
[09:11:02] INFO  ICA decomposition complete (30 components retained)
[09:24:30] WARN  4 components flagged for ocular artifact review
[09:38:17] INFO  Usable epochs: 94.2% across load conditions
[09:42:00] DONE  Preprocessing finished`,
    artifactRefs: [
      { type: "file", id: "file_1", label: "cortical-cohortA-preprocessed.zip" },
    ],
    startedAt: daysAgo(9),
    endedAt: daysAgo(9),
    durationSeconds: 2520,
    createdBy: "user_maya",
    createdAt: daysAgo(9),
  }),
  run({
    id: "run_cortical_a_coupling",
    experimentId: "exp_cortical_cohort_a",
    runNumber: 2,
    label: "cohort-a/coupling-v3",
    status: "succeeded",
    parameters: cohortAParams,
    logs: `[10:14:02] INFO  Computing theta–gamma coupling per subject
[10:16:44] INFO  Normalising by surrogate coupling (n = 500)
[10:29:08] INFO  Load effect: F(2, 38) = 8.41, p = .001
[10:31:55] INFO  Individual capacity correlation: r = .47
[10:34:12] DONE  Results exported to nb_cortical_analysis`,
    artifactRefs: [
      { type: "notebook", id: "nb_cortical_analysis", label: "Theta–gamma coupling analysis log" },
      { type: "file", id: "file_2", label: "cortical-B-quality-metrics.csv" },
    ],
    startedAt: daysAgo(8),
    endedAt: daysAgo(8),
    durationSeconds: 1210,
    createdBy: "user_maya",
    createdAt: daysAgo(8),
  }),
  run({
    id: "run_cortical_b_preprocess",
    experimentId: "exp_cortical_cohort_b",
    runNumber: 1,
    label: "cohort-b/preprocess-v2",
    status: "running",
    parameters: cohortBParams,
    logs: `[06:04:10] INFO  Loaded 38 participant archives
[06:06:32] INFO  Frozen pipeline preprocess-v2-locked applied
[06:18:55] INFO  ICA complete for 27 / 38 participants
[06:31:07] WARN  Subject B-114 has elevated line noise; will review after ICA
[06:33:40] INFO  Continuing runtime…`,
    artifactRefs: [
      { type: "file", id: "file_1", label: "cortical-cohortA-preprocessed.zip" },
    ],
    startedAt: hoursAgo(4),
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_arjun",
    createdAt: hoursAgo(4),
  }),
  run({
    id: "run_cortical_b_coupling",
    experimentId: "exp_cortical_cohort_b",
    runNumber: 2,
    label: "cohort-b/coupling-v3",
    status: "queued",
    parameters: cohortBParams,
    logs: "",
    artifactRefs: [],
    startedAt: null,
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_priya",
    createdAt: hoursAgo(3),
  }),
  run({
    id: "run_cortical_alpha_1",
    experimentId: "exp_cortical_alpha",
    runNumber: 1,
    label: "alpha-meg/pilot-1",
    status: "queued",
    parameters: [
      p("alpha", "cue_reliability", "0.40 / 0.70 / 0.95"),
      p("alpha", "modality", "MEG"),
      p("alpha", "trials_per_condition", "96"),
    ],
    logs: "",
    artifactRefs: [],
    startedAt: null,
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_priya",
    createdAt: daysAgo(28),
  }),
  run({
    id: "run_cortical_multisite_1",
    experimentId: "exp_cortical_multisite",
    runNumber: 1,
    label: "multisite/harmonize-v1",
    status: "succeeded",
    parameters: [
      p("multisite", "sites", "4"),
      p("multisite", "pipeline", "locked-v2"),
      p("multisite", "reference", "common-average"),
    ],
    logs: `[13:00:05] INFO  Loaded 4 site archives
[13:04:47] INFO  Harmonised subject-level PSDs
[13:12:16] INFO  ICC across sites: 0.84 (95% CI 0.78–0.89)
[13:12:44] DONE  Harmonisaton matrix saved`,
    artifactRefs: [],
    startedAt: daysAgo(20),
    endedAt: daysAgo(20),
    durationSeconds: 780,
    createdBy: "person_arjun",
    createdAt: daysAgo(20),
  }),
  run({
    id: "run_cortical_multisite_2",
    experimentId: "exp_cortical_multisite",
    runNumber: 2,
    label: "multisite/validate-v2",
    status: "running",
    parameters: [
      p("multisite", "sites", "4"),
      p("multisite", "pipeline", "locked-v2"),
      p("multisite", "reference", "common-average"),
      p("multisite", "holdout_site", "site-4"),
    ],
    logs: `[08:11:02] INFO  Leave-one-site-out validation started
[08:14:28] INFO  Fitting site-4 transfer model
[08:22:51] INFO  Bootstrap 120 / 500 complete
[08:24:00] INFO  Continuing runtime…`,
    artifactRefs: [],
    startedAt: daysAgo(3),
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_arjun",
    createdAt: daysAgo(3),
  }),
  run({
    id: "run_catalysts_batch4_synth",
    experimentId: "exp_catalysts_batch4",
    runNumber: 1,
    label: "batch4/synthesis",
    status: "succeeded",
    parameters: [
      p("batch4", "doping", "0 / 5 / 10 mol%"),
      p("batch4", "calcination_temp", "450 °C"),
      p("batch4", "atmosphere", "air"),
    ],
    logs: `[07:30:00] INFO  Precursors weighed for three doping levels
[08:05:12] INFO  Sol-gel transition complete
[09:10:44] INFO  Calcination at 450 °C for 4 h
[13:22:09] DONE  Three powders recovered; 5 mol% sample has grey tint`,
    artifactRefs: [
      { type: "notebook", id: "nb_catalysts_synthesis", label: "Synthesis log — oxide heterostructures" },
    ],
    startedAt: daysAgo(5),
    endedAt: daysAgo(5),
    durationSeconds: 21129,
    createdBy: "person_samuel",
    createdAt: daysAgo(5),
  }),
  run({
    id: "run_catalysts_batch4_xrd",
    experimentId: "exp_catalysts_batch4",
    runNumber: 2,
    label: "batch4/xrd",
    status: "running",
    parameters: [
      p("batch4", "doping", "0 / 5 / 10 mol%"),
      p("batch4", "scan_range", "20–80° 2θ"),
      p("batch4", "step_size", "0.02°"),
    ],
    logs: `[15:02:30] INFO  Mounted 5 mol% pellet
[15:08:11] INFO  XRD scan 20–80° 2θ
[15:19:47] INFO  Phase refinement in progress
[15:20:02] INFO  Continuing runtime…`,
    artifactRefs: [
      { type: "file", id: "file_5", label: "ni-doped-tio2-xrd-batch4.csv" },
    ],
    startedAt: hoursAgo(9),
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_samuel",
    createdAt: hoursAgo(9),
  }),
  run({
    id: "run_catalysts_stability_1",
    experimentId: "exp_catalysts_stability",
    runNumber: 1,
    label: "stability/100h",
    status: "queued",
    parameters: [
      p("stability", "duration", "100 h"),
      p("stability", "irradiance", "1 sun"),
      p("stability", "sampling_interval", "15 min"),
    ],
    logs: "",
    artifactRefs: [],
    startedAt: null,
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_lena",
    createdAt: daysAgo(18),
  }),
  run({
    id: "run_heat_mosaic",
    experimentId: "exp_heat_mosaic",
    runNumber: 1,
    label: "landsat/summer-mosaic",
    status: "succeeded",
    parameters: [
      p("mosaic", "resolution", "30 m"),
      p("mosaic", "season", "summer 2025"),
      p("mosaic", "cloud_mask", "QA_PIXEL"),
    ],
    logs: `[11:05:00] INFO  Retrieved Landsat 8/9 summer scenes
[11:17:18] INFO  Cloud masking and compositing complete
[11:26:42] INFO  Ward surface-temperature means extracted
[11:29:03] DONE  Mosaic accepted; 243 wards in output`,
    artifactRefs: [
      { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
    ],
    startedAt: daysAgo(6),
    endedAt: daysAgo(6),
    durationSeconds: 1443,
    createdBy: "person_tomas",
    createdAt: daysAgo(6),
  }),
  run({
    id: "run_heat_calibration",
    experimentId: "exp_heat_calibration",
    runNumber: 1,
    label: "sensors/calibrate-v1",
    status: "succeeded",
    parameters: [
      p("calibration", "sensors", "40"),
      p("calibration", "model", "siting-aware v1"),
    ],
    logs: `[10:00:11] INFO  Loaded 40 ground-sensor series
[10:08:53] INFO  Model fitted with land-cover covariates
[10:15:02] WARN  Two sensors exceed residual threshold
[10:18:24] DONE  Calibration v1 saved for comparison`,
    artifactRefs: [
      { type: "file", id: "file_8", label: "sensor-calibration-model.py" },
    ],
    startedAt: daysAgo(4),
    endedAt: daysAgo(4),
    durationSeconds: 1093,
    createdBy: "person_arjun",
    createdAt: daysAgo(4),
  }),
  run({
    id: "run_heat_validation",
    experimentId: "exp_heat_calibration",
    runNumber: 2,
    label: "sensors/cross-validate-v2",
    status: "running",
    parameters: [
      p("calibration", "sensors", "40"),
      p("calibration", "model", "siting-aware v2"),
      p("calibration", "validation", "leave-one-site-out"),
    ],
    logs: `[07:44:20] INFO  Starting leave-one-site-out validation
[07:52:48] INFO  Fold 3 / 8 complete
[08:01:16] INFO  RMSE trend improving vs v1
[08:03:00] INFO  Continuing runtime…`,
    artifactRefs: [
      { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
      { type: "file", id: "file_8", label: "sensor-calibration-model.py" },
    ],
    startedAt: hoursAgo(4),
    endedAt: null,
    durationSeconds: null,
    createdBy: "person_arjun",
    createdAt: hoursAgo(4),
  }),
];

const hypotheses: Hypothesis[] = [
  {
    id: "hyp_cortical_theta",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    researchQuestion:
      "Does frontal theta–parietal gamma coupling scale with working-memory load and predict individual capacity?",
    statement:
      "Theta–gamma coupling should increase with working-memory load and correlate with individual working-memory capacity.",
    status: "supported",
    owner: maya,
    createdBy: "user_maya",
    createdAt: daysAgo(58),
    updatedAt: daysAgo(6),
  },
  {
    id: "hyp_cortical_alpha",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    researchQuestion:
      "Do precision-weighted prediction errors modulate oscillatory gain in the alpha band?",
    statement:
      "Cue reliability should modulate alpha suppression in proportion to the expected precision of the forthcoming stimulus.",
    status: "testing",
    owner: priya,
    createdBy: "user_maya",
    createdAt: daysAgo(33),
    updatedAt: daysAgo(10),
  },
  {
    id: "hyp_cortical_pipeline",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    researchQuestion:
      "Does a locked preprocessing pipeline preserve spectral estimates across recording sites?",
    statement:
      "A frozen preprocessing pipeline should preserve subject-level spectral estimates across four acquisition sites.",
    status: "supported",
    owner: arjun,
    createdBy: "user_maya",
    createdAt: daysAgo(74),
    updatedAt: daysAgo(3),
  },
  {
    id: "hyp_cortical_conclusion",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    researchQuestion:
      "Is the coupling effect specific to maintenance rather than general arousal?",
    statement:
      "Coupling indexes load-dependent maintenance, not arousal: the effect should be absent during passive viewing.",
    status: "supported",
    owner: maya,
    createdBy: "user_maya",
    createdAt: daysAgo(22),
    updatedAt: daysAgo(6),
  },
  {
    id: "hyp_catalysts_ni_doping",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    researchQuestion:
      "Which nickel doping level maximises visible-light hydrogen evolution?",
    statement:
      "5 mol% Ni doping maximises visible-light hydrogen evolution by improving charge separation without introducing recombination centres.",
    status: "testing",
    owner: lena,
    createdBy: "user_maya",
    createdAt: daysAgo(8),
    updatedAt: hoursAgo(9),
  },
  {
    id: "hyp_catalysts_stability",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    researchQuestion:
      "Can surface reconstruction predict long-term photostability?",
    statement:
      "Reversible surface reconstruction predicts 100-hour photostability and precedes irreversible oxygen loss.",
    status: "supported",
    owner: samuel,
    createdBy: "user_maya",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(5),
  },
  {
    id: "hyp_heat_canopy",
    workspaceId: "ws_northlight",
    projectId: "proj_heat",
    researchQuestion:
      "Does low canopy cover predict ward-level heat exposure in Bengaluru?",
    statement:
      "Ward composites of surface temperature and canopy cover rank heat priority consistently.",
    status: "supported",
    owner: arjun,
    createdBy: "user_maya",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(6),
  },
  {
    id: "hyp_heat_calibration",
    workspaceId: "ws_northlight",
    projectId: "proj_heat",
    researchQuestion:
      "Can a siting-aware correction make ground sensors reproduce Landsat rankings?",
    statement:
      "A siting-aware correction model reduces RMSE enough to preserve ward-level rankings against the Landsat mosaic.",
    status: "testing",
    owner: priya,
    createdBy: "user_maya",
    createdAt: daysAgo(10),
    updatedAt: hoursAgo(4),
  },
  {
    id: "hyp_gut_atlas",
    workspaceId: "ws_northlight",
    projectId: "proj_gut",
    researchQuestion:
      "Does cross-cohort harmonisation retain rare epithelial populations?",
    statement:
      "Batch correction should retain rare tuft-cell and enteroendocrine populations across six cohorts.",
    status: "proposed",
    owner: priya,
    createdBy: "user_maya",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
];

const evidence: HypothesisEvidence[] = [
  {
    id: "ev_theta_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_theta",
    stance: "supports",
    description:
      "Cohort A shows a monotonic load effect on coupling in 18 of 20 participants after artifact rejection.",
    artifact: {
      type: "notebook",
      id: "nb_cortical_analysis",
      label: "Theta–gamma coupling analysis log",
    },
    createdBy: "user_maya",
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
  },
  {
    id: "ev_theta_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_theta",
    stance: "supports",
    description:
      "Independent published cohort reports the same load-dependent coupling pattern with a comparable effect size.",
    artifact: { type: "paper", id: "paper_1", label: "Theta–gamma coupling predicts working-memory capacity" },
    createdBy: "user_maya",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
  {
    id: "ev_theta_3",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_theta",
    stance: "neutral",
    description:
      "Cohort B quality metrics remain within the pre-registered rejection threshold; final coupling estimate still pending.",
    artifact: { type: "file", id: "file_2", label: "cortical-B-quality-metrics.csv" },
    createdBy: "person_arjun",
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
  },
  {
    id: "ev_alpha_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_alpha",
    stance: "supports",
    description:
      "Cue reliability modulated alpha suppression in the expected direction in the published paradigm.",
    artifact: { type: "paper", id: "paper_2", label: "Expectation modulates alpha power" },
    createdBy: "user_maya",
    createdAt: daysAgo(28),
    updatedAt: daysAgo(28),
  },
  {
    id: "ev_alpha_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_alpha",
    stance: "contradicts",
    description:
      "Pilot MEG sessions (n = 6) did not show a reliable precision effect; likely underpowered, needs a full run.",
    artifact: { type: "notebook", id: "nb_cortical_analysis", label: "Theta–gamma coupling analysis log" },
    createdBy: "person_priya",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: "ev_pipeline_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_pipeline",
    stance: "supports",
    description:
      "Cross-site ICC of 0.84 exceeds the pre-registered 0.75 threshold for spectral estimates.",
    artifact: { type: "file", id: "file_1", label: "cortical-cohortA-preprocessed.zip" },
    createdBy: "person_arjun",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  },
  {
    id: "ev_pipeline_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_pipeline",
    stance: "supports",
    description:
      "Methods benchmark supports a frozen pipeline for multi-site spectral comparisons.",
    artifact: { type: "paper", id: "paper_3", label: "Harmonization strategies for cross-cohort single-cell transcriptomics" },
    createdBy: "user_maya",
    createdAt: daysAgo(40),
    updatedAt: daysAgo(40),
  },
  {
    id: "ev_conclusion_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_cortical_conclusion",
    stance: "supports",
    description:
      "The coupling effect is absent during passive viewing and scales with maintenance load, matching the conclusion.",
    artifact: {
      type: "notebook",
      id: "nb_cortical_analysis",
      label: "Theta–gamma coupling analysis log",
    },
    createdBy: "user_maya",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: "ev_ni_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_catalysts_ni_doping",
    stance: "supports",
    description:
      "Synthesis log shows the 5 mol% sample retained phase purity after calcination, enabling photocatalytic testing.",
    artifact: {
      type: "notebook",
      id: "nb_catalysts_synthesis",
      label: "Synthesis log — oxide heterostructures",
    },
    createdBy: "person_samuel",
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "ev_ni_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_catalysts_ni_doping",
    stance: "neutral",
    description:
      "XRD batch 4 scan is still running; cannot evaluate recombination behaviour until refinement completes.",
    artifact: { type: "file", id: "file_5", label: "ni-doped-tio2-xrd-batch4.csv" },
    createdBy: "person_samuel",
    createdAt: hoursAgo(9),
    updatedAt: hoursAgo(9),
  },
  {
    id: "ev_stability_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_catalysts_stability",
    stance: "supports",
    description:
      "Synthesis notes document reversible reconstruction without oxygen loss in the 100-hour preliminary sample.",
    artifact: {
      type: "notebook",
      id: "nb_catalysts_synthesis",
      label: "Synthesis log — oxide heterostructures",
    },
    createdBy: "person_lena",
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
  },
  {
    id: "ev_stability_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_catalysts_stability",
    stance: "supports",
    description:
      "Published stability descriptors align with the reconstruction mechanism proposed here.",
    artifact: { type: "paper", id: "paper_5", label: "Surface reconstruction governs long-term photostability" },
    createdBy: "person_lena",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  },
  {
    id: "ev_canopy_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_heat_canopy",
    stance: "supports",
    description:
      "Systematic review reports consistent inverse associations between canopy cover and heat exposure.",
    artifact: { type: "paper", id: "paper_6", label: "Urban heat exposure and cardiovascular outcomes" },
    createdBy: "person_arjun",
    createdAt: daysAgo(16),
    updatedAt: daysAgo(16),
  },
  {
    id: "ev_canopy_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_heat_canopy",
    stance: "supports",
    description:
      "Ward priorities from the summer mosaic reproduce the canopy ranking across both acquisition windows.",
    artifact: { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
    createdBy: "person_tomas",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(6),
  },
  {
    id: "ev_calibration_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_heat_calibration",
    stance: "supports",
    description:
      "Siting-aware v1 reduced residual variance enough to preserve the top-quartile ward ranking.",
    artifact: { type: "file", id: "file_8", label: "sensor-calibration-model.py" },
    createdBy: "person_arjun",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  },
  {
    id: "ev_calibration_2",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_heat_calibration",
    stance: "contradicts",
    description:
      "Two sensors still exceed the residual threshold; v2 validation must resolve this before adoption.",
    artifact: { type: "file", id: "file_7", label: "bengaluru-wards-heat-priority.geojson" },
    createdBy: "person_priya",
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
  },
  {
    id: "ev_gut_1",
    workspaceId: "ws_northlight",
    hypothesisId: "hyp_gut_atlas",
    stance: "neutral",
    description:
      "Harmonization benchmark suggests rare populations may need targeted retention checks before merging cohorts.",
    artifact: { type: "paper", id: "paper_9", label: "Harmonization strategies for cross-cohort single-cell transcriptomics" },
    createdBy: "person_priya",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  },
];

const decisions: ResearchDecision[] = [
  {
    id: "dec_ica_components",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    title: "Use the 30-component ICA solution",
    context:
      "Independent component analysis produced a stable solution between 28 and 33 components. The team needed a fixed component count before locking the preprocessing pipeline for Cohort B.",
    decision:
      "Freeze the decomposition at 30 components across both cohorts. The choice preserves the Cohort A artifact profile while keeping the pipeline reproducible.",
    alternatives: [
      {
        id: "alt_ica_36",
        title: "Retain 36 components",
        rationale:
          "Would preserve more high-frequency structure but introduced two components with mixed ocular and neural topography.",
      },
      {
        id: "alt_ica_icl",
        title: "Choose the count automatically with ICL",
        rationale:
          "Consistent, but the selected count changed between Cohort A and the pilot, which would break the frozen pipeline.",
      },
    ],
    artifacts: [
      { type: "notebook", id: "nb_cortical_analysis", label: "Theta–gamma coupling analysis log" },
      { type: "experiment", id: "exp_cortical_cohort_a", label: "Cohort A — high-density EEG" },
      { type: "hypothesis", id: "hyp_cortical_theta", label: "Theta–gamma coupling predicts working-memory capacity" },
      { type: "paper", id: "paper_1", label: "Theta–gamma coupling predicts working-memory capacity" },
    ],
    status: "accepted",
    owner: lena,
    createdBy: "user_maya",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "dec_batch4_ph",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    title: "Hold batch 4 at 5 mol% doping",
    context:
      "Batch 4 produced three doping levels. The 5 mol% sample shows a grey tint, and XRD refinement is still running.",
    decision:
      "Hold the 5 mol% batch pending XRD confirmation. Do not proceed to photocatalytic testing until phase purity is established.",
    alternatives: [
      {
        id: "alt_batch4_3",
        title: "Move to 3 mol%",
        rationale: "Lower risk of secondary phases, but no visible-light improvement over the undoped baseline.",
      },
      {
        id: "alt_batch4_10",
        title: "Test 10 mol% immediately",
        rationale: "Would test the upper doping bound, but the sample showed the strongest colour change and highest recombination risk.",
      },
    ],
    artifacts: [
      { type: "notebook", id: "nb_catalysts_synthesis", label: "Synthesis log — oxide heterostructures" },
      { type: "experiment", id: "exp_catalysts_batch4", label: "Batch 4 — Ni-doped TiO₂" },
      { type: "hypothesis", id: "hyp_catalysts_ni_doping", label: "5 mol% Ni doping maximizes visible-light hydrogen evolution" },
      { type: "file", id: "file_5", label: "ni-doped-tio2-xrd-batch4.csv" },
    ],
    status: "proposed",
    owner: lena,
    createdBy: "user_maya",
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(9),
  },
  {
    id: "dec_heat_calibration",
    workspaceId: "ws_northlight",
    projectId: "proj_heat",
    title: "Adopt bias-corrected sensor calibration",
    context:
      "The v1 correction improved ward rankings, but two sensors still exceed the residual threshold. A v2 model is under cross-validation.",
    decision:
      "Defer adoption until leave-one-site-out validation of v2 completes. The v1 model remains available for sensitivity checks only.",
    alternatives: [
      {
        id: "alt_heat_raw",
        title: "Use raw sensor values",
        rationale: "Transparent, but reproduces the known siting bias in three wards.",
      },
      {
        id: "alt_heat_v1",
        title: "Adopt v1 immediately",
        rationale: "Better than raw values, but the two high-residual sensors could distort the priority ranking.",
      },
    ],
    artifacts: [
      { type: "notebook", id: "nb_heat_protocol", label: "Heat mapping protocol & calibration notes" },
      { type: "experiment", id: "exp_heat_calibration", label: "Ground-sensor calibration" },
      { type: "hypothesis", id: "hyp_heat_calibration", label: "Bias-corrected sensors reproduce Landsat rankings" },
      { type: "file", id: "file_8", label: "sensor-calibration-model.py" },
    ],
    status: "proposed",
    owner: arjun,
    createdBy: "user_maya",
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
  },
  {
    id: "dec_catalysts_surface",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    title: "Prioritise surface reconstruction over bulk doping",
    context:
      "The stability hypothesis and the doping hypothesis both explain part of the activity change. The team needed a primary mechanism for the next round of experiments.",
    decision:
      "Prioritise surface reconstruction as the primary mechanistic explanation and treat doping as a secondary modifier.",
    alternatives: [
      {
        id: "alt_bulk",
        title: "Focus only on bulk doping",
        rationale: "Simpler synthesis, but does not explain the reversible activity changes observed during the stability check.",
      },
    ],
    artifacts: [
      { type: "paper", id: "paper_5", label: "Surface reconstruction governs long-term photostability" },
      { type: "hypothesis", id: "hyp_catalysts_stability", label: "Surface reconstruction predicts 100-hour photostability" },
      { type: "experiment", id: "exp_catalysts_stability", label: "100-hour photostability" },
    ],
    status: "accepted",
    owner: samuel,
    createdBy: "user_maya",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
];

function manifestEntry(
  artifactId: string,
  artifactType: SnapshotManifestEntry["artifactType"],
  title: string,
  projectId: string,
  versionRef: string | null,
  selectedAt: string,
): SnapshotManifestEntry {
  return {
    id: `manifest_${artifactId}`,
    artifactId,
    artifactType,
    title,
    projectId,
    versionRef,
    selectedAt,
  };
}

const snapshots: ResearchSnapshot[] = [
  {
    id: "snap_cortical_cohort_a_freeze",
    workspaceId: "ws_northlight",
    projectId: "proj_cortical",
    label: "Cohort A analysis freeze",
    description:
      "Frozen analysis state after the first coupling result and the ICA component-count decision.",
    manifest: [
      manifestEntry(
        "nb_cortical_analysis",
        "notebook",
        "Theta–gamma coupling analysis log",
        "proj_cortical",
        "notebook v2",
        daysAgo(6),
      ),
      manifestEntry(
        "exp_cortical_cohort_a",
        "experiment",
        "Cohort A — high-density EEG",
        "proj_cortical",
        "experiment parameters (4 keys)",
        daysAgo(6),
      ),
      manifestEntry(
        "file_1",
        "dataset",
        "cortical-cohortA-preprocessed.zip",
        "proj_cortical",
        null,
        daysAgo(6),
      ),
      manifestEntry(
        "dec_ica_components",
        "decision",
        "Use the 30-component ICA solution",
        "proj_cortical",
        "accepted decision",
        daysAgo(6),
      ),
    ],
    doi: null,
    createdBy: "user_maya",
    createdAt: daysAgo(6),
  },
  {
    id: "snap_catalysts_batch4_checkpoint",
    workspaceId: "ws_northlight",
    projectId: "proj_catalysts",
    label: "Batch 4 synthesis checkpoint",
    description:
      "Synthesis state before XRD refinement confirms phase purity for the 5 mol% sample.",
    manifest: [
      manifestEntry(
        "nb_catalysts_synthesis",
        "notebook",
        "Synthesis log — oxide heterostructures",
        "proj_catalysts",
        "notebook v1",
        daysAgo(5),
      ),
      manifestEntry(
        "exp_catalysts_batch4",
        "experiment",
        "Batch 4 — Ni-doped TiO₂",
        "proj_catalysts",
        "experiment parameters (3 keys)",
        daysAgo(5),
      ),
      manifestEntry(
        "file_5",
        "dataset",
        "ni-doped-tio2-xrd-batch4.csv",
        "proj_catalysts",
        null,
        daysAgo(5),
      ),
      manifestEntry(
        "dec_batch4_ph",
        "decision",
        "Hold batch 4 at 5 mol% doping",
        "proj_catalysts",
        "proposed decision",
        daysAgo(5),
      ),
    ],
    doi: null,
    createdBy: "user_maya",
    createdAt: daysAgo(5),
  },
  {
    id: "snap_heat_calibration_review",
    workspaceId: "ws_northlight",
    projectId: "proj_heat",
    label: "Calibration review 1",
    description:
      "Calibration state captured for the review; v2 cross-validation was still running.",
    manifest: [
      manifestEntry(
        "nb_heat_protocol",
        "notebook",
        "Heat mapping protocol & calibration notes",
        "proj_heat",
        "notebook v2",
        daysAgo(2),
      ),
      manifestEntry(
        "exp_heat_calibration",
        "experiment",
        "Ground-sensor calibration",
        "proj_heat",
        "experiment parameters (3 keys)",
        daysAgo(2),
      ),
      manifestEntry(
        "file_7",
        "dataset",
        "bengaluru-wards-heat-priority.geojson",
        "proj_heat",
        null,
        daysAgo(2),
      ),
      manifestEntry(
        "dec_heat_calibration",
        "decision",
        "Adopt bias-corrected sensor calibration",
        "proj_heat",
        "proposed decision",
        daysAgo(2),
      ),
    ],
    doi: null,
    createdBy: "user_maya",
    createdAt: daysAgo(2),
  },
];

function stripTags(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function notebookContent(notebook: Notebook): string {
  return notebook.entries
    .map((entry) => `## ${entry.title}\n\n${stripTags(entry.content)}`)
    .join("\n\n---\n\n");
}

function experimentContent(experiment: Experiment): string {
  const parameters = experiment.parameters
    .map((parameter) => `${parameter.key}: ${parameter.value}`)
    .join("\n");
  return `# ${experiment.title}\n\n${experiment.description}\n\n## Parameters\n\n${parameters}\n\n## Notes\n\n${stripTags(
    experiment.notes,
  )}`;
}

function projectContent(project: Project): string {
  return `# ${project.title}\n\n${project.description}\n\n## Objectives\n\n${project.objectives
    .map((objective) => `- ${objective}`)
    .join("\n")}\n\n## Metadata\n\nStatus: ${project.status}\nProgress: ${project.progress}%\nTags: ${project.tags.join(
    ", ",
  )}`;
}

export interface SeedReasoningContext {
  notebooks: Notebook[];
  experiments: Experiment[];
  projects: Project[];
}

export function createSeedExperiments(): Experiment[] {
  return structuredClone(experiments);
}

export function createSeedRuns(): ExperimentRun[] {
  return structuredClone(runs);
}

export function createSeedHypotheses(): Hypothesis[] {
  return structuredClone(hypotheses);
}

export function createSeedEvidence(): HypothesisEvidence[] {
  return structuredClone(evidence);
}

export function createSeedDecisions(): ResearchDecision[] {
  return structuredClone(decisions);
}

export function createSeedSnapshots(): ResearchSnapshot[] {
  return structuredClone(snapshots);
}

export function createSeedVersions(context: SeedReasoningContext): ArtifactVersion[] {
  const versions: ArtifactVersion[] = [];
  const version = (
    artifactType: ArtifactVersion["artifactType"],
    artifactId: string,
    versionNumber: number,
    label: string,
    summary: string,
    content: string,
    data: ArtifactVersion["data"],
    author: Person,
    createdAt: string,
  ) => {
    versions.push({
      id: `ver_${artifactType}_${artifactId}_${versionNumber}`,
      workspaceId: "ws_northlight",
      artifactType,
      artifactId,
      versionNumber,
      label,
      summary,
      content,
      data,
      author,
      createdAt,
    });
  };

  const corticalNotebook = context.notebooks.find((item) => item.id === "nb_cortical_analysis");
  if (corticalNotebook) {
    const baseEntries = structuredClone(corticalNotebook.entries);
    const v1Entries = baseEntries.map((entry, index) =>
      index === baseEntries.length - 1
        ? {
            ...entry,
            content:
              "<h2>Working notes</h2><p>Coupling estimated in 14 of 20 participants. Load effect is visible but the individual-capacity correlation is not yet stable.</p><p>Need to review component 12 before locking the pipeline.</p>",
          }
        : entry,
    );
    const v2Entries = baseEntries.map((entry, index) =>
      index === baseEntries.length - 1
        ? {
            ...entry,
            content: `${entry.content}<p>Added the locked pipeline check. Cohort A load effect holds after excluding two participants with high ocular artifact.</p>`,
          }
        : entry,
    );
    const notebookData = (entries: Notebook["entries"]) => ({
      notebook: {
        title: corticalNotebook.title,
        description: corticalNotebook.description,
        tags: [...corticalNotebook.tags],
        entries,
      },
    });
    const v1 = { ...corticalNotebook, entries: v1Entries };
    const v2 = { ...corticalNotebook, entries: v2Entries };
    version(
      "notebook",
      corticalNotebook.id,
      1,
      "v1 · First coupling pass",
      "Initial coupling estimate before the ICA decision.",
      notebookContent(v1),
      notebookData(v1Entries),
      maya,
      daysAgo(12),
    );
    version(
      "notebook",
      corticalNotebook.id,
      2,
      "v2 · Locked pipeline check",
      "Added the locked pipeline check and artifact sensitivity note.",
      notebookContent(v2),
      notebookData(v2Entries),
      maya,
      daysAgo(7),
    );
    version(
      "notebook",
      corticalNotebook.id,
      3,
      "v3 · Cohort B quality control",
      "Added Cohort B quality metrics and the final analysis plan.",
      notebookContent(corticalNotebook),
      notebookData(corticalNotebook.entries),
      maya,
      daysAgo(2),
    );
  }

  const heatNotebook = context.notebooks.find((item) => item.id === "nb_heat_protocol");
  if (heatNotebook) {
    const v1Entries = structuredClone(heatNotebook.entries);
    const v1 = { ...heatNotebook, entries: v1Entries };
    version(
      "notebook",
      heatNotebook.id,
      1,
      "v1 · Sensor calibration protocol",
      "Calibration protocol before the v2 cross-validation plan.",
      notebookContent(v1),
      {
        notebook: {
          title: heatNotebook.title,
          description: heatNotebook.description,
          tags: [...heatNotebook.tags],
          entries: v1Entries,
        },
      },
      arjun,
      daysAgo(9),
    );
    version(
      "notebook",
      heatNotebook.id,
      2,
      "v2 · Added v2 validation plan",
      "Current protocol with the leave-one-site-out validation plan.",
      notebookContent(heatNotebook),
      {
        notebook: {
          title: heatNotebook.title,
          description: heatNotebook.description,
          tags: [...heatNotebook.tags],
          entries: structuredClone(heatNotebook.entries),
        },
      },
      arjun,
      daysAgo(2),
    );
  }

  const cohortA = context.experiments.find((item) => item.id === "exp_cortical_cohort_a");
  if (cohortA) {
    const v1Params = cohortA.parameters.map((parameter) =>
      parameter.key === "pipeline" ? { ...parameter, value: "preprocess-v1" } : parameter,
    );
    const v1 = { ...cohortA, parameters: v1Params };
    version(
      "experiment",
      cohortA.id,
      1,
      "v1 · Initial parameter set",
      "Initial run parameters before the pipeline was locked.",
      experimentContent(v1),
      {
        experiment: {
          title: v1.title,
          description: v1.description,
          status: v1.status,
          parameters: v1Params,
          notes: v1.notes,
          artifactRefs: v1.artifactRefs,
        },
      },
      maya,
      daysAgo(30),
    );
    version(
      "experiment",
      cohortA.id,
      2,
      "v2 · Locked preprocessing",
      "Pipeline frozen at preprocess-v2 after the ICA decision.",
      experimentContent(cohortA),
      {
        experiment: {
          title: cohortA.title,
          description: cohortA.description,
          status: cohortA.status,
          parameters: cohortA.parameters,
          notes: cohortA.notes,
          artifactRefs: cohortA.artifactRefs,
        },
      },
      maya,
      daysAgo(8),
    );
  }

  const batch4 = context.experiments.find((item) => item.id === "exp_catalysts_batch4");
  if (batch4) {
    version(
      "experiment",
      batch4.id,
      1,
      "v1 · Batch 4 parameters",
      "Synthesis parameters recorded when the batch was queued.",
      experimentContent(batch4),
      {
        experiment: {
          title: batch4.title,
          description: batch4.description,
          status: batch4.status,
          parameters: batch4.parameters,
          notes: batch4.notes,
          artifactRefs: batch4.artifactRefs,
        },
      },
      samuel,
      daysAgo(5),
    );
  }

  const corticalProject = context.projects.find((item) => item.id === "proj_cortical");
  if (corticalProject) {
    const v1 = {
      ...corticalProject,
      progress: 55,
      description:
        "A cognitive neuroscience project studying theta–gamma coupling and working-memory capacity across two cohorts.",
    };
    version(
      "project",
      corticalProject.id,
      1,
      "v1 · Cohort A complete",
      "Project state at the end of Cohort A acquisition.",
      projectContent(v1),
      {
        project: {
          title: v1.title,
          description: v1.description,
          objectives: v1.objectives,
          tags: v1.tags,
          status: v1.status,
          progress: v1.progress,
        },
      },
      maya,
      daysAgo(30),
    );
    version(
      "project",
      corticalProject.id,
      2,
      "v2 · Cohort B underway",
      "Current project state with Cohort B acquisition and the multisite check.",
      projectContent(corticalProject),
      {
        project: {
          title: corticalProject.title,
          description: corticalProject.description,
          objectives: corticalProject.objectives,
          tags: corticalProject.tags,
          status: corticalProject.status,
          progress: corticalProject.progress,
        },
      },
      maya,
      daysAgo(3),
    );
  }

  return versions;
}
