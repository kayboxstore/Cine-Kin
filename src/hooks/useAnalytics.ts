import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Replace with your actual GA4 Measurement ID
const GA_ID = "G-XXXXXXXXXX";

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    if (typeof window !== "undefined") {
      window.gtag?.("config", GA_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}

export function trackEvent(action: string, category?: string, label?: string, value?: number) {
  if (typeof window !== "undefined") {
    window.gtag?.("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  }
}

// Declare gtag on window
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
