import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  Building2,
  Check,
  Database,
  Download,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { downloadBlob, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore, type ThemeMode } from "@/store/ui-store";
import type {
  AppPreferences,
  NotificationPreferences,
  UserProfile,
  Workspace,
} from "@/types";
import {
  settingsApi,
  type ProfileInput,
  type WorkspaceInput,
} from "../api";

const tabs = [
  { value: "profile", label: "Profile", icon: UserRound },
  { value: "workspace", label: "Workspace", icon: Building2 },
  { value: "appearance", label: "Appearance", icon: Palette },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "security", label: "Security", icon: ShieldCheck },
  { value: "data", label: "Data & export", icon: Database },
] as const;

type TabValue = (typeof tabs)[number]["value"];

const avatarColors = [
  { value: "#0D9488", label: "Teal" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#D97706", label: "Amber" },
  { value: "#DB2777", label: "Rose" },
  { value: "#0284C7", label: "Sky" },
  { value: "#7C3AED", label: "Violet" },
];

const timezones = [
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ProfileSection({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileInput>({
    name: profile.name,
    email: profile.email,
    role: profile.role,
    institution: profile.institution,
    field: profile.field,
    bio: profile.bio,
    timezone: profile.timezone,
    avatarColor: profile.avatarColor,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInput, string>>>({});

  useEffect(() => {
    setForm({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      institution: profile.institution,
      field: profile.field,
      bio: profile.bio,
      timezone: profile.timezone,
      avatarColor: profile.avatarColor,
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: (input: ProfileInput) => settingsApi.updateProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Profile updated", {
        description: "Your changes are saved in this local demo workspace.",
      });
    },
    onError: () => toast.error("Could not save your profile"),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof ProfileInput, string>> = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!form.role.trim()) next.role = "Add your role or title.";
    if (!form.institution.trim()) next.institution = "Add your institution.";
    if (!form.field.trim()) next.field = "Add your research field.";
    if (form.bio.length > 600) next.bio = "Keep your bio under 600 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    save.mutate({ ...form, name: form.name.trim(), email: form.email.trim() });
  };

  const update = (key: keyof ProfileInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <SectionCard
        title="Public profile"
        description="How you appear across this workspace and on shared research artifacts."
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <Avatar className="size-16 ring-4 ring-background">
              <AvatarFallback
                style={{ backgroundColor: form.avatarColor }}
                className="text-lg font-semibold text-white"
              >
                {initialsOf(form.name) || "MC"}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground">Avatar preview</span>
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="profile-name" error={errors.name}>
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  disabled={save.isPending}
                />
              </Field>
              <Field label="Email address" htmlFor="profile-email" error={errors.email}>
                <Input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  disabled={save.isPending}
                />
              </Field>
              <Field label="Role / title" htmlFor="profile-role" error={errors.role}>
                <Input
                  id="profile-role"
                  value={form.role}
                  onChange={(event) => update("role", event.target.value)}
                  disabled={save.isPending}
                />
              </Field>
              <Field
                label="Institution"
                htmlFor="profile-institution"
                error={errors.institution}
              >
                <Input
                  id="profile-institution"
                  value={form.institution}
                  onChange={(event) => update("institution", event.target.value)}
                  disabled={save.isPending}
                />
              </Field>
              <Field label="Research field" htmlFor="profile-field" error={errors.field}>
                <Input
                  id="profile-field"
                  value={form.field}
                  onChange={(event) => update("field", event.target.value)}
                  disabled={save.isPending}
                />
              </Field>
              <Field label="Timezone" htmlFor="profile-timezone">
                <Select
                  value={form.timezone}
                  onValueChange={(value) => update("timezone", value)}
                  disabled={save.isPending}
                >
                  <SelectTrigger id="profile-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field
              label="Short bio"
              htmlFor="profile-bio"
              error={errors.bio}
              hint={`${form.bio.length}/600 characters`}
            >
              <Textarea
                id="profile-bio"
                rows={3}
                value={form.bio}
                onChange={(event) => update("bio", event.target.value)}
                disabled={save.isPending}
              />
            </Field>
            <div className="space-y-1.5">
              <Label>Avatar color</Label>
              <div className="flex flex-wrap gap-2">
                {avatarColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => update("avatarColor", color.value)}
                    aria-label={color.label}
                    aria-pressed={form.avatarColor === color.value}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow",
                      form.avatarColor === color.value
                        ? "ring-2 ring-navy-900 dark:ring-teal-400"
                        : "ring-1 ring-black/10 hover:ring-2",
                    )}
                    style={{ backgroundColor: color.value }}
                  >
                    {form.avatarColor === color.value && <Check className="size-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setForm({
              name: profile.name,
              email: profile.email,
              role: profile.role,
              institution: profile.institution,
              field: profile.field,
              bio: profile.bio,
              timezone: profile.timezone,
              avatarColor: profile.avatarColor,
            })
          }
          disabled={save.isPending}
        >
          Reset
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save profile
        </Button>
      </div>
    </form>
  );
}

