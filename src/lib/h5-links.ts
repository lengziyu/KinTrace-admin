const DEFAULT_H5_BASE_URL = "http://localhost:5173";

function sanitizeBaseUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/`;
}

export function getH5BaseUrl() {
  return import.meta.env.VITE_H5_BASE_URL || DEFAULT_H5_BASE_URL;
}

function buildUrl(path: string, key: "familyCode" | "inviteCode", value: string, baseUrl = getH5BaseUrl()) {
  const url = new URL(path, sanitizeBaseUrl(baseUrl));
  url.searchParams.set(key, value);
  return url.toString();
}

function buildGenealogyUrl(path: string, familyId: string, baseUrl = getH5BaseUrl()) {
  const url = new URL(path, sanitizeBaseUrl(baseUrl));
  url.searchParams.set("familyId", familyId);
  return url.toString();
}

export function buildFamilyLoginUrl(familyCode: string, baseUrl?: string) {
  return buildUrl("/login", "familyCode", familyCode, baseUrl);
}

export function buildFamilyJoinUrl(inviteCode: string, baseUrl?: string) {
  return buildUrl("/join", "inviteCode", inviteCode, baseUrl);
}

export function buildFamilyGenealogyUrl(familyId: string, baseUrl?: string) {
  return buildGenealogyUrl("/genealogy", familyId, baseUrl);
}
