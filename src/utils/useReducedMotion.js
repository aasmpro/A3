import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const subscribe = (callback) => {
  const media = window.matchMedia(query);
  if (media.addEventListener) {
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  }
  media.addListener(callback);
  return () => media.removeListener(callback);
};
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

export const useReducedMotion = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