function WorkspaceSection({ workspace }: { workspace: Workspace }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorkspaceInput>({
    name: workspace.name,
    description: workspace.description,
    plan: workspace.plan,
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (input: WorkspaceInput) => settingsApi.updateWorkspace(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success("Workspace updated");
    },
    onError: () => toast.error("Could not update the workspace"),
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (form.name.trim().length < 2) {
          setError("Enter a workspace name with at least two characters.");
          return;
        }
        setError(null);
        save.mutate({ ...form, name: form.name.trim() });
      }}
      className="space-y-5"
    >
      <SectionCard
        title="Workspace details"
        description="Shown in the sidebar, on shared links, and in exported workspace snapshots."
        action={<Badge variant="secondary">Demo workspace</Badge>}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-1 font-mono">researchos.app/{workspace.slug || "workspace"}</span>
            <span>· created {formatDate(workspace.createdAt)}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
            <Field label="Workspace name" htmlFor="workspace-name" error={error ?? undefined}>
              <Input
                id="workspace-name"
                value={form.name}
                onChange={(event) => {
                  setForm((current) => ({ ...current, name: event.target.value }));
                  setError(null);
                }}
                disabled={save.isPending}
              />
            </Field>
            <Field label="Plan" htmlFor="workspace-plan">
              <Select
                value={form.plan}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    plan: value as Workspace["plan"],
                  }))
                }
                disabled={save.isPending}
              >
                <SelectTrigger id="workspace-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Research Lab">Research Lab</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field
            label="Description"
            htmlFor="workspace-description"
            hint="A sentence about the lab, group, or program."
          >
            <Textarea
              id="workspace-description"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              disabled={save.isPending}
            />
          </Field>
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Plans are labels only in this prototype. No billing or seat management is connected.
          </p>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Save workspace
        </Button>
      </div>
    </form>
  );
}

