import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut, Timer, UserRound } from "lucide-react";
import { ApiError, apiPost } from "@/lib/api";
import { beginSession, endSession } from "@/lib/session";
import type { LoginRequest, User } from "@/types/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function errorText(e: unknown): string {
  if (e instanceof ApiError) {
    const d = (e.body as { detail?: unknown } | null)?.detail;
    if (typeof d === "string") return d;
    if (e.status === 422) return "Username: 3–20 letters/numbers. PIN: 4–6 digits.";
  }
  return "Couldn't sign in — check your connection and try again.";
}

function SignInForm() {
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const login = useMutation({
    mutationFn: (body: LoginRequest) => apiPost<User>("/auth/login", body),
    onSuccess: (u) => {
      beginSession();
      qc.setQueryData(["me"], u);
    },
  });
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate({ username: username.trim(), pin });
      }}
      data-testid="signin-form"
    >
      <div className="min-w-0 flex-1">
        <label htmlFor="player-username" className="mb-1 block text-xs font-medium text-[#475569]">Username</label>
        <Input
          id="player-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={20}
          autoComplete="username"
          placeholder="e.g. SparkyJoe"
          className="h-10 bg-white"
          data-testid="signin-username-input"
        />
      </div>
      <div className="sm:w-28">
        <label htmlFor="player-pin" className="mb-1 block text-xs font-medium text-[#475569]">PIN (4–6 digits)</label>
        <Input
          id="player-pin"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          autoComplete="current-password"
          className="h-10 bg-white"
          data-testid="signin-pin-input"
        />
      </div>
      <Button
        type="submit"
        className="h-10 bg-[#1E3A8A] px-5 text-white transition-[background-color,transform] duration-150 hover:bg-[#1D4ED8] active:scale-[0.98]"
        disabled={login.isPending || username.trim().length < 3 || pin.length < 4}
        data-testid="signin-submit-button"
      >
        Play
      </Button>
      {login.isError && (
        <p className="text-sm text-[#B91C1C] sm:basis-full" role="alert" data-testid="signin-error">
          {errorText(login.error)}
        </p>
      )}
    </form>
  );
}

interface Props {
  user: User | null | undefined;
  clock: string;
  clockNote: string;
  pointsPerBox: number | null;
}

export default function PlayerBar({ user, clock, clockNote, pointsPerBox }: Props) {
  return (
    <section
      className="mb-4 rounded-sm border border-[#CBD5E1] bg-white px-4 py-3 font-sans shadow-[0_1px_0_#CBD5E1] sm:px-5"
      data-testid="player-bar"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          {user ? (
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-[#1E3A8A]" />
              <span className="text-sm text-[#475569]">
                Playing as <span className="font-semibold text-[#0F172A]" data-testid="player-username">{user.username}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => endSession("/")} data-testid="signout-button">
                <LogOut /> Sign out
              </Button>
            </div>
          ) : (
            <>
              <p className="mb-2 text-sm text-[#475569]">
                Enter a username and PIN to earn leaderboard points. New name? It's created for you.
              </p>
              <SignInForm />
            </>
          )}
        </div>
        <div className="flex items-center gap-3 md:border-l md:border-[#E2E8F0] md:pl-5" data-testid="puzzle-timer">
          <Timer className="size-5 text-[#1E3A8A]" />
          <div>
            <div className="font-mono text-2xl font-semibold tabular-nums text-[#0F172A]" data-testid="puzzle-timer-clock">{clock}</div>
            <div className="text-xs text-[#475569]" data-testid="puzzle-timer-note">
              {pointsPerBox !== null ? `${pointsPerBox} pts per correct box now` : clockNote}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
