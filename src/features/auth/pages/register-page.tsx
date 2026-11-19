import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "../api";
import { AuthLayout } from "../components/auth-layout";

interface FormState {
  name: string;
  institution: string;
  email: string;
  password: string;
  confirm: string;
}

const initialForm: FormState = {
  name: "",
  institution: "",
  email: "",
  password: "",
  confirm: "",
};

export function RegisterPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const resetOnboarding = useAuthStore((state) => state.resetOnboarding);

  const [form, setForm] = useState<FormState>(initialForm);
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "terms", string>>>({});
  const [pending, setPending] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Partial<Record<keyof FormState | "terms", string>> = {};
    if (form.name.trim().length < 2) next.name = "Enter your full name.";
    if (form.institution.trim().length < 2) next.institution = "Add your institution or lab.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) next.confirm = "Passwords do not match.";
    if (!accepted) next.terms = "Acknowledge the demo note to continue.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      const session = await authApi.register({
        name: form.name.trim(),
        institution: form.institution.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      resetOnboarding();
      signIn(session);
      toast.success("Account created", {
        description: "A few quick questions will tailor your demo workspace.",
      });
      navigate("/onboarding", { replace: true });
    } catch {
      toast.error("Could not create the demo account");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthLayout
      title="Create your workspace"
      description="Set up a local research workspace in under a minute. No email verification required in this demo."
      footer={
        <p className="text-center text-[12.5px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-teal-700 hover:underline dark:text-teal-300">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              autoComplete="name"
              placeholder="Dr. Ada Lovelace"
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              aria-invalid={Boolean(errors.name)}
              disabled={pending}
              autoFocus
            />
            {errors.name && (
              <p className="text-[11px] font-medium text-destructive">{errors.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="register-institution">Institution</Label>
            <Input
              id="register-institution"
              autoComplete="organization"
              placeholder="Research institute or lab"
              value={form.institution}
              onChange={(event) => update("institution", event.target.value)}
              aria-invalid={Boolean(errors.institution)}
              disabled={pending}
            />
            {errors.institution && (
              <p className="text-[11px] font-medium text-destructive">{errors.institution}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-email">Email address</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@institution.edu"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            disabled={pending}
          />
          {errors.email && (
            <p className="text-[11px] font-medium text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
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

        <div className="space-y-1.5">
          <Label htmlFor="register-confirm">Confirm password</Label>
          <Input
            id="register-confirm"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={form.confirm}
            onChange={(event) => update("confirm", event.target.value)}
            aria-invalid={Boolean(errors.confirm)}
            disabled={pending}
          />
          {errors.confirm && (
            <p className="text-[11px] font-medium text-destructive">{errors.confirm}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="register-terms" className="flex cursor-pointer items-start gap-2.5">
            <Checkbox
              id="register-terms"
              checked={accepted}
              onCheckedChange={(value) => {
                setAccepted(value === true);
                setErrors((current) => ({ ...current, terms: undefined }));
              }}
              className="mt-0.5"
              disabled={pending}
            />
            <span className="text-[11.5px] leading-relaxed text-muted-foreground">
              I understand this is a frontend demo. My account and workspace data stay in this
              browser and no credentials are stored.
            </span>
          </label>
          {errors.terms && (
            <p className="text-[11px] font-medium text-destructive">{errors.terms}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
