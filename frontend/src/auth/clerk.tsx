"use client";

import type { ReactNode } from "react";
import { getLocalAuthToken } from "@/auth/localAuth";

function hasLocalAuthToken(): boolean {
  return Boolean(getLocalAuthToken());
}

export function isClerkEnabled(): boolean {
  return false;
}

export function SignedIn(props: { children: ReactNode }) {
  return hasLocalAuthToken() ? <>{props.children}</> : null;
}

export function SignedOut(props: { children: ReactNode }) {
  return hasLocalAuthToken() ? null : <>{props.children}</>;
}

export function SignInButton(_props: {
  children?: ReactNode;
  mode?: string;
  forceRedirectUrl?: string;
  signUpForceRedirectUrl?: string;
}) {
  return <>{_props.children}</>;
}

export function SignOutButton(_props: { children?: ReactNode }) {
  return null;
}

export function useUser() {
  const token = getLocalAuthToken();
  const isSignedIn = Boolean(token);
  return {
    isLoaded: true,
    isSignedIn,
    user: isSignedIn
      ? {
          id: "local-user",
          fullName: "Local User",
          firstName: "Local",
          username: "local-user",
          primaryEmailAddress: { emailAddress: "local@localhost" },
          imageUrl: null,
        }
      : null,
  } as const;
}

export function useAuth() {
  const token = getLocalAuthToken();
  return {
    isLoaded: true,
    isSignedIn: Boolean(token),
    userId: token ? "local-user" : null,
    sessionId: token ? "local-session" : null,
    getToken: async () => token,
  } as const;
}

// Stub for any code that imports ClerkProvider
export function ClerkProvider(props: { children: ReactNode }) {
  return <>{props.children}</>;
}
