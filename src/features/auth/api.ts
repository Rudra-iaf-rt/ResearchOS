import { wait, readDb } from "@/services/mock/client";
import type { DemoSession } from "@/store/auth-store";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  institution: string;
}

/**
 * Client-side demo authentication. It intentionally does not issue tokens or
 * contact a server; the session only unlocks the local prototype workspace.
 */
export const authApi = {
  async login(input: LoginInput): Promise<DemoSession> {
    await wait(320);
    const user = await readDb((db) => db.user);
    const isDemoAccount = input.email.toLowerCase() === user.email.toLowerCase();
    const name = isDemoAccount
      ? user.name
      : input.email
          .split("@")[0]
          .split(/[._-]/)
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase() + part.slice(1))
          .join(" ");
    return {
      name,
      email: input.email,
      signedInAt: new Date().toISOString(),
    };
  },

  async register(input: RegisterInput): Promise<DemoSession> {
    await wait(400);
    return {
      name: input.name,
      email: input.email,
      signedInAt: new Date().toISOString(),
    };
  },
};