function AppearanceSection({ preferences }: { preferences: AppPreferences }) {
  const queryClient = useQueryClient();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  const update = useMutation({
    mutationFn: (input: Partial<AppPreferences>) => settingsApi.updatePreferences(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
    },
    onError: () => toast.error("Could not save this preference"),
  });

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun; hint: string }[] = [
    { value: "light", label: "Light", icon: Sun, hint: "Bright surfaces" },
    { value: "dark", label: "Dark", icon: Moon, hint: "Low-light reading" },
    { value: "system", label: "System", icon: Monitor, hint: "Follow your device" },
  ];

  return (
    <div className="space-y-5">
      <SectionCard
        title="Theme"
        description="Applied immediately across every page and stored in this browser."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTheme(option.value);
                  update.mutate({ theme: option.value });
                }}
                aria-pressed={active}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                  active
                    ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 dark:bg-teal-500/10"
                    : "border-border bg-card hover:border-navy-300 dark:hover:border-navy-500",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    active
                      ? "bg-teal-600 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="flex w-full items-center justify-between">
                  <span className="text-[13px] font-medium">{option.label}</span>
                  {active && <Check className="size-3.5 text-teal-700 dark:text-teal-300" />}
                </span>
                <span className="text-[11px] text-muted-foreground">{option.hint}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Layout & motion" description="Tune density and navigation for how you work.">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium">Sidebar navigation</p>
              <p className="text-[11.5px] text-muted-foreground">
                Collapse the sidebar to a compact icon rail.
              </p>
            </div>
            <Switch
              checked={collapsed}
              onCheckedChange={setSidebarCollapsed}
              aria-label="Collapse sidebar"
            />
          </div>

          <div className="h-px bg-border" />

          <div>
            <p className="text-[13px] font-medium">Density</p>
            <p className="mb-2 text-[11.5px] text-muted-foreground">
              A saved preference for future list and table views.
            </p>
            <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
              {(["comfortable", "compact"] as const).map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => update.mutate({ density })}
                  aria-pressed={preferences.density === density}
                  className={cn(
                    "rounded-md px-3 py-1 text-[12px] font-medium capitalize transition-colors",
                    preferences.density === density
                      ? "bg-card text-foreground shadow-subtle"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium">Reduce motion</p>
              <p className="text-[11.5px] text-muted-foreground">
                Minimise transitions and animated page changes.
              </p>
            </div>
            <Switch
              checked={preferences.reduceMotion}
              onCheckedChange={(checked) => update.mutate({ reduceMotion: checked })}
              aria-label="Reduce motion"
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

const notificationOptions: {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}[] = [
  {
    key: "taskAssignments",
    title: "Task assignments",
    description: "When a task is assigned to you or reassigned within your projects.",
  },
  {
    key: "deadlineReminders",
    title: "Deadline reminders",
    description: "A heads-up before task and milestone due dates.",
  },
  {
    key: "mentions",
    title: "Mentions",
    description: "When a collaborator references you in a notebook entry.",
  },
  {
    key: "weeklyDigest",
    title: "Weekly digest",
    description: "A Monday summary of progress, papers, and upcoming deadlines.",
  },
  {
    key: "productUpdates",
    title: "Product updates",
    description: "Occasional notes about new ResearchOS capabilities.",
  },
];

function NotificationsSection({ preferences }: { preferences: AppPreferences }) {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (notifications: NotificationPreferences) =>
      settingsApi.updatePreferences({ notifications }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
    },
    onError: () => toast.error("Could not save notification preferences"),
  });

  return (
    <SectionCard
      title="Notifications"
      description="Choose what this demo workspace would surface in its notification menu."
      action={
        <Badge variant="outline" className="font-normal">
          Demonstration only
        </Badge>
      }
    >
      <div className="divide-y divide-border">
        {notificationOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{option.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                {option.description}
              </p>
            </div>
            <Switch
              checked={preferences.notifications[option.key]}
              disabled={update.isPending}
              onCheckedChange={(checked) =>
                update.mutate({
                  ...preferences.notifications,
                  [option.key]: checked,
                })
              }
              aria-label={option.title}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        These switches save your preferences but do not send email or push notifications. The
        demo workspace has no server-side delivery.
      </p>
    </SectionCard>
  );
}

function SecuritySection() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <div className="space-y-5">
      <SectionCard title="Session" description="This prototype uses a client-side demo session.">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-medium">{session?.email ?? "Demo session"}</p>
              <p className="text-[11px] text-muted-foreground">
                {session
                  ? `Signed in ${formatDate(session.signedInAt, "MMM d, yyyy 'at' h:mm a")}`
                  : "No active session"}
              </p>
            </div>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
          Authentication is intentionally local. No password, token, or credential is stored or
          transmitted. Signing out clears the demo session from this browser.
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              signOut();
              navigate("/");
            }}
          >
            <LogOut className="size-4" />
            Sign out of demo
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Account protection" description="Unavailable in the local prototype.">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password" htmlFor="current-password" hint="Demo mode">
              <Input id="current-password" type="password" placeholder="••••••••" disabled />
            </Field>
            <Field label="New password" htmlFor="new-password" hint="Demo mode">
              <Input id="new-password" type="password" placeholder="••••••••" disabled />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 opacity-70">
            <div>
              <p className="text-[13px] font-medium">Two-factor authentication</p>
              <p className="text-[11.5px] text-muted-foreground">
                Requires a connected identity provider.
              </p>
            </div>
            <Switch checked={false} disabled aria-label="Two-factor authentication" />
          </div>
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Password changes and 2FA need a real authentication backend. They are shown as
            unavailable rather than pretending to save.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

