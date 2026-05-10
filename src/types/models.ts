export interface DashboardSummary {
  families: number;
  members: number;
  tombs: number;
  tasks: number;
  pendingMessages: number;
  activeTasks: number;
}

export interface FamilyGroup {
  id: string;
  name: string;
  code: string;
  description: string | null;
  inviteCode: string;
  ownerUserId: string | null;
  upcomingWorshipAt: string | null;
  visitRangeMeters: number;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string | null;
  nickname: string;
  avatar: string | null;
  phone: string | null;
  role: string;
  joinSource: string;
  status: string;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TombPoint {
  id: string;
  familyId: string;
  name: string;
  titleName: string | null;
  generation: string | null;
  branchName: string | null;
  lng: number;
  lat: number;
  areaName: string | null;
  description: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TombPhoto {
  id: string;
  tombId: string;
  memberId: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
}

export interface WorshipTask {
  id: string;
  familyId: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "closed";
}

export interface MemorialMessage {
  id: string;
  familyId: string;
  tombId: string;
  memberId: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface WorshipRecord {
  id: string;
  taskId: string;
  tombId: string;
  memberId: string;
  actionType: string;
  remark: string | null;
  checkInLng: number | null;
  checkInLat: number | null;
  checkInAccuracy: number | null;
  distanceMeters: number | null;
  worshipTime: string;
  createdAt: string;
}

export interface RoutePlan {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  tombIds: string[];
  isPrimary: boolean;
  morningTombCount: number;
  afternoonTombCount: number;
  planRevision: number;
  planUpdatedAt: string | null;
  createdByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSnapshot {
  summary: DashboardSummary;
  families: FamilyGroup[];
  members: FamilyMember[];
  tombs: TombPoint[];
  tasks: WorshipTask[];
  messages: MemorialMessage[];
  routes: RoutePlan[];
}
