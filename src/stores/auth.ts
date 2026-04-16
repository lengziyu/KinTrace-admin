import { defineStore } from "pinia";
import { httpRequest } from "@/lib/http";

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

const TOKEN_KEY = "kintrace-admin-token";
const PROFILE_KEY = "kintrace-admin-profile";

export const useAuthStore = defineStore("admin-auth", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    profile: (() => {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? (JSON.parse(raw) as AdminProfile) : null;
    })(),
    loading: false,
  }),
  getters: {
    isLoggedIn(state) {
      return Boolean(state.token);
    },
  },
  actions: {
    persist() {
      if (this.token) {
        localStorage.setItem(TOKEN_KEY, this.token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }

      if (this.profile) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
      } else {
        localStorage.removeItem(PROFILE_KEY);
      }
    },

    async login(username: string, password: string) {
      this.loading = true;
      try {
        const data = await httpRequest<{
          accessToken: string;
          user: AdminProfile;
        }>("auth/admin/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });

        this.token = data.accessToken;
        this.profile = data.user;
        this.persist();
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = "";
      this.profile = null;
      this.persist();
    },
  },
});

