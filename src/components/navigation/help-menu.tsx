import { useState } from "react";
import { Command, HelpCircle, Keyboard, LifeBuoy, Microscope, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateDialogs } from "@/components/navigation/create-dialogs-provider";
import { useUiStore } from "@/store/ui-store";

const shortcuts = [
  { keys: ["Ctrl", "K"], label: "Open global search" },
  { keys: ["C"], label: "Quick capture research activity" },
  { keys: ["Esc"], label: "Close a dialog or palette" },
  { keys: ["↑", "↓"], label: "Move through search results" },
  { keys: ["Enter"], label: "Open the selected result" },
  { keys: ["Tab"], label: "Move between form fields" },
];

export function HelpMenu() {
  const [open, setOpen] = useState(false);
  const setCommandOpen = useUiStore((state) => state.setCommandOpen);
  const { openCreate } = useCreateDialogs();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        aria-label="Help and keyboard shortcuts"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="size-[17px]" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Help & shortcuts</DialogTitle>
            <DialogDescription>
              Quick ways to move around ResearchOS. Everything here runs against a local demo
              dataset in your browser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-teal-700 shadow-subtle dark:text-teal-300">
                  <Search className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">Search everything</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    Projects, tasks, notebooks, papers, and files in one palette.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-[11px]"
                    onClick={() => {
                      setOpen(false);
                      setCommandOpen(true);
                    }}
                  >
                    <Command className="size-3.5" />
                    Open command palette
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-2 h-7 text-[11px]"
                    onClick={() => {
                      setOpen(false);
                      openCreate("log");
                    }}
                  >
                    <Microscope className="size-3.5" />
                    Quick capture
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <Keyboard className="size-3.5" /> Keyboard
              </p>
              <ul className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <li
                    key={shortcut.label}
                    className="flex items-center justify-between text-[12.5px]"
                  >
                    <span className="text-muted-foreground">{shortcut.label}</span>
                    <span className="flex gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="min-w-[20px] rounded border border-border bg-muted px-1.5 py-0.5 text-center text-[10px] font-medium"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 border-t border-border pt-3 text-[11.5px] text-muted-foreground">
              <LifeBuoy className="size-3.5" />
              Demo data lives only in this browser. Reset it any time from Settings → Data.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
