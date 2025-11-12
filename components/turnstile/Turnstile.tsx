// components/TurnstileWidget.tsx
"use client";

import { useEffect } from "react";

type Props = {
  siteKey: string;
  onVerify: (token: string) => void;
};

declare global {
  interface Window {
    onTurnstileCallback?: (token: string) => void;
  }
}

export default function TurnstileWidget({ siteKey, onVerify }: Props) {
  useEffect(() => {
    window.onTurnstileCallback = (token) => {
      onVerify(token); // kirim token ke parent
    };

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      delete window.onTurnstileCallback;
    };
  }, [onVerify, siteKey]);

  return (
    <div
      className="cf-turnstile"
      data-sitekey={siteKey}
      data-callback="onTurnstileCallback"
    ></div>
  );
}
