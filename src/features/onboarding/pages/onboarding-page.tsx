import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FolderKanban,
  Library,
  Loader2,
  Monitor,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { queryKeys } from "@/lib/query-keys";
import { researchFields } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore, type ThemeMode } from "@/store/ui-store";
import type { AppPreferences, UserProfile, Workspace } from "@/types";
import { settingsApi } from "@/features/settings/api";

const stepMeta = [
  { title: "Profile", description: "How you appear in the lab" },
  { title: "Workspace", description: "Your shared research home" },
  { title: "Research focus", description: "What you study" },
  { title: "Interface", description: "Make it feel like yours" },
  { title: "Ready", description: "Enter your workspace" },
];

function OnboardingFlow({
  profile,
  workspace,
  preferences,
}: {
  profile: UserProfile;
  workspace: Workspace;
  preferences: AppPreferences;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(
    session?.name && session.name !== profile.name ? session.name : profile.name,
  );
  const [role, setRole] = useState(profile.role);
  const [institution, setInstitution] = useState(profile.institution);
  const [field, setField] = useState(profile.field);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [workspaceDescription, setWorkspaceDescription] = useState(workspace.description);
  const [density, setDensity] = useState<AppPreferences["density"]>(preferences.density);

  const finish = useMutation({
    mutationFn: async () => {
      await settingsApi.updateProfile({
        name: name.trim(),
        email: profile.email,
        role: role.trim(),
        institution: institution.trim(),
        field,
        bio: profile.bio,
        timezone: profile.timezone,
        avatarColor: profile.avatarColor,
      });
      await settingsApi.updateWorkspace({
        name: workspaceName.trim(),
        description: workspaceDescription.trim(),
        plan: workspace.plan,
      });
      await settingsApi.updatePreferences({ theme, density });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      void queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      completeOnboarding();
      navigate("/app", { replace: true });
      toast.success("Your workspace is ready", {
        description: "The demo lab is populated with sample projects and research material.",
      });
    },
    onError: () => toast.error("Could not finish setup"),
  });

  const next = () => {
    setError(null);
    if (step === 0) {
      if (name.trim().length < 2) return setError("Enter your full name.");
      if (!role.trim()) return setError("Add your role or title.");
      if (!institution.trim()) return setError("Add your institution or lab.");
    }
    if (step === 1 && workspaceName.trim().length < 2) {
      return setError("Give your workspace a name.");
    }
    if (step === 2 && !field) return setError("Choose a research field.");
    setStep((current) => Math.min(current + 1, stepMeta.length - 1));
  };

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-radial-fade"
        aria-hidden="true"
      />
      <header className="relative flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              completeOnboarding();
              navigate("/app", { replace: true });
            }}
          >
            Skip setup
          </Button>
        </div>
      </header>

      <main className="relative flex flex-1 items-start justify-center px-4 pb-12 pt-2 sm:px-6 lg:pt-8">
        <div className="w-full max-w-3xl">
          <div className="mb-6">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium uppercase tracking-[0.12em]">
                Step {step + 1} of {stepMeta.length}
              </span>
              <span>{stepMeta[step].description}</span>
            </div>
            <Progress value={((step + 1) / stepMeta.length) * 100} className="mt-2 h-1.5" />
            <div className="mt-4 hidden items-center justify-between sm:flex">
              {stepMeta.map((item, index) => (
                <div key={item.title} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full border text-[10.5px] font-semibold transition-colors",
                      index < step
                        ? "border-teal-600 bg-teal-600 text-white"
                        : index === step
                          ? "border-teal-600 bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                          : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {index < step ? <Check className="size-3" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[11.5px] font-medium",
                      index === step ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-raised">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="p-6 sm:p-8"
              >
                {step === 0 && (
                  <div className="space-y-5">
                    <div>
                      <span className="eyebrow">Welcome</span>
                      <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.03em]">
                        Let’s set up your research profile.
                      </h1>
                      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
                        This is how collaborators will recognise you across projects, notebooks,
                        and shared collections.
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="onboarding-name">Full name</Label>
                        <Input
                          id="onboarding-name"
                          value={name}
                          onChange={(event) => {
                            setName(event.target.value);
                            setError(null);
                          }}
                          placeholder="Dr. Maya Chen"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="onboarding-role">Role / title</Label>
                        <Input
                          id="onboarding-role"
                          value={role}
                          onChange={(event) => {
                            setRole(event.target.value);
                            setError(null);
                          }}
                          placeholder="Principal Investigator"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="onboarding-institution">Institution</Label>
                        <Input
                          id="onboarding-institution"
                          value={institution}
                          onChange={(event) => {
                            setInstitution(event.target.value);
                            setError(null);
                          }}
                          placeholder="Northlight Institute"
                        />
                      </div>
                    </div>
                    <p className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      Your email <span className="font-medium text-foreground">{profile.email}</span>{" "}
                      stays local to this demo and is never sent to a server.
                    </p>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <span className="eyebrow">Workspace</span>
                      <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.03em]">
                        Name your shared research home.
                      </h1>
                      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
                        A workspace holds every project, dataset, and note for your lab or
                        program.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="onboarding-workspace">Workspace name</Label>
                        <Input
                          id="onboarding-workspace"
                          value={workspaceName}
                          onChange={(event) => {
                            setWorkspaceName(event.target.value);
                            setError(null);
                          }}
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="onboarding-workspace-description">Description</Label>
                        <Textarea
                          id="onboarding-workspace-description"
                          rows={3}
                          value={workspaceDescription}
                          onChange={(event) => setWorkspaceDescription(event.target.value)}
                          placeholder="A sentence about your lab or research program."
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        <Users className="size-4" />
                      </span>
                      <div>
                        <p className="text-[12px] font-medium">Invite collaborators later</p>
                        <p className="text-[11px] text-muted-foreground">
                          Team invitations are not connected in this frontend demo.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div>
                      <span className="eyebrow">Research focus</span>
                      <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.03em]">
                        What does your work revolve around?
                      </h1>
                      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
                        We use this to describe your profile. It does not filter or limit the demo
                        data.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {researchFields.map((option) => {
                        const active = field === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              setField(option);
                              setError(null);
                            }}
                            aria-pressed={active}
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left text-[12.5px] transition-colors",
                              active
                                ? "border-teal-500 bg-teal-50/70 font-medium text-teal-900 dark:bg-teal-500/10 dark:text-teal-200"
                                : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                            )}
                          >
                            {option}
                            {active && <Check className="size-3.5 text-teal-700 dark:text-teal-300" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <span className="eyebrow">Interface</span>
                      <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.03em]">
                        Make the workspace comfortable.
                      </h1>
                      <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
                        Both choices apply immediately and are saved in this browser.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        const active = theme === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setTheme(option.value)}
                            aria-pressed={active}
                            className={cn(
                              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                              active
                                ? "border-teal-500 bg-teal-50/60 ring-1 ring-teal-500 dark:bg-teal-500/10"
                                : "border-border hover:border-navy-300 dark:hover:border-navy-500",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4",
                                active ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground",
                              )}
                            />
                            <span className="text-[12.5px] font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <Label className="mb-2 block">Density</Label>
                      <div className="inline-flex rounded-lg border border-border bg-muted p-0.5">
                        {(["comfortable", "compact"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setDensity(value)}
                            aria-pressed={density === value}
                            className={cn(
                              "rounded-md px-3.5 py-1.5 text-[12px] font-medium capitalize transition-colors",
                              density === value
                                ? "bg-card text-foreground shadow-subtle"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        <Sparkles className="size-5" />
                      </span>
                      <div>
                        <span className="eyebrow">All set</span>
                        <h1 className="text-[25px] font-semibold tracking-[-0.03em]">
                          Your research home is ready.
                        </h1>
                      </div>
                    </div>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      We’ll open{" "}
                      <span className="font-medium text-foreground">{workspaceName}</span> with
                      seeded demo material so every corner of the product is explorable.
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { icon: FolderKanban, title: "Six research projects", detail: "Active, planning, on hold, complete" },
                        { icon: NotebookPen, title: "Lab notebooks", detail: "Rich entries with citations" },
                        { icon: Library, title: "Paper library", detail: "Reading status, notes, BibTeX import" },
                        { icon: Users, title: "Collaborators", detail: "Task owners and shared activity" },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.title}
                            className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5"
                          >
                            <Icon className="mt-0.5 size-4 shrink-0 text-teal-700 dark:text-teal-300" />
                            <div>
                              <p className="text-[12px] font-medium">{item.title}</p>
                              <p className="text-[10.5px] text-muted-foreground">{item.detail}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rounded-lg border border-border px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
                      <CheckCircle2 className="mr-1 inline size-3.5 text-teal-600 dark:text-teal-400" />
                      Saved to this browser: profile, workspace, theme, and density. Everything can
                      be changed later in Settings.
                    </div>
                  </div>
                )}

                {error && (
                  <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-[11.5px] font-medium text-destructive">
                    {error}
                  </p>
                )}

                <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
                  <Button
                    variant="ghost"
                    onClick={() => setStep((current) => Math.max(current - 1, 0))}
                    disabled={step === 0 || finish.isPending}
                    className={cn(step === 0 && "invisible")}
                  >
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  {step < stepMeta.length - 1 ? (
                    <Button onClick={next}>
                      Continue <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button onClick={() => finish.mutate()} disabled={finish.isPending}>
                      {finish.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                      Enter workspace
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-4 text-center text-[10.5px] text-muted-foreground">
            Everything here runs locally. No account, credential, or research data leaves this
            browser.
          </p>
        </div>
      </main>
    </div>
  );
}

export function OnboardingPage() {
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

  if (!profile || !workspace || !preferences) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Logo />
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-[12px] text-muted-foreground">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingFlow profile={profile} workspace={workspace} preferences={preferences} />
  );
}
