<script setup lang="ts">
import { computed, h, reactive, ref } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { FamilyMember } from "@/types/models";

const adminStore = useAdminStore();
const message = useMessage();
const keyword = ref("");
const drawerVisible = ref(false);
const editingId = ref("");

const roleOptions = [
  { label: "管理员", value: "admin" },
  { label: "协管成员", value: "manager" },
  { label: "家族成员", value: "member" },
];

const statusOptions = [
  { label: "启用中", value: "active" },
  { label: "已停用", value: "inactive" },
];

const familyOptions = computed(() =>
  adminStore.families.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const form = reactive({
  familyId: "",
  nickname: "",
  phone: "",
  role: "member",
  status: "active",
});

const familyMembers = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return adminStore.members.filter((item) => {
    if (familyId && item.familyId !== familyId) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return [item.nickname, item.phone, item.role, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

function roleLabel(role: string) {
  return roleOptions.find((item) => item.value === role)?.label ?? role;
}

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

function resetForm() {
  form.familyId = adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.nickname = "";
  form.phone = "";
  form.role = "member";
  form.status = "active";
  editingId.value = "";
}

function openCreateDrawer() {
  resetForm();
  drawerVisible.value = true;
}

function openEditDrawer(memberId: string) {
  const member = adminStore.members.find((item) => item.id === memberId);
  if (!member) {
    return;
  }

  editingId.value = member.id;
  form.familyId = member.familyId;
  form.nickname = member.nickname;
  form.phone = member.phone ?? "";
  form.role = member.role;
  form.status = member.status;
  drawerVisible.value = true;
}

async function submit() {
  const payload = {
    familyId: form.familyId || adminStore.currentFamily?.id || "",
    nickname: form.nickname.trim(),
    phone: form.phone.trim() || null,
    role: form.role,
    status: form.status,
  };

  if (!payload.familyId || !payload.nickname) {
    message.warning("请先补全成员昵称");
    return;
  }

  try {
    if (editingId.value) {
      await adminStore.updateMember(editingId.value, {
        nickname: payload.nickname,
        phone: payload.phone,
        role: payload.role,
        status: payload.status,
      });
      message.success("成员信息已更新");
    } else {
      await adminStore.createMember(payload);
      message.success("成员已创建");
    }

    drawerVisible.value = false;
    resetForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "成员保存失败");
  }
}

async function remove(memberId: string) {
  try {
    await adminStore.deleteMember(memberId);
    message.success("成员已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "成员删除失败");
  }
}

const columns = computed<DataTableColumns<FamilyMember>>(() => [
  {
    title: "成员",
    key: "nickname",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.nickname),
        h("p", { class: "text-xs text-white/40" }, row.phone || "未登记手机号"),
      ]),
  },
  {
    title: "角色",
    key: "role",
    render: (row) =>
      h(NTag, { round: true, type: row.role === "admin" ? "primary" : "default" }, { default: () => roleLabel(row.role) }),
  },
  {
    title: "状态",
    key: "status",
    render: (row) =>
      h(NTag, { round: true, type: row.status === "active" ? "success" : "warning" }, { default: () => statusLabel(row.status) }),
  },
  {
    title: "加入时间",
    key: "joinedAt",
    render: (row) => new Date(row.joinedAt).toLocaleDateString("zh-CN"),
  },
  {
    title: "操作",
    key: "actions",
    width: 140,
    render: (row) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(
            NButton,
            { text: true, type: "primary", onClick: () => openEditDrawer(row.id) },
            { default: () => "编辑" },
          ),
          h(
            NButton,
            { text: true, type: "error", onClick: () => void remove(row.id) },
            { default: () => "删除" },
          ),
        ],
      }),
  },
]);

resetForm();
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="成员列表">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NInput v-model:value="keyword" clearable placeholder="按昵称、手机号、角色或状态搜索" />
        <NButton type="primary" @click="openCreateDrawer">新增成员</NButton>
      </div>

      <NDataTable :columns="columns" :data="familyMembers" :bordered="false" />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="420" placement="right">
      <NDrawerContent :title="editingId ? '编辑成员' : '新增成员'" closable>
        <NForm label-placement="top">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="成员昵称">
            <NInput v-model:value="form.nickname" placeholder="请输入成员昵称" />
          </NFormItem>
          <NFormItem label="手机号">
            <NInput v-model:value="form.phone" placeholder="可选" />
          </NFormItem>
          <NFormItem label="角色">
            <NSelect v-model:value="form.role" :options="roleOptions" />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect v-model:value="form.status" :options="statusOptions" />
          </NFormItem>
        </NForm>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton tertiary @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="submit">
              {{ editingId ? "保存成员" : "创建成员" }}
            </NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
