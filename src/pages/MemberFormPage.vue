<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  useMessage,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { FamilyMember } from "@/types/models";

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const message = useMessage();

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

const isEdit = computed(() => route.path.endsWith("/edit"));
const editingId = computed(() => String(route.params.id ?? ""));
const targetMember = computed(() => adminStore.members.find((item) => item.id === editingId.value) ?? null);

function fillForm(member?: FamilyMember | null) {
  form.familyId = member?.familyId ?? adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.nickname = member?.nickname ?? "";
  form.phone = member?.phone ?? "";
  form.role = member?.role ?? "member";
  form.status = member?.status ?? "active";
}

watch(
  () => [isEdit.value, targetMember.value, adminStore.currentFamily?.id, adminStore.families.length] as const,
  ([editing, member]) => {
    if (editing) {
      if (member) {
        fillForm(member);
      }
      return;
    }

    fillForm(null);
  },
  { immediate: true },
);

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
    if (isEdit.value) {
      if (!editingId.value) {
        message.warning("缺少成员 ID");
        return;
      }
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

    void router.push("/members");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "成员保存失败");
  }
}
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" :title="isEdit ? '编辑成员' : '新增成员'">
      <template #header-extra>
        <NButton tertiary @click="router.push('/members')">返回列表</NButton>
      </template>

      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
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
        </div>
      </NForm>

      <div class="flex justify-end gap-3">
        <NButton tertiary @click="router.push('/members')">取消</NButton>
        <NButton type="primary" @click="submit">
          {{ isEdit ? "保存成员" : "创建成员" }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>
