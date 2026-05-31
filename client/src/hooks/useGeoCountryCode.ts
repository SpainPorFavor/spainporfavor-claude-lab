import { useState, useEffect } from "react";

/**
 * Maps ISO 3166-1 alpha-2 country codes to phone dial codes.
 * Covers the most common visitor countries for SpainPorFavor.
 */
const COUNTRY_TO_DIAL: Record<string, string> = {
  US: "+1",
  CA: "+1",
  GB: "+44",
  AU: "+61",
  ZA: "+27",
  IE: "+353",
  ES: "+34",
  DE: "+49",
  FR: "+33",
  NL: "+31",
  PT: "+351",
  IT: "+39",
  BE: "+32",
  AT: "+43",
  CH: "+41",
  SE: "+46",
  NO: "+47",
  DK: "+45",
  FI: "+358",
  NZ: "+64",
  IN: "+91",
  BR: "+55",
  MX: "+52",
  AR: "+54",
  CO: "+57",
  CL: "+56",
  PL: "+48",
  RO: "+40",
  CZ: "+420",
  HU: "+36",
  AE: "+971",
  SG: "+65",
  HK: "+852",
  JP: "+81",
  KR: "+82",
  IL: "+972",
  NG: "+234",
  KE: "+254",
  GH: "+233",
  EG: "+20",
  MA: "+212",
  PH: "+63",
  MY: "+60",
  TH: "+66",
  VN: "+84",
  ID: "+62",
  PK: "+92",
  BD: "+880",
  RU: "+7",
  UA: "+380",
  TR: "+90",
};

const DEFAULT_CODE = "+44";

/**
 * Hook that detects the visitor's country via IP geolocation
 * and returns the appropriate phone dial code.
 * Falls back to +44 (UK) if detection fails.
 */
export function useGeoCountryCode(fallback: string = DEFAULT_CODE): string {
  const [dialCode, setDialCode] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      try {
        // Use the free ip-api.com service (no API key required, HTTPS on paid but HTTP free)
        // Fallback chain: try multiple free services
        const response = await fetch("https://ipapi.co/json/", {
          signal: AbortSignal.timeout(3000),
        });
        if (!response.ok) throw new Error("ipapi.co failed");
        const data = await response.json();
        const countryCode = data.country_code || data.country;
        if (countryCode && !cancelled) {
          const code = COUNTRY_TO_DIAL[countryCode.toUpperCase()];
          if (code) setDialCode(code);
        }
      } catch {
        // Silently fall back — don't block the form
        try {
          const response = await fetch("https://ip2c.org/self", {
            signal: AbortSignal.timeout(3000),
          });
          if (!response.ok) return;
          const text = await response.text();
          // Response format: "1;US;USA;United States"
          const parts = text.split(";");
          if (parts[0] === "1" && parts[1] && !cancelled) {
            const code = COUNTRY_TO_DIAL[parts[1].toUpperCase()];
            if (code) setDialCode(code);
          }
        } catch {
          // Both services failed — keep fallback
        }
      }
    }

    detect();
    return () => { cancelled = true; };
  }, []);

  return dialCode;
}
