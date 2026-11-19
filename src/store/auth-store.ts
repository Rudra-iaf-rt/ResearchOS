import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DemoSession {
  name: string;
  email: string;
  signedInAt: string;
}

interface AuthState {
  session: DemoSession | null;
  onboardingComplete: boolean;
  signIn: (session: DemoSession) => void;
  signOut: () => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      onboardingComplete: false,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      resetOnboarding: () => set({ onboardingComplete: false }),
    }),
    { name: "researchos.session.v1" },
  ),
);
