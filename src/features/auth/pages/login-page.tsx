import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "../api";
import { AuthLayout } from "../components/auth-layout";

const DEMO_EMAIL = "maya.chen@northlight.edu";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((state) => state.signIn);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const onboardingComplete = useAuthStore((state) => state.onboardingComplete);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);

  const fromState = (
    location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
  )?.from;
  const from = fromState?.pathname
    ? `${fromState.pathname}${fromState.search ?? ""}${fromState.hash ?? ""}`
    : "/app";

  const finish = (session: Awaited<ReturnType<typeof authApi.login>>) => {
    signIn(session);
    navigate(onboardingComplete ? from : "/onboarding", { replace: true });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (password.length < 6) next.password = "Enter at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const session = await authApi.login({ email: email.trim(), password });
      finish(session);
    } catch {
      toast.error("Could not sign in to the demo");
    } finally {
      setPending(false);
    }
  };

  const enterDemo = async () => {
    setPending(true);
    try {
      const session = await authApi.login({ email: DEMO_EMAIL, password: "demo-workspace" });
      signIn(session);
      completeOnboarding();
      toast.success("Demo workspace unlocked", {
        description: "You are exploring locally seeded research data.",
      });
      navigate("/app", { replace: true });
    } catch {
      toast.error("Could not open the demo workspace");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue your research. This prototype runs entirely in your browser."
      footer={
        <p className="text-center text-[12.5px] text-muted-foreground">
          New to ResearchOS?{" "}
          <Link to="/register" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email address</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@institution.edu"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: undefined }));
            }}
            aria-invalid={Boolean(errors.email)}
            disabled={pending}
            autoFocus
          />
          {errors.email && (
            <p className="text-[11px] font-medium text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button
              type="button"
              onClick={() =>
                toast.info("Password reset is unavailable", {
                  description:
                    "Demo authentication runs locally and stores no credentials. Use the demo workspace or any valid email.",
                })
              }
              className="text-[11px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              aria-invalid={Boolean(errors.password)}
              disabled={pending}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-medium text-destructive">{errors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="rounded-xl border border-teal-200/70 bg-teal-50/60 p-4 dark:border-teal-500/20 dark:bg-teal-500/5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-teal-900 dark:text-teal-200">
              Explore the seeded demo
            </p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-teal-800/80 dark:text-teal-300/80">
              Jump into a populated lab workspace with six projects, notebooks, papers, and
              realistic activity. No setup needed.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full border-teal-300 bg-white text-teal-800 hover:bg-teal-50 dark:border-teal-500/30 dark:bg-transparent dark:text-teal-200 dark:hover:bg-teal-500/10"
          onClick={enterDemo}
          disabled={pending}
        >
          Open demo workspace <ArrowRight className="size-3.5" />
        </Button>
        <p className="mt-2 text-center text-[10px] text-teal-800/70 dark:text-teal-300/70">
          Demo account: {DEMO_EMAIL}
        </p>
      </div>
    </AuthLayout>
  );
}
