"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";

type HCaptchaFieldProps = {
  onTokenChange: (token: string | null) => void;
};

export default function HCaptchaField({ onTokenChange }: HCaptchaFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.error("Missing NEXT_PUBLIC_HCAPTCHA_SITE_KEY");
    return null;
  }

  return (
    <HCaptcha
      sitekey={siteKey}
      onVerify={(token) => onTokenChange(token)}
      onExpire={() => onTokenChange(null)}
      onError={() => onTokenChange(null)}
    />
  );
}