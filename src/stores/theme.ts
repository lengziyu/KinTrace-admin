import { defineStore } from "pinia";

type ThemeMode = "light" | "dark";

export const useThemeStore = defineStore("admin-theme", {
  state: () => ({
    theme: (localStorage.getItem("kintrace-admin-theme") as ThemeMode | null) ?? "dark",
  }),
  getters: {
    actualTheme(state) {
      return state.theme;
    },
  },
  actions: {
    applyTheme() {
      const root = document.documentElement;
      root.classList.toggle("dark", this.theme === "dark");
      root.dataset.theme = this.theme;
      root.style.colorScheme = this.theme;
    },
    setTheme(theme: ThemeMode) {
      this.theme = theme;
      localStorage.setItem("kintrace-admin-theme", theme);
      this.applyTheme();
    },
    toggleTheme() {
      this.setTheme(this.theme === "dark" ? "light" : "dark");
    },
  },
});
