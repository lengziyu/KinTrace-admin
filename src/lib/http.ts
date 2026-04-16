type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const DEFAULT_API_BASE_URL = "http://localhost:3000/api/v1";

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
}

export function getApiOrigin() {
  return new URL(getApiBaseUrl()).origin;
}

export function resolveAssetUrl(path?: string | null) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//.test(path) || path.startsWith("data:")) {
    return path;
  }

  return new URL(path, `${getApiOrigin()}/`).toString();
}

export async function httpRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(joinUrl(getApiBaseUrl(), path), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = (await response.json()) as ApiResponse<T> | { message?: string };

  if (!response.ok) {
    throw new Error("message" in payload && payload.message ? payload.message : "请求失败");
  }

  if (!("data" in payload)) {
    throw new Error("响应格式不正确");
  }

  return payload.data;
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(joinUrl(getApiBaseUrl(), "uploads/images"), {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json()) as
    | ApiResponse<{
        fileName: string;
        originalName: string;
        size: number;
        mimeType: string;
        url: string;
      }>
    | { message?: string };

  if (!response.ok) {
    throw new Error("message" in payload && payload.message ? payload.message : "图片上传失败");
  }

  if (!("data" in payload)) {
    throw new Error("上传响应格式不正确");
  }

  return payload.data;
}