function DataSection() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [resetOpen, setResetOpen] = useState(false);
  const [replayOpen, setReplayOpen] = useState(false);
  const resetOnboarding = useAuthStore((state) => state.resetOnboarding);

  const exportSnapshot = useMutation({
    mutationFn: () => settingsApi.exportSnapshot(),
    onSuccess: (snapshot) => {
      downloadBlob(
        snapshot,
        `researchos-workspace-${formatDate(new Date(), "yyyy-MM-dd")}.json`,
        "application/json",
      );
      toast.success("Workspace snapshot exported", {
        description: "A JSON file was generated from this browser's demo data.",
      });
    },
    onError: () => toast.error("Could not export the workspace"),
  });

  return (
    <div className="space-y-5">
      <SectionCard
        title="Export workspace"
        description="Download a JSON snapshot of everything stored in this demo workspace."
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-4 py-3">
          <div>
            <p className="text-[12.5px] font-medium">Full data export</p>
            <p className="text-[11px] text-muted-foreground">
              Projects, tasks, milestones, notebooks, papers, files metadata, activity,
              preferences, and profile.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => exportSnapshot.mutate()}
            disabled={exportSnapshot.isPending}
          >
            {exportSnapshot.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export JSON
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Local demo storage" description="Where this prototype keeps your changes.">
        <ul className="space-y-2.5 text-[12px] leading-relaxed text-muted-foreground">
          <li className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            Research data is stored under <code className="rounded bg-muted px-1 py-0.5 text-[11px]">researchos.demo.db.v1</code> in localStorage.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            Your demo session and interface preferences are stored separately in this browser.
          </li>
          <li className="flex gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            No research content is sent to a server. Uploaded file binaries are never stored.
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Reset & replay"
        description="Restore the original sample data or walk through onboarding again."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-[12.5px] font-medium">Replay onboarding</p>
              <p className="text-[11px] text-muted-foreground">
                Revisit the five setup steps without changing your data.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setReplayOpen(true)}>
              <RotateCcw className="size-3.5" /> Replay
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <div>
              <p className="text-[12.5px] font-medium text-destructive">Reset demo data</p>
              <p className="text-[11px] text-muted-foreground">
                Restore the seeded projects, tasks, notebooks, papers, and files. This discards
                every change you have made.
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setResetOpen(true)}>
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all demo data?"
        description="Every project, task, notebook, paper, file record, and activity event you created will be replaced with the original sample workspace. This cannot be undone."
        confirmLabel="Reset workspace"
        onConfirm={async () => {
          await settingsApi.resetDemoData();
          queryClient.clear();
          window.location.assign("/app");
        }}
      />

      <ConfirmDialog
        open={replayOpen}
        onOpenChange={setReplayOpen}
        destructive={false}
        title="Replay onboarding?"
        description="You will be taken through the five setup steps again. Your workspace data will stay exactly as it is."
        confirmLabel="Start onboarding"
        onConfirm={() => {
          resetOnboarding();
          navigate("/onboarding");
        }}
      />
    </div>
  );
}

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab") as TabValue | null;
  const tab: TabValue = tabs.some((item) => item.value === requested) ? (requested as TabValue) : "profile";

  const { data: profile } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: settingsApi.profile,
  });
  const { data: workspace } = useQuery({
    queryKey: queryKeys.workspace,
    queryFn: settingsApi.workspace,
  });
  const { data: preferences } = useQuery({
    queryKey: queryKeys.preferences,
    queryFn: settingsApi.preferences,
  });

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "profile") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your research identity, workspace, appearance, and local demo data."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-muted p-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value} className="gap-1.5 px-3 py-1.5">
                  <Icon className="size-3.5" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="profile">
          {profile ? (
            <ProfileSection profile={profile} />
          ) : (
            <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
          )}
        </TabsContent>
        <TabsContent value="workspace">
          {workspace ? (
            <WorkspaceSection workspace={workspace} />
          ) : (
            <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
          )}
        </TabsContent>
        <TabsContent value="appearance">
          {preferences ? (
            <AppearanceSection preferences={preferences} />
          ) : (
            <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
          )}
        </TabsContent>
        <TabsContent value="notifications">
          {preferences ? (
            <NotificationsSection preferences={preferences} />
          ) : (
            <div className="h-72 animate-pulse rounded-xl border border-border bg-card" />
          )}
        </TabsContent>
        <TabsContent value="security">
          <SecuritySection />
        </TabsContent>
        <TabsContent value="data">
          <DataSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
