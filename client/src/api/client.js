const BASE = "/api";
const STORAGE_KEY = "medtrack_token";

let token = localStorage.getItem(STORAGE_KEY) || null;

export function setToken(t) {
  token = t;
  if (t) {
    localStorage.setItem(STORAGE_KEY, t);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getToken() {
  return token;
}

function getClientDateParams() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return { client_date: `${y}-${m}-${d}`, client_time: `${hh}:${mm}` };
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
  if (res.status === 204) return null;
  return res.json();
}

export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export const register = (data) =>
  request("/auth/register", { method: "POST", body: JSON.stringify(data) });

export const getMe = () => request("/auth/me");

export const getMedications = (patientId) => {
  const qs = patientId ? `?patient_id=${patientId}` : "";
  return request(`/medications${qs}`);
};

export const addMedication = (data) =>
  request("/medications", { method: "POST", body: JSON.stringify(data) });

export const updateMedication = (id, data) =>
  request(`/medications/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteMedication = (id) =>
  request(`/medications/${id}`, { method: "DELETE" });

export const getTodayDoses = (patientId) => {
  const params = new URLSearchParams(getClientDateParams());
  if (patientId) params.set("patient_id", String(patientId));
  return request(`/doses/today?${params}`);
};

export const logDose = (scheduleId, status) =>
  request(`/doses/${scheduleId}/log`, { method: "POST", body: JSON.stringify({ status }) });

export const getAdherence = (patientId) => {
  const params = new URLSearchParams(getClientDateParams());
  if (patientId) params.set("patient_id", String(patientId));
  return request(`/doses/adherence?${params}`);
};

export const getDoseHistory = (days, patientId) => {
  const params = new URLSearchParams(getClientDateParams());
  if (days) params.set("days", String(days));
  if (patientId) params.set("patient_id", String(patientId));
  return request(`/doses/history?${params}`);
};

export const getLinkedPatients = () => request("/caregiver/patients");

export const generateInvite = () =>
  request("/caregiver/invite", { method: "POST" });

export const acceptInvite = (invite_code) =>
  request("/caregiver/accept", { method: "POST", body: JSON.stringify({ invite_code }) });

export const getCaregiverAccess = () => request("/caregiver/access");

export const revokeCaregiverAccess = (linkId) =>
  request(`/caregiver/access/${linkId}`, { method: "DELETE" });
