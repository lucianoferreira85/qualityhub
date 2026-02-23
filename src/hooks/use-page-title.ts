import { useEffect } from "react";

const APP_NAME = "QualityHub";

/**
 * Sets the document title dynamically.
 * @param title - Page title (e.g., "Dashboard"). Will be appended with " | QualityHub".
 *                Pass empty string to use just "QualityHub".
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
}
