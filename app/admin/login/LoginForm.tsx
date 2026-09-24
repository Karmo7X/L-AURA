"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { signIn, type LoginState } from "../actions";
import { field, fieldLabel, primaryButton } from "../styles";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-6 grid gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="grid gap-1.5">
        <span className={fieldLabel}>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state.email}
          className={field}
        />
      </label>
      <label className="grid gap-1.5">
        <span className={fieldLabel}>Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>

      {state.message && (
        <p role="alert" className="rounded-lg bg-terracotta/10 px-3 py-2 text-[13px] text-amber-deep">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
