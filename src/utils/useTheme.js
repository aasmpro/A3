"use client";
import { useSyncExternalStore } from "react";
const event = "amiri-theme-change";
function apply(value) {
  const theme = value === "light" ? "light" : "dark";
  delete document.documentElement.dataset.cursorTheme;
  document.documentElement.dataset.themeChanging = "true";
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      delete document.documentElement.dataset.themeChanging;
    }),
  );
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
}
function subscribe(callback) {
  const storage = (e) => {
    if (e.key === "amiri-theme" || e.key === null) {
      apply(e.newValue);
      callback();
    }
  };
  window.addEventListener(event, callback);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(event, callback);
    window.removeEventListener("storage", storage);
  };
}
const snapshot = () => document.documentElement.dataset.theme || "dark";
const serverSnapshot = () => "dark";
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return {
    theme,
    setTheme(value) {
      apply(value);
      try {
        localStorage.setItem("amiri-theme", value);
      } catch {
        /* Selection still works in memory. */
      }
      window.dispatchEvent(new Event(event));
    },
  };
}
