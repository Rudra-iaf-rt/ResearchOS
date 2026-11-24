import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ExperimentRun } from "@/types";

interface ReproduceDialogProps {
  run: ExperimentRun | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Reproduction is intentionally a mock. This dialog explains exactly what is
 * not happening instead of pretending a computation was dispatched.
 */
export function ReproduceDialog({ run, onOpenChange }: ReproduceDialogProps) {
  return (
    <Dialog open={Boolean(run)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reproduce run {run?.runNumber}</DialogTitle>
          <DialogDescription>
            Reproduction is a mock operation in this demo workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>
            ResearchOS has recorded the parameter snapshot, logs, and artifacts for{" "}
            <span className="font-medium text-foreground">{run?.label}</span>, so the run is
            fully auditable.
          </p>
          <p>
            No computation is executed, no worker is queued, and no new run is created by
            this dialog. Use <span className="font-medium text-foreground">New run</span> to
            queue a run that snapshots the experiment’s current parameters.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
