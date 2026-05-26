"use client";

import { useEffect } from "react";

const AFFILIATE_CODE_KEY = "ohs-affiliate-code";
const VISITOR_ID_KEY = "ohs-visitor-id";
const TRACKED_CODES_KEY = "ohs-tracked-affiliate-codes";

export function AffiliateTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (!ref) return;

    const code = ref.toUpperCase();
    window.localStorage.setItem(AFFILIATE_CODE_KEY, code);

    const visitorId = getVisitorId();
    const trackedCodes = JSON.parse(window.sessionStorage.getItem(TRACKED_CODES_KEY) || "[]") as string[];
    if (trackedCodes.includes(code)) return;

    window.sessionStorage.setItem(TRACKED_CODES_KEY, JSON.stringify([...trackedCodes, code]));

    fetch("/api/affiliate/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        visitorId,
        landingPath: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer
      })
    }).catch(() => {
      window.sessionStorage.setItem(TRACKED_CODES_KEY, JSON.stringify(trackedCodes));
    });
  }, []);

  return null;
}

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_ID_KEY, next);
  return next;
}
