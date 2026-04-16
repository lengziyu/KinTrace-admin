import { defineStore } from "pinia";
import { httpRequest } from "@/lib/http";
import type {
  AdminSnapshot,
  DashboardSummary,
  FamilyGroup,
  FamilyMember,
  MemorialMessage,
  RoutePlan,
  TombPoint,
  WorshipTask,
} from "@/types/models";

type DataSource = "api" | "mock";

const SELECTED_FAMILY_KEY = "kintrace-admin-family-id";

const mockSnapshot: AdminSnapshot = {
  summary: {
    families: 2,
    members: 5,
    tombs: 4,
    tasks: 2,
    pendingMessages: 2,
    activeTasks: 1,
  },
  families: [
    {
      id: "family-1",
      name: "林氏宗亲",
      code: "lin-family",
      description: "用于演示家族祭扫协作流程的示例家族。",
      inviteCode: "KINTRACE-LIN",
      ownerUserId: null,
      upcomingWorshipAt: "2026-04-15T08:30:00+08:00",
      visitRangeMeters: 300,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "family-2",
      name: "陈氏家族",
      code: "chen-family",
      description: "用于演示多家族切换体验的第二个家族空间。",
      inviteCode: "KINTRACE-CHEN",
      ownerUserId: null,
      upcomingWorshipAt: "2026-04-18T17:30:00+08:00",
      visitRangeMeters: 300,
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
  members: [
    {
      id: "member-1",
      familyId: "family-1",
      userId: null,
      nickname: "林长安",
      avatar: null,
      phone: null,
      role: "admin",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-01T08:00:00.000Z",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "member-2",
      familyId: "family-1",
      userId: null,
      nickname: "林秋澄",
      avatar: null,
      phone: null,
      role: "member",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-01T08:00:00.000Z",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "member-3",
      familyId: "family-2",
      userId: null,
      nickname: "陈敬和",
      avatar: null,
      phone: null,
      role: "admin",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-02T08:00:00.000Z",
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
  tombs: [
    {
      id: "tomb-1",
      familyId: "family-1",
      name: "始祖林公纪念点",
      titleName: "始祖",
      generation: "一世",
      branchName: "宗脉主支",
      lng: 121.4737,
      lat: 31.2304,
      areaName: "松泽纪念园",
      description: "核心祭扫点位。",
      coverImage: null,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "tomb-2",
      familyId: "family-1",
      name: "二房先人纪念点",
      titleName: "二房先人",
      generation: "三世",
      branchName: "东房",
      lng: 121.4837,
      lat: 31.2204,
      areaName: "东岭纪念区",
      description: "用于演示路线规划。",
      coverImage: null,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "tomb-3",
      familyId: "family-2",
      name: "陈氏先贤纪念点",
      titleName: "先贤",
      generation: "二世",
      branchName: "南支",
      lng: 120.1652,
      lat: 30.2741,
      areaName: "南麓纪念区",
      description: "用于演示超管切换家族。",
      coverImage: null,
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
  tasks: [
    {
      id: "task-1",
      familyId: "family-1",
      year: 2026,
      name: "2026 清明祭扫",
      startDate: "2026-04-01",
      endDate: "2026-04-20",
      status: "active",
    },
  ],
  messages: [
    {
      id: "message-1",
      familyId: "family-1",
      tombId: "tomb-1",
      memberId: "member-2",
      content: "愿家人平安顺遂，子孙和睦。",
      status: "pending",
      createdAt: "2026-04-04T03:20:00.000Z",
    },
  ],
  routes: [
    {
      id: "route-1",
      familyId: "family-1",
      name: "清明主线",
      description: "核心点位串联路线。",
      tombIds: ["tomb-1", "tomb-2"],
      createdByMemberId: "member-1",
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
};

function readSelectedFamilyId() {
  return localStorage.getItem(SELECTED_FAMILY_KEY) ?? "";
}

export const useAdminStore = defineStore("admin-data", {
  state: () => ({
    source: "mock" as DataSource,
    loading: false,
    error: "",
    selectedFamilyId: readSelectedFamilyId(),
    summary: mockSnapshot.summary as DashboardSummary,
    families: mockSnapshot.families as FamilyGroup[],
    members: mockSnapshot.members as FamilyMember[],
    tombs: mockSnapshot.tombs as TombPoint[],
    tasks: mockSnapshot.tasks as WorshipTask[],
    messages: mockSnapshot.messages as MemorialMessage[],
    routes: mockSnapshot.routes as RoutePlan[],
  }),
  getters: {
    currentFamily(state) {
      return state.families.find((item) => item.id === state.selectedFamilyId) ?? state.families[0] ?? null;
    },
    familyOptions(state) {
      return state.families.map((item) => ({
        label: item.name,
        value: item.id,
      }));
    },
  },
  actions: {
    persistSelectedFamily() {
      if (this.selectedFamilyId) {
        localStorage.setItem(SELECTED_FAMILY_KEY, this.selectedFamilyId);
      } else {
        localStorage.removeItem(SELECTED_FAMILY_KEY);
      }
    },

    setSelectedFamily(familyId: string) {
      this.selectedFamilyId = familyId;
      this.persistSelectedFamily();
    },

    ensureFamilyId(candidate?: string) {
      return candidate || this.selectedFamilyId || this.families[0]?.id || "";
    },

    applySnapshot(snapshot: AdminSnapshot) {
      this.summary = snapshot.summary;
      this.families = snapshot.families;
      this.members = snapshot.members;
      this.tombs = snapshot.tombs;
      this.tasks = snapshot.tasks;
      this.messages = snapshot.messages;
      this.routes = snapshot.routes;

      const fallbackFamilyId = snapshot.families[0]?.id ?? "";
      const resolvedFamilyId = snapshot.families.some((item) => item.id === this.selectedFamilyId)
        ? this.selectedFamilyId
        : fallbackFamilyId;

      this.setSelectedFamily(resolvedFamilyId);
    },

    useMockData(message = "") {
      this.source = "mock";
      this.error = message;
      this.applySnapshot(mockSnapshot);
    },

    async loadSnapshot(familyId?: string, allowBootstrapSelect = true) {
      this.loading = true;
      this.error = "";

      try {
        const targetFamilyId = familyId ?? this.selectedFamilyId;
        const endpoint = targetFamilyId
          ? `dashboard/admin-snapshot?familyId=${targetFamilyId}`
          : "dashboard/admin-snapshot";
        const snapshot = await httpRequest<AdminSnapshot>(endpoint);

        if (!targetFamilyId && allowBootstrapSelect && snapshot.families.length > 0) {
          const bootstrapFamilyId = this.selectedFamilyId || snapshot.families[0]?.id || "";
          this.setSelectedFamily(bootstrapFamilyId);
          await this.loadSnapshot(bootstrapFamilyId, false);
          this.source = "api";
          return;
        }

        this.applySnapshot(snapshot);
        this.source = "api";
      } catch (error) {
        this.useMockData(error instanceof Error ? error.message : "接口暂不可用");
      } finally {
        this.loading = false;
      }
    },

    async selectFamily(familyId: string) {
      this.setSelectedFamily(familyId);
      await this.loadSnapshot(familyId, false);
    },

    async createFamily(
      payload: Pick<FamilyGroup, "name" | "code" | "inviteCode" | "description" | "upcomingWorshipAt" | "visitRangeMeters">,
    ) {
      const created = await httpRequest<FamilyGroup>("families", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      this.setSelectedFamily(created.id);
      await this.loadSnapshot(created.id, false);
    },

    async updateFamily(
      id: string,
      payload: Partial<Pick<FamilyGroup, "name" | "code" | "inviteCode" | "description" | "upcomingWorshipAt" | "visitRangeMeters">>,
    ) {
      await httpRequest<FamilyGroup>(`families/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(id, false);
    },

    async createMember(
      payload: Pick<FamilyMember, "familyId" | "nickname" | "phone" | "role" | "status">,
    ) {
      await httpRequest<FamilyMember>("members", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(this.ensureFamilyId(payload.familyId), false);
    },

    async updateMember(
      id: string,
      payload: Partial<Pick<FamilyMember, "nickname" | "phone" | "role" | "status">>,
    ) {
      await httpRequest<FamilyMember>(`members/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(undefined, false);
    },

    async deleteMember(id: string) {
      await httpRequest(`members/${id}`, {
        method: "DELETE",
      });
      await this.loadSnapshot(undefined, false);
    },

    async createTomb(
      payload: Pick<
        TombPoint,
        | "familyId"
        | "name"
        | "titleName"
        | "generation"
        | "branchName"
        | "lng"
        | "lat"
        | "areaName"
        | "description"
        | "coverImage"
      >,
    ) {
      await httpRequest<TombPoint>("tombs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(this.ensureFamilyId(payload.familyId), false);
    },

    async updateTomb(
      id: string,
      payload: Partial<
        Pick<
          TombPoint,
          | "name"
          | "titleName"
          | "generation"
          | "branchName"
          | "lng"
          | "lat"
          | "areaName"
          | "description"
          | "coverImage"
        >
      >,
    ) {
      await httpRequest<TombPoint>(`tombs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(undefined, false);
    },

    async deleteTomb(id: string) {
      await httpRequest(`tombs/${id}`, {
        method: "DELETE",
      });
      await this.loadSnapshot(undefined, false);
    },

    async createTask(
      payload: Pick<WorshipTask, "familyId" | "year" | "name" | "startDate" | "endDate" | "status">,
    ) {
      await httpRequest<WorshipTask>("worship-tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(this.ensureFamilyId(payload.familyId), false);
    },

    async deleteTask(id: string) {
      await httpRequest(`worship-tasks/${id}`, {
        method: "DELETE",
      });
      await this.loadSnapshot(undefined, false);
    },

    async reviewMessage(id: string, status: "approved" | "rejected") {
      await httpRequest(`memorial-messages/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await this.loadSnapshot(undefined, false);
    },

    async createRoute(
      payload: Pick<RoutePlan, "familyId" | "name" | "description" | "tombIds" | "createdByMemberId">,
    ) {
      await httpRequest<RoutePlan>("route-plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(this.ensureFamilyId(payload.familyId), false);
    },

    async updateRoute(
      id: string,
      payload: Partial<Pick<RoutePlan, "name" | "description" | "tombIds" | "createdByMemberId">>,
    ) {
      await httpRequest<RoutePlan>(`route-plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(undefined, false);
    },

    async deleteRoute(id: string) {
      await httpRequest(`route-plans/${id}`, {
        method: "DELETE",
      });
      await this.loadSnapshot(undefined, false);
    },
  },
});
