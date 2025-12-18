// app/sso-callback/page.jsx
"use client"; // Make this a client component to be safe
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback 
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
    />
  );
}