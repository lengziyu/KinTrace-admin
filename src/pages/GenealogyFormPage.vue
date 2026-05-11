<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  useMessage,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { GenealogyPerson } from "@/types/models";

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const message = useMessage();

const genderOptions = [
  { label: "男", value: "male" },
  { label: "女", value: "female" },
  { label: "未设置", value: "unknown" },
];

const statusOptions = [
  { label: "在世", value: "living" },
  { label: "已故", value: "deceased" },
];

const familyOptions = computed(() =>
  adminStore.families.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const form = reactive({
  familyId: "",
  name: "",
  gender: "male" as GenealogyPerson["gender"],
  generationLevel: 1,
  generationLabel: "一世",
  branchName: "",
  parentId: null as string | null,
  spouseName: "",
  status: "living" as GenealogyPerson["status"],
  bio: "",
  sortOrder: 1,
});

const isEdit = computed(() => route.path.endsWith("/edit"));
const editingId = computed(() => String(route.params.id ?? ""));
const targetPerson = computed(() => adminStore.genealogyPeople.find((item) => item.id === editingId.value) ?? null);

const parentOptions = computed(() =>
  adminStore.genealogyPeople
    .filter((item) => item.familyId === form.familyId && item.id !== editingId.value)
    .sort((a, b) => {
      if (a.generationLevel !== b.generationLevel) {
        return a.generationLevel - b.generationLevel;
      }
      return a.name.localeCompare(b.name, "zh-CN");
    })
    .map((item) => ({
      label: `${item.name} · ${item.generationLabel}`,
      value: item.id,
    })),
);

function fillForm(person?: GenealogyPerson | null) {
  form.familyId = person?.familyId ?? adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.name = person?.name ?? "";
  form.gender = person?.gender ?? "male";
  form.generationLevel = person?.generationLevel ?? 1;
  form.generationLabel = person?.generationLabel ?? "一世";
  form.branchName = person?.branchName ?? "";
  form.parentId = person?.parentId ?? null;
  form.spouseName = person?.spouseName ?? "";
  form.status = person?.status ?? "living";
  form.bio = person?.bio ?? "";
  form.sortOrder = person?.sortOrder ?? 1;
}

watch(
  () => [isEdit.value, targetPerson.value, adminStore.currentFamily?.id, adminStore.families.length] as const,
  ([editing, person]) => {
    if (editing) {
      if (person) {
        fillForm(person);
      }
      return;
    }

    fillForm(null);
  },
  { immediate: true },
);

watch(
  () => form.parentId,
  (value) => {
    if (!value) {
      return;
    }

    const parent = adminStore.genealogyPeople.find((item) => item.id === value);
    if (!parent) {
      return;
    }

    if (form.generationLevel <= parent.generationLevel) {
      form.generationLevel = parent.generationLevel + 1;
    }
  },
);

watch(
  () => form.familyId,
  () => {
    if (form.parentId && !parentOptions.value.some((item) => item.value === form.parentId)) {
      form.parentId = null;
    }
  },
);

async function submit() {
  const payload = {
    familyId: form.familyId || adminStore.currentFamily?.id || "",
    name: form.name.trim(),
    gender: form.gender,
    generationLevel: Number(form.generationLevel) || 1,
    generationLabel: form.generationLabel.trim() || `第 ${form.generationLevel || 1} 代`,
    branchName: form.branchName.trim() || null,
    parentId: form.parentId || null,
    spouseName: form.spouseName.trim() || null,
    status: form.status,
    bio: form.bio.trim() || null,
    sortOrder: Number(form.sortOrder) || 1,
  };

  if (!payload.familyId || !payload.name) {
    message.warning("请先补全人物姓名");
    return;
  }

  if (editingId.value && payload.parentId === editingId.value) {
    message.warning("上代人物不能选择自己");
    return;
  }

  try {
    if (isEdit.value) {
      if (!editingId.value) {
        message.warning("缺少人物 ID");
        return;
      }

      await adminStore.updateGenealogyPerson(editingId.value, payload);
      message.success("族谱人物已更新");
    } else {
      await adminStore.createGenealogyPerson(payload);
      message.success("族谱人物已创建");
    }

    void router.push("/genealogy");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "族谱人物保存失败");
  }
}
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" :title="isEdit ? '编辑族谱人物' : '新增族谱人物'">
      <template #header-extra>
        <NButton tertiary @click="router.push('/genealogy')">返回列表</NButton>
      </template>

      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="人物姓名">
            <NInput v-model:value="form.name" placeholder="请输入族谱人物姓名" />
          </NFormItem>
          <NFormItem label="性别">
            <NSelect v-model:value="form.gender" :options="genderOptions" />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect v-model:value="form.status" :options="statusOptions" />
          </NFormItem>
          <NFormItem label="世代序号">
            <NInputNumber v-model:value="form.generationLevel" :min="1" :show-button="false" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="世代名称">
            <NInput v-model:value="form.generationLabel" placeholder="例如：一世 / 二世 / 三世" />
          </NFormItem>
          <NFormItem label="支系">
            <NInput v-model:value="form.branchName" placeholder="例如：宗脉主支 / 东房 / 南支" />
          </NFormItem>
          <NFormItem label="上代人物">
            <NSelect
              v-model:value="form.parentId"
              clearable
              :options="parentOptions"
              placeholder="可选，用于形成简单谱系关系"
            />
          </NFormItem>
          <NFormItem label="配偶姓名">
            <NInput v-model:value="form.spouseName" placeholder="简单版先维护配偶姓名" />
          </NFormItem>
          <NFormItem label="同代排序">
            <NInputNumber v-model:value="form.sortOrder" :min="1" :show-button="false" style="width: 100%;" />
          </NFormItem>
          <NFormItem class="md:col-span-2" label="人物说明">
            <NInput
              v-model:value="form.bio"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
              placeholder="记录人物简介、支系说明或备注信息"
            />
          </NFormItem>
        </div>
      </NForm>

      <div class="admin-surface-muted mb-4 p-4 text-sm leading-7 text-white/58">
        简单版录入策略：一位人物只维护一个“上代人物”和一个“配偶姓名”，优先满足谱图展示。
        如果后续需要更复杂的父母、继配、收养等关系，再扩展为关系表结构。
      </div>

      <div class="flex justify-end gap-3">
        <NButton tertiary @click="router.push('/genealogy')">取消</NButton>
        <NButton type="primary" @click="submit">
          {{ isEdit ? "保存人物" : "创建人物" }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>
