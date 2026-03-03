"use client";

import LoginForm from "./login-form";

export function AuthenticationClient() {
  return (
    <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground lg:hidden">
          Doutor Agenda
        </h2>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-8 shadow-lg sm:p-10">
        <LoginForm />
      </div>
    </div>
  );
}
