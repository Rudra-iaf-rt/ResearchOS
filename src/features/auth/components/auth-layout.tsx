import { Link } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AuthLayout({
  children,
  title,
  description,
  footer,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[44%] max-w-[560px] flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-12">
        <div className="absolute inset-0 bg-grid opacity-[0.18]" aria-hidden="true" />
        <div
          className="absolute -right-24 -top-24 size-[420px] rounded-full bg-teal-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -left-20 size-[380px] rounded-full bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <Link to="/" aria-label="ResearchOS home" className="inline-flex rounded-md">
            <Logo inverted />
          </Link>
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/90">
            The research operating system
          </p>
          <h2 className="mt-4 text-[30px] font-semibold leading-[1.15] tracking-[-0.03em] text-white xl:text-[34px]">
            From scattered notes to a coherent research program.
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-sidebar-muted">
            Projects, tasks, milestones, notebooks, papers, and files in one calm, connected
            workspace built for serious research.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Connect every experiment to its project and paper trail",
              "Write in a distraction-free editor with citation support",
              "Keep deadlines, milestones, and collaborators in step",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-white/80">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-300">
                  <Check className="size-2.5" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
          <p className="text-[12px] leading-relaxed text-white/75">
            “We stopped losing the thread between experiments, drafts, and data. ResearchOS
            became the lab’s shared memory.”
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
              MC
            </span>
            <div>
              <p className="text-[11.5px] font-medium text-white">Dr. Maya Chen</p>
              <p className="text-[10.5px] text-sidebar-muted">
                Principal Investigator, Northlight Cognition Lab
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="relative flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className="w-full max-w-[400px]">
            <div className="mb-6 lg:hidden">
              <Logo />
            </div>
            <div className="mb-7">
              <h1 className="text-[24px] font-semibold tracking-[-0.025em]">{title}</h1>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 px-5 pb-6 text-[10.5px] text-muted-foreground">
          <ShieldCheck className="size-3" />
          Local demo — sessions stay in this browser. No credentials are sent anywhere.
        </div>
      </div>
    </div>
  );
}
