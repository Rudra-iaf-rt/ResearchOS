import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileText,
  Flag,
  FolderKanban,
  FolderOpen,
  Library,
  Menu,
  NotebookPen,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#modules", label: "Research suite" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Data" },
];

const features = [
  {
    icon: FolderKanban,
    title: "Projects with a spine",
    description:
      "Objectives, milestones, tasks, notebooks, papers, and files stay connected to the project they belong to.",
    tone: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  },
  {
    icon: NotebookPen,
    title: "A notebook that thinks with you",
    description:
      "Rich entries, tables, task lists, and inline citations — with autosave and clean Markdown export.",
    tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  {
    icon: Library,
    title: "A library you actually use",
    description:
      "Save citations, abstracts, reading status, and private notes. Import BibTeX in seconds.",
    tone: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  {
    icon: BarChart3,
    title: "Momentum, made visible",
    description:
      "See completed tasks, notes, and reading across the lab without building a spreadsheet.",
    tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  {
    icon: FolderOpen,
    title: "Files with context",
    description:
      "Datasets, manuscripts, figures, and protocols organized by folder and linked to the work they support.",
    tone: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  {
    icon: Users,
    title: "Shared lab memory",
    description:
      "Activity, assignments, and notifications keep collaborators aligned without another status meeting.",
    tone: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
];

const modules = [
  {
    icon: FolderKanban,
    title: "Projects",
    description:
      "Track progress, objectives, and deadlines across the full portfolio with a calm, structured overview.",
    points: ["Milestones and at-risk flags", "Project-linked research material", "Grid and list views"],
  },
  {
    icon: NotebookPen,
    title: "Notebooks",
    description:
      "Write protocols, analyses, and decisions in a focused editor that keeps citations close at hand.",
    points: ["Rich text, tables, and task lists", "Inline paper citations", "Autosave and export"],
  },
  {
    icon: Library,
    title: "Library",
    description:
      "Turn scattered PDFs into a living literature review with reading states and private annotations.",
    points: ["BibTeX import", "Reading queue and favorites", "Citation copying and DOI links"],
  },
  {
    icon: FolderOpen,
    title: "Files",
    description:
      "Keep every dataset and manuscript findable with folders, project links, and clear metadata.",
    points: ["Folder hierarchy", "Drag-and-drop records", "Storage visibility"],
  },
];

const workflow = [
  {
    number: "01",
    title: "Frame the project",
    description:
      "Define objectives, milestones, and the people involved. Everything else attaches here.",
  },
  {
    number: "02",
    title: "Do the work",
    description:
      "Move tasks, write notebook entries, save papers, and drop in datasets as the research evolves.",
  },
  {
    number: "03",
    title: "See the whole picture",
    description:
      "Use momentum charts, upcoming deadlines, and activity to keep the lab oriented.",
  },
];

function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="ResearchOS home" className="rounded-md">
          <Logo />
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Landing navigation">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/register">
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <nav className="space-y-1" aria-label="Mobile landing navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-[1040px]">
      <div
        className="absolute -inset-x-10 -top-8 bottom-0 rounded-[32px] bg-gradient-to-b from-teal-500/10 via-indigo-500/5 to-transparent blur-2xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-navy-200/80 bg-card shadow-modal dark:border-navy-600">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-2.5">
          <span className="size-2 rounded-full bg-rose-400/80" />
          <span className="size-2 rounded-full bg-amber-400/80" />
          <span className="size-2 rounded-full bg-emerald-400/80" />
          <div className="mx-auto flex h-6 w-[42%] min-w-[180px] items-center justify-center gap-1 rounded-md border border-border bg-card text-[9.5px] text-muted-foreground">
            <ShieldCheck className="size-2.5" /> researchos.app/app
          </div>
        </div>

        <div className="flex">
          <div className="hidden w-[178px] shrink-0 flex-col bg-sidebar p-3 text-sidebar-foreground sm:flex">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex size-7 items-center justify-center rounded-md bg-teal-600 text-[9px] font-bold text-white">
                NC
              </span>
              <div className="min-w-0">
                <p className="truncate text-[9.5px] font-medium text-white">
                  Northlight Cognition Lab
                </p>
                <p className="text-[8px] text-sidebar-muted">Research Lab</p>
              </div>
            </div>
            <div className="mb-3 flex h-6 items-center gap-1.5 rounded border border-white/10 bg-white/5 px-2 text-[8px] text-sidebar-muted">
              <Search className="size-2.5" /> Search…
            </div>
            <div className="space-y-1">
              {[
                { icon: BarChart3, label: "Overview", active: true },
                { icon: FolderKanban, label: "Projects" },
                { icon: CheckCircle2, label: "Tasks", badge: "12" },
                { icon: NotebookPen, label: "Notebooks" },
                { icon: Library, label: "Library" },
                { icon: FolderOpen, label: "Files" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-[9px]",
                      item.active
                        ? "bg-white/10 text-white"
                        : "text-sidebar-muted",
                    )}
                  >
                    <Icon className="size-3" />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-white/10 px-1 text-[7.5px]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-auto rounded-md border border-white/10 bg-white/[0.03] p-2">
              <div className="flex items-center justify-between text-[7.5px] text-sidebar-muted">
                <span>Demo storage</span>
                <span>4.2 / 20 GB</span>
              </div>
              <div className="mt-1 h-1 rounded-full bg-white/10">
                <div className="h-1 w-[21%] rounded-full bg-teal-400" />
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 bg-background p-3 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Thursday, November 19
                </p>
                <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] sm:text-[18px]">
                  Good afternoon, Maya.
                </p>
              </div>
              <div className="hidden items-center gap-1.5 sm:flex">
                <span className="flex h-6 items-center rounded-md border border-border bg-card px-2 text-[8px] text-muted-foreground">
                  <Search className="mr-1 size-2.5" /> Search
                </span>
                <span className="flex h-6 items-center rounded-md bg-teal-600 px-2 text-[8px] font-medium text-white">
                  New project
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                { label: "Active projects", value: "4", hint: "1 in planning", tone: "text-teal-700 dark:text-teal-300" },
                { label: "Completed", value: "2", hint: "Archived", tone: "text-indigo-700 dark:text-indigo-300" },
                { label: "Pending tasks", value: "12", hint: "2 overdue", tone: "text-amber-700 dark:text-amber-300" },
                { label: "Documents", value: "38", hint: "Notes, papers, files", tone: "text-navy-800 dark:text-navy-200" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border bg-card p-2.5 shadow-subtle"
                >
                  <p className="text-[7.5px] text-muted-foreground">{stat.label}</p>
                  <p className={cn("mt-0.5 text-[16px] font-semibold tabular-nums", stat.tone)}>
                    {stat.value}
                  </p>
                  <p className="text-[7px] text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </div>

            <div className="mt-2 grid gap-2 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-3 shadow-subtle lg:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-semibold">Research momentum</p>
                  <div className="flex items-center gap-2 text-[7px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-sm bg-teal-500" /> Tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-sm bg-indigo-400" /> Notes
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-end gap-4">
                  <div>
                    <p className="text-[18px] font-semibold leading-none tracking-tight">126</p>
                    <p className="text-[7px] text-muted-foreground">tasks completed</p>
                  </div>
                  <div>
                    <p className="text-[18px] font-semibold leading-none tracking-tight">84</p>
                    <p className="text-[7px] text-muted-foreground">notebook entries</p>
                  </div>
                  <span className="mb-0.5 ml-auto rounded-full bg-emerald-50 px-1.5 py-0.5 text-[7px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    +18%
                  </span>
                </div>
                <svg viewBox="0 0 320 90" className="mt-2 h-[80px] w-full" aria-hidden="true">
                  <defs>
                    <linearGradient id="heroTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0D9488" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#0D9488" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="heroIndigo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[20, 40, 60, 80].map((y) => (
                    <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="currentColor" className="text-border" strokeDasharray="2 3" strokeWidth="0.6" />
                  ))}
                  <path d="M0 72 C30 68 45 58 70 60 C95 62 105 48 130 50 C155 52 165 38 190 40 C215 42 225 30 250 32 C275 34 295 22 320 18 L320 90 L0 90 Z" fill="url(#heroIndigo)" />
                  <path d="M0 72 C30 68 45 58 70 60 C95 62 105 48 130 50 C155 52 165 38 190 40 C215 42 225 30 250 32 C275 34 295 22 320 18" fill="none" stroke="#6366F1" strokeWidth="1.4" />
                  <path d="M0 82 C35 78 55 66 80 68 C105 70 120 60 145 58 C170 56 180 48 205 46 C230 44 245 36 270 34 C295 32 305 28 320 24 L320 90 L0 90 Z" fill="url(#heroTeal)" />
                  <path d="M0 82 C35 78 55 66 80 68 C105 70 120 60 145 58 C170 56 180 48 205 46 C230 44 245 36 270 34 C295 32 305 28 320 24" fill="none" stroke="#0D9488" strokeWidth="1.6" />
                </svg>
              </div>

              <div className="rounded-lg border border-border bg-card p-3 shadow-subtle">
                <p className="text-[9px] font-semibold">Upcoming</p>
                <div className="mt-2 space-y-2">
                  {[
                    { icon: Flag, label: "EEG preprocessing sign-off", meta: "Cortical dynamics", tone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300" },
                    { icon: CheckCircle2, label: "Draft methods section", meta: "Working memory", tone: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" },
                    { icon: Clock3, label: "Photostability run 3", meta: "Catalysts", tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-start gap-1.5">
                        <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded", item.tone)}>
                          <Icon className="size-2.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[8px] font-medium">{item.label}</p>
                          <p className="truncate text-[7px] text-muted-foreground">{item.meta}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-2 rounded-lg border border-border bg-card p-3 shadow-subtle">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[9px] font-semibold">Active research</p>
                <span className="text-[7px] text-teal-700 dark:text-teal-300">All projects →</span>
              </div>
              {[
                { title: "Cortical Dynamics of Working Memory", tag: "Active", progress: 68, tasks: "14/22" },
                { title: "Photocatalytic Water Splitting Catalysts", tag: "Active", progress: 42, tasks: "7/18" },
                { title: "Urban Heat & Cardiovascular Risk", tag: "Planning", progress: 24, tasks: "4/11" },
              ].map((project) => (
                <div key={project.title} className="flex items-center gap-2 border-t border-border py-1.5 first:border-t-0 first:pt-0 last:pb-0">
                  <span className="size-1.5 rounded-full bg-teal-500" />
                  <p className="min-w-0 flex-1 truncate text-[8px] font-medium">{project.title}</p>
                  <span className="hidden rounded-full bg-muted px-1.5 py-0.5 text-[6.5px] text-muted-foreground sm:block">
                    {project.tag}
                  </span>
                  <div className="flex w-16 items-center gap-1">
                    <div className="h-1 flex-1 rounded-full bg-muted">
                      <div className="h-1 rounded-full bg-teal-600" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="w-5 text-right text-[6.5px] tabular-nums text-muted-foreground">
                      {project.progress}%
                    </span>
                  </div>
                  <span className="hidden w-9 text-[6.5px] text-muted-foreground sm:block">
                    {project.tasks}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -left-4 top-24 hidden rounded-lg border border-border bg-card p-3 shadow-raised lg:block">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <Quote className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-medium">Citation linked</p>
            <p className="text-[8.5px] text-muted-foreground">S. Nakamura et al., 2025</p>
          </div>
        </div>
      </div>

      <div className="absolute -right-4 bottom-32 hidden rounded-lg border border-border bg-card p-3 shadow-raised lg:block">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <CheckCircle2 className="size-3.5" />
          </span>
          <div>
            <p className="text-[10px] font-medium">Autosaved just now</p>
            <p className="text-[8.5px] text-muted-foreground">Methods — entry 12</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 bg-radial-fade" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1280px] px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pt-20">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-in-up">
                <Badge
                  variant="outline"
                  className="mb-5 gap-1.5 border-teal-200 bg-teal-50/60 px-3 py-1 text-[11px] font-medium text-teal-800 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-200"
                >
                  <Sparkles className="size-3" />
                  Built for research teams, not generic project management
                </Badge>
              </div>
              <h1 className="display-title animate-fade-in-up text-foreground [animation-delay:60ms]">
                Your research, <span className="text-teal-700 dark:text-teal-400">finally in one place.</span>
              </h1>
              <p className="text-pretty mx-auto mt-5 max-w-2xl animate-fade-in-up text-[15px] leading-relaxed text-muted-foreground [animation-delay:120ms] sm:text-[16.5px]">
                ResearchOS connects projects, experiments, notebooks, papers, files, and the
                people doing the work — so the thread from question to publication never
                disappears.
              </p>
              <div className="mt-8 flex animate-fade-in-up flex-col items-center justify-center gap-2.5 [animation-delay:180ms] sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link to="/register">
                    Start your workspace <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/login">
                    <span className="flex size-4 items-center justify-center rounded-full bg-teal-600 text-[8px] font-bold text-white">
                      ▶
                    </span>
                    Explore the live demo
                  </Link>
                </Button>
              </div>
              <div className="mt-6 flex animate-fade-in-up flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground [animation-delay:240ms]">
                <span className="flex items-center gap-1.5">
                  <Check className="size-3 text-teal-600 dark:text-teal-400" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-3 text-teal-600 dark:text-teal-400" /> Local demo data
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="size-3 text-teal-600 dark:text-teal-400" /> Set up in two minutes
                </span>
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section className="border-y border-border bg-card/60">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Designed around real research practice
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-medium tracking-tight text-muted-foreground/80">
              <span>Northlight Institute</span>
              <span>Meridian Labs</span>
              <span>Helix Neurosciences</span>
              <span>Atlas Climate Group</span>
              <span>Kavli Research</span>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">One coherent system</span>
            <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">
              Everything research work touches
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Stop stitching together a task board, a notes app, a citation manager, and a shared
              drive. ResearchOS keeps the context intact.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border bg-card p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised dark:hover:border-navy-600"
                >
                  <span className={cn("flex size-9 items-center justify-center rounded-lg", feature.tone)}>
                    <Icon className="size-4" />
                  </span>
                  <h3 className="mt-3.5 text-[14px] font-semibold tracking-[-0.01em]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="modules" className="scroll-mt-24 border-y border-border bg-card/50">
          <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
              <div>
                <span className="eyebrow">The research suite</span>
                <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">
                  Five connected surfaces, one source of truth.
                </h2>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
                  Every surface is designed to reduce the distance between an idea, its evidence,
                  and the decision that follows.
                </p>

                <div className="mt-7 space-y-3">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <div
                        key={module.title}
                        className="rounded-xl border border-border bg-card p-4 shadow-subtle"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-7 items-center justify-center rounded-md bg-muted text-teal-700 dark:text-teal-300">
                            <Icon className="size-3.5" />
                          </span>
                          <h3 className="text-[13px] font-semibold">{module.title}</h3>
                        </div>
                        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div
                      key={module.title}
                      className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-subtle"
                    >
                      <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        <Icon className="size-4" />
                      </span>
                      <h3 className="mt-3 text-[13.5px] font-semibold">{module.title}</h3>
                      <ul className="mt-3 space-y-1.5">
                        {module.points.map((point) => (
                          <li key={point} className="flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
                            <Check className="mt-0.5 size-3 shrink-0 text-teal-600 dark:text-teal-400" />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <span className="mt-auto pt-4 text-[10.5px] font-medium text-teal-700 dark:text-teal-300">
                        Included in every workspace
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">A calmer workflow</span>
            <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] sm:text-[36px]">
              From question to publication
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              Research is not a straight line. The workspace flexes with it without losing the
              thread.
            </p>
          </div>

          <div className="relative mt-12 grid gap-5 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-border md:block" aria-hidden="true" />
            {workflow.map((step) => (
              <div key={step.number} className="relative rounded-xl border border-border bg-card p-5 shadow-subtle">
                <span className="relative z-10 flex size-12 items-center justify-center rounded-xl border border-border bg-card text-[12px] font-semibold text-teal-700 shadow-subtle dark:text-teal-300">
                  {step.number}
                </span>
                <h3 className="mt-4 text-[14px] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: BookOpen, label: "Literature stays attached to the project" },
              { icon: FileText, label: "Drafts inherit the evidence trail" },
              { icon: CheckCircle2, label: "Decisions leave a visible history" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5">
                  <Icon className="size-4 shrink-0 text-teal-700 dark:text-teal-300" />
                  <span className="text-[11.5px] text-muted-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section id="security" className="scroll-mt-24 border-y border-border bg-sidebar text-sidebar-foreground">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/90">
                Honest by design
              </span>
              <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-white sm:text-[36px]">
                A demo you can trust to be a demo.
              </h2>
              <p className="mt-3 max-w-lg text-[13.5px] leading-relaxed text-sidebar-muted">
                This build is a complete frontend prototype. Data lives in your browser, file
                binaries are never uploaded, and authentication is explicitly local. When the
                FastAPI service arrives, the API layer is ready to swap.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: ShieldCheck, title: "Local-first demo", detail: "localStorage-backed workspace" },
                  { icon: Database, title: "Portable data", detail: "JSON export of everything" },
                  { icon: CheckCircle2, title: "Swappable services", detail: "Feature APIs isolate the mock transport" },
                  { icon: Users, title: "Real interactions", detail: "Create, edit, filter, and persist" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-3">
                      <Icon className="size-4 text-teal-300" />
                      <p className="mt-2 text-[11.5px] font-medium text-white">{item.title}</p>
                      <p className="text-[10.5px] text-sidebar-muted">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                    <Quote className="size-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-white">Dr. Maya Chen</p>
                    <p className="text-[10px] text-sidebar-muted">Northlight Cognition Lab</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <blockquote className="mt-5 text-[16px] leading-relaxed text-white/90">
                “The thing I didn’t expect was how much calmer the lab became. Everyone can see
                what exists, what’s next, and why. The tools stopped competing with the science.”
              </blockquote>
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-5">
                {[
                  { value: "6", label: "active projects" },
                  { value: "38", label: "research documents" },
                  { value: "16", label: "recent events" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[20px] font-semibold tracking-tight text-white">{stat.value}</p>
                    <p className="text-[10px] text-sidebar-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-raised sm:px-12">
            <div
              className="pointer-events-none absolute inset-0 bg-radial-fade"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto mb-5 flex -space-x-2">
                {[
                  { initials: "MC", color: "#0D9488" },
                  { initials: "AR", color: "#6366F1" },
                  { initials: "LF", color: "#D97706" },
                  { initials: "PN", color: "#DB2777" },
                ].map((person) => (
                  <Avatar key={person.initials} className="size-8 ring-2 ring-card">
                    <AvatarFallback
                      style={{ backgroundColor: person.color }}
                      className="text-[9px] font-semibold text-white"
                    >
                      {person.initials}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] sm:text-[34px]">
                Give your research the system it deserves.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground">
                Start with a populated demo lab or build your own workspace. Everything is
                explorable, editable, and saved locally.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link to="/register">
                    Create your workspace <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                  <Link to="/login">Open the demo</Link>
                </Button>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] text-muted-foreground">
                <ShieldCheck className="size-3" /> No server, no tracking, no credit card.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <Logo />
              <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
                A research operating system for teams who need their projects, evidence, and
                decisions to stay connected.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-12 gap-y-6 sm:grid-cols-3">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Product
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[12px]">
                  <li><a href="#features" className="text-muted-foreground hover:text-foreground">Features</a></li>
                  <li><a href="#modules" className="text-muted-foreground hover:text-foreground">Research suite</a></li>
                  <li><a href="#workflow" className="text-muted-foreground hover:text-foreground">Workflow</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Workspace
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[12px]">
                  <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link></li>
                  <li><Link to="/register" className="text-muted-foreground hover:text-foreground">Create account</Link></li>
                  <li><a href="#security" className="text-muted-foreground hover:text-foreground">Data & demo</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[12px] text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500" /> Frontend complete
                  </li>
                  <li>FastAPI integration pending</li>
                  <li>Local demo build</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-border pt-5 text-[10.5px] text-muted-foreground sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} ResearchOS. A frontend research prototype.</p>
            <p className="flex items-center gap-1.5">
              <ChevronRight className="size-3" /> All data stays in this browser.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
