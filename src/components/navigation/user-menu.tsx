import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";
import { settingsApi } from "@/features/settings/api";

export function UserMenu() {
  const navigate = useNavigate();
  const signOut = useAuthStore((state) => state.signOut);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const { data: profile } = useQuery({
    queryKey: queryKeys.profile,
    queryFn: settingsApi.profile,
  });

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open profile menu"
        >
          <Avatar className="size-8">
            <AvatarFallback
              style={{ backgroundColor: profile?.avatarColor ?? "#0D9488" }}
              className="text-[11px] font-semibold text-white"
            >
              {profile?.initials ?? "MC"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block text-[13px] font-semibold text-foreground">
            {profile?.name ?? "Dr. Maya Chen"}
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
            {profile?.email ?? "maya.chen@northlight.edu"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/app/settings?tab=profile")}>
          <UserRound />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate("/app/settings")}>
          <Settings />
          Workspace settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        {themes.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.value}
              onSelect={() => setTheme(item.value)}
              className="justify-between"
            >
              <span className="flex items-center gap-2.5">
                <Icon />
                {item.label}
              </span>
              {theme === item.value && (
                <span className="size-1.5 rounded-full bg-teal-500" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={() => {
            signOut();
            navigate("/");
          }}
        >
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
