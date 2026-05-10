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
      id: "family-chen",
      name: "陈氏宗亲",
      code: "chenshi",
      description: "用于演示家族祭扫协作流程的默认家族。",
      inviteCode: "chenshi_237",
      ownerUserId: null,
      upcomingWorshipAt: "2026-04-15T08:30:00+08:00",
      visitRangeMeters: 300,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "family-lin",
      name: "林氏宗亲",
      code: "linshi",
      description: "用于演示多家族切换和线路协作的第二个家族。",
      inviteCode: "linshi_321",
      ownerUserId: null,
      upcomingWorshipAt: "2026-04-18T09:00:00+08:00",
      visitRangeMeters: 300,
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
  members: [
    {
      id: "member-chen-admin",
      familyId: "family-chen",
      userId: null,
      nickname: "陈宗礼",
      avatar: null,
      phone: "13800001001",
      role: "admin",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-01T08:00:00.000Z",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "member-chen-user",
      familyId: "family-chen",
      userId: null,
      nickname: "陈明远",
      avatar: null,
      phone: "13800001002",
      role: "member",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-01T08:00:00.000Z",
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "member-lin-admin",
      familyId: "family-lin",
      userId: null,
      nickname: "林敬修",
      avatar: null,
      phone: "13800002001",
      role: "admin",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-02T08:00:00.000Z",
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "member-lin-user",
      familyId: "family-lin",
      userId: null,
      nickname: "林秋澄",
      avatar: null,
      phone: "13800002002",
      role: "member",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-02T08:00:00.000Z",
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "member-lin-manager",
      familyId: "family-lin",
      userId: null,
      nickname: "林雅衡",
      avatar: null,
      phone: "13800002003",
      role: "manager",
      joinSource: "seed",
      status: "active",
      joinedAt: "2026-04-03T08:00:00.000Z",
      createdAt: "2026-04-03T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
  tombs: [
    {
      id: "tomb-chen-1",
      familyId: "family-chen",
      name: "陈氏始祖纪念点",
      titleName: "始祖",
      generation: "一世",
      branchName: "宗脉主支",
      lng: 121.4737,
      lat: 31.2304,
      areaName: "松泽纪念园",
      description: "家族年度祭扫的核心墓点。",
      coverImage: null,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "tomb-chen-2",
      familyId: "family-chen",
      name: "陈氏二房先人",
      titleName: "二房先人",
      generation: "三世",
      branchName: "东房",
      lng: 121.4837,
      lat: 31.2204,
      areaName: "东园纪念区",
      description: "用于演示上午与下午分段祭扫。",
      coverImage: null,
      createdAt: "2026-04-01T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "tomb-lin-1",
      familyId: "family-lin",
      name: "林氏先贤纪念点",
      titleName: "先贤",
      generation: "二世",
      branchName: "南支",
      lng: 120.1652,
      lat: 30.2741,
      areaName: "南麓纪念区",
      description: "用于演示多家族数据切换。",
      coverImage: null,
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
    {
      id: "tomb-lin-2",
      familyId: "family-lin",
      name: "林氏宗祠旧址",
      titleName: "宗祠旧址",
      generation: "祖居",
      branchName: "北支",
      lng: 120.1723,
      lat: 30.2811,
      areaName: "北山片区",
      description: "适合放在路线尾段作为集合点。",
      coverImage: null,
      createdAt: "2026-04-02T08:00:00.000Z",
      updatedAt: "2026-04-08T08:00:00.000Z",
    },
  ],
  tasks: [
    {
      id: "task-chen-2026",
      familyId: "family-chen",
      year: 2026,
      name: "2026 清明祭扫",
      startDate: "2026-04-01",
      endDate: "2026-04-20",
      status: "active",
    },
    {
      id: "task-lin-2026",
      familyId: "family-lin",
      year: 2026,
      name: "2026 春祭安排",
      startDate: "2026-04-05",
      endDate: "2026-04-18",
      status: "draft",
    },
  ],
  messages: [
    {
      id: "message-1",
      familyId: "family-chen",
      tombId: "tomb-chen-1",
      memberId: "member-chen-user",
      content: "愿家门兴旺，后辈平安顺遂。",
      status: "pending",
      createdAt: "2026-04-04T03:20:00.000Z",
    },
    {
      id: "message-2",
      familyId: "family-lin",
      tombId: "tomb-lin-1",
      memberId: "member-lin-user",
      content: "谨以微言追思先贤，愿宗亲和睦安康。",
      status: "pending",
      createdAt: "2026-04-09T06:15:00.000Z",
    },
  ],
  routes: [
    {
      id: "route-chen-1",
      familyId: "family-chen",
      name: "清明主线路",
      description: "上午先扫主墓点，下午补充支系墓点。",
      tombIds: ["tomb-chen-1", "tomb-chen-2"],
      isPrimary: true,
      morningTombCount: 1,
      afternoonTombCount: 1,
      planRevision: 2,
      planUpdatedAt: "2026-04-09T10:00:00.000Z",
      createdByMemberId: "member-chen-admin",
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
        this.useMockData(error instanceof Error ? error.message : "接口暂时不可用");
      } finally {
        this.loading = false;
      }
    },

    async selectFamily(familyId: string) {
      this.setSelectedFamily(familyId);
      await this.loadSnapshot(familyId, false);
    },

    async createFamily(
      payload: Pick<FamilyGroup, "name" | "description" | "upcomingWorshipAt" | "visitRangeMeters"> &
        Partial<Pick<FamilyGroup, "code" | "inviteCode">>,
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
      payload: Pick<
        RoutePlan,
        | "familyId"
        | "name"
        | "description"
        | "tombIds"
        | "createdByMemberId"
        | "isPrimary"
        | "morningTombCount"
        | "afternoonTombCount"
      >,
    ) {
      await httpRequest<RoutePlan>("route-plans", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await this.loadSnapshot(this.ensureFamilyId(payload.familyId), false);
    },

    async updateRoute(
      id: string,
      payload: Partial<
        Pick<
          RoutePlan,
          | "name"
          | "description"
          | "tombIds"
          | "createdByMemberId"
          | "isPrimary"
          | "morningTombCount"
          | "afternoonTombCount"
        >
      >,
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
