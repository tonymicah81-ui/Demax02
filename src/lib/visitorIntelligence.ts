import { db, doc, setDoc, updateDoc, getDoc, serverTimestamp } from "../firebase";
import { getVisitorId } from "./visitorChatService";

export interface VisitorIntel {
  visitorId: string;
  browser: string;
  os: string;
  device: string;
  language: string;
  referrer: string;
  country?: string;
  city?: string;
  ip?: string;
  pagesVisited: string[];
  firstSeen: any;
  lastSeen: any;
  totalVisits: number;
  isReturning: boolean;
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  return "Unknown";
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "Mobile";
  if (/Tablet|iPad/i.test(ua)) return "Tablet";
  return "Desktop";
}

async function getGeoInfo(): Promise<{ country?: string; city?: string; ip?: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const d = await res.json();
      return { country: d.country_name, city: d.city, ip: d.ip };
    }
  } catch {
    // Non-critical, silently fail
  }
  return {};
}

export async function trackVisitor(page: string): Promise<void> {
  const visitorId = getVisitorId();
  const ref = doc(db, "visitor_intelligence", visitorId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const geo = await getGeoInfo();
      await setDoc(ref, {
        visitorId,
        browser: detectBrowser(),
        os: detectOS(),
        device: detectDevice(),
        language: navigator.language || "unknown",
        referrer: document.referrer || "direct",
        ...geo,
        pagesVisited: [page],
        firstSeen: serverTimestamp(),
        lastSeen: serverTimestamp(),
        totalVisits: 1,
        isReturning: false,
      });
    } else {
      const existing = snap.data();
      const pages: string[] = existing.pagesVisited || [];
      if (!pages.includes(page)) pages.push(page);
      await updateDoc(ref, {
        pagesVisited: pages.slice(-20),
        lastSeen: serverTimestamp(),
        totalVisits: (existing.totalVisits || 1) + 1,
        isReturning: true,
      });
    }
  } catch {
    // Non-critical
  }
}
