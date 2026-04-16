import { defineStore } from "pinia";
import { httpRequest, resolveAssetUrl } from "@/lib/http";

export type PointMarkerPresetKey = "star" | "lotus" | "mountain" | "leaf";

export interface BrandSettings {
  appNameZh: string;
  appNameEn: string;
  logoUrl: string;
  iconUrl: string;
  pointMarkerPreset: PointMarkerPresetKey;
  pointMarkerIconUrl: string;
}

const defaultSettings: BrandSettings = {
  appNameZh: "宗迹",
  appNameEn: "KinTrace Admin",
  logoUrl: "",
  iconUrl: "/kintrace-logo.svg",
  pointMarkerPreset: "star",
  pointMarkerIconUrl: "",
};

function ensureFaviconLink() {
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  return link;
}

export const useBrandStore = defineStore("admin-brand", {
  state: () => ({
    settings: { ...defaultSettings } as BrandSettings,
    loaded: false,
  }),
  getters: {
    displayIcon(state) {
      return resolveAssetUrl(state.settings.iconUrl || defaultSettings.iconUrl);
    },
    displayLogo(state) {
      return resolveAssetUrl(state.settings.logoUrl || "");
    },
  },
  actions: {
    applyBrandAssets() {
      ensureFaviconLink().href = this.displayIcon;
    },
    async loadSettings(force = false) {
      if (this.loaded && !force) {
        return this.settings;
      }

      try {
        const data = await httpRequest<BrandSettings>("app-settings");
        this.settings = {
          ...defaultSettings,
          ...data,
        };
      } catch {
        this.settings = { ...defaultSettings };
      }

      this.loaded = true;
      this.applyBrandAssets();
      return this.settings;
    },
    async saveSettings(payload: Partial<BrandSettings>) {
      const data = await httpRequest<BrandSettings>("app-settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      this.settings = {
        ...defaultSettings,
        ...data,
      };
      this.loaded = true;
      this.applyBrandAssets();
    },
    async resetSettings() {
      await this.saveSettings(defaultSettings);
    },
  },
});
