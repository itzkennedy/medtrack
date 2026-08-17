/**
 * API client — thin fetch wrappers for Express backend.
 * Sprint 0: stubs only. Implementations land in Sprint 1-2.
 *
 * Usage: import { login, register, ... } from "./api/client.js";
 */

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Auth ──
export const login = (email, password) =>
  request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (data) =>
  request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ── Medications ──
export const getMedications = () => request("/medications");
export const addMedication = (data) =>
  request("/medications", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ── Schedules ──
export const getSchedules = (medicationId) =>
  request(`/schedules?medicationId=${medicationId}`);

// ── Doses ──
export const getTodayDoses = () => request("/doses/today");
export const logDose = (scheduleId, status) =>
  request("/doses", {
    method: "POST",
    body: JSON.stringify({ scheduleId, status }),
  });

// ── Caregiver ──
export const getLinkedPatients = () => request("/caregiver/patients");
export const generateInvite = () => request("/caregiver/invite", { method: "POST" });
