const BASE = "/api";

let token = null;

export function setToken(t) {
  token = t;
}

export function getToken() {
  return token;
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const register = (data) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(data) });

export const getMedications = () => request("/medications");

export const addMedication = (data) =>
  request("/medications", { method: "POST", body: JSON.stringify(data) });

export const getTodayDoses = () => request("/doses/today");

export const logDose = (scheduleId, status) =>
  request(`/doses/${scheduleId}/log`, { method: "POST", body: JSON.stringify({ status }) });

export const getAdherence = () => request("/doses/adherence");

export const getLinkedPatients = () => request("/caregiver/patients");

export const generateInvite = () => request("/caregiver/invite", { method: "POST" });
