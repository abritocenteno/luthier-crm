"use client";

import dynamic from "next/dynamic";

const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

// Dynamic imports — Clerk's JS is never loaded in preview mode
const DynamicSignInButton = !isPreview
  ? dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.SignInButton })))
  : null;

const DynamicSignUpButton = !isPreview
  ? dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.SignUpButton })))
  : null;

const DynamicUserButton = !isPreview
  ? dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.UserButton })))
  : null;

export function SignInButton({ children, mode }: { children: React.ReactNode; mode?: "modal" | "redirect" }) {
  if (isPreview || !DynamicSignInButton) return <>{children}</>;
  return <DynamicSignInButton mode={mode}>{children as any}</DynamicSignInButton>;
}

export function SignUpButton({ children, mode }: { children: React.ReactNode; mode?: "modal" | "redirect" }) {
  if (isPreview || !DynamicSignUpButton) return <>{children}</>;
  return <DynamicSignUpButton mode={mode}>{children as any}</DynamicSignUpButton>;
}

export function UserButton(props: Record<string, unknown>) {
  if (isPreview || !DynamicUserButton) return null;
  return <DynamicUserButton {...props} />;
}
