import type { LoginResponse } from "./api";

const STORAGE_KEY = "coconut-erp-session";

export const getStoredSession = (): LoginResponse | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as LoginResponse;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setStoredSession = (session: LoginResponse) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  window.localStorage.removeItem(STORAGE_KEY);
};

export const isSessionExpired = (session: LoginResponse) => {
  return new Date(session.expiresAt).getTime() <= Date.now();
};
