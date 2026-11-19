import { Toaster as Sonner } from "sonner";
import { useUiStore } from "@/store/ui-store";

export function Toaster() {
  const theme = useUiStore((state) => state.theme);

  return (
    <Sonner
      theme={theme === "system" ? "system" : theme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-modal !text-[13px]",
          description: "!text-muted-foreground !text-[12px]",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
        },
      }}
    />
  );
}
