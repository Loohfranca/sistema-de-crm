"use client";

import { useEffect, useState } from "react";

const KEY = "crm_sidebar_collapsed";
const EVENT = "crm_sidebar_state_updated";

export function getSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "true";
}

export function setSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, String(collapsed));
  window.dispatchEvent(new Event(EVENT));
}

export function useSidebarCollapsed(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    setCollapsedState(getSidebarCollapsed());
    const sync = () => setCollapsedState(getSidebarCollapsed());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  return [collapsed, setSidebarCollapsed];
}
