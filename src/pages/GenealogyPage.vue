<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import GenealogyTree from "@/components/GenealogyTree.vue";
import { buildFamilyGenealogyUrl } from "@/lib/h5-links";
import { useAdminStore } from "@/stores/admin";
import type { GenealogyPerson } from "@/types/models";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();
const keyword = ref("");
const selectedId = ref("");
const previewExpanded = ref(false);
const editorVisible = ref(false);
const editorSaving = ref(false);
const editingId = ref("");

const currentFamilyId = computed(() => adminStore.currentFamily?.id ?? "");

const currentFamilyPeople = computed(() =>
  adminStore.genealogyPeople.filter((item) => item.familyId === currentFamilyId.value),
);

const filteredPeople = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return currentFamilyPeople.value.filter((item) => {
    if (!normalizedKeyword) {
      return true;
    }

    return [item.name, item.generationLabel, item.branchName, item.spouseName, item.bio]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

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

const selectedPerson = computed(
  () => currentFamilyPeople.value.find((item) => item.id === selectedId.value) ?? filteredPeople.value[0] ?? null,
);
const editingPerson = computed(
  () => adminStore.genealogyPeople.find((item) => item.id === editingId.value) ?? null,
);

const editForm = reactive({
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

const parentOptions = computed(() =>
  adminStore.genealogyPeople
    .filter((item) => item.familyId === editForm.familyId && item.id !== editingId.value)
    .sort((left, right) => {
      if (left.generationLevel !== right.generationLevel) {
        return left.generationLevel - right.generationLevel;
      }

      return left.name.localeCompare(right.name, "zh-CN");
    })
    .map((item) => ({
      label: `${item.name} · ${item.generationLabel}`,
      value: item.id,
    })),
);

const stats = computed(() => {
  const roots = currentFamilyPeople.value.filter((item) => !item.parentId).length;
  const living = currentFamilyPeople.value.filter((item) => item.status === "living").length;
  const maxGeneration = currentFamilyPeople.value.reduce((max, item) => Math.max(max, item.generationLevel), 0);

  return {
    total: currentFamilyPeople.value.length,
    roots,
    living,
    maxGeneration,
  };
});

function genderLabel(value: GenealogyPerson["gender"]) {
  if (value === "male") return "男";
  if (value === "female") return "女";
  return "未设置";
}

function statusLabel(value: GenealogyPerson["status"]) {
  return value === "living" ? "在世" : "已故";
}

function selectPersonId(personId: string) {
  selectedId.value = personId;
  openEditor(personId);
}

function fillEditForm(person: GenealogyPerson) {
  editForm.familyId = person.familyId;
  editForm.name = person.name;
  editForm.gender = person.gender;
  editForm.generationLevel = person.generationLevel;
  editForm.generationLabel = person.generationLabel;
  editForm.branchName = person.branchName ?? "";
  editForm.parentId = person.parentId ?? null;
  editForm.spouseName = person.spouseName ?? "";
  editForm.status = person.status;
  editForm.bio = person.bio ?? "";
  editForm.sortOrder = person.sortOrder;
}

function openEditor(personId = selectedPerson.value?.id ?? "") {
  const person = adminStore.genealogyPeople.find((item) => item.id === personId);
  if (!person) {
    return;
  }

  editingId.value = person.id;
  selectedId.value = person.id;
  fillEditForm(person);
  editorVisible.value = true;
}

function openFullscreenPreview() {
  previewExpanded.value = true;
}

function closeEditor() {
  editorVisible.value = false;
}

async function submitEditor() {
  if (!editingId.value || !editingPerson.value) {
    message.warning("当前没有可编辑的人物");
    return;
  }

  const payload = {
    familyId: editForm.familyId || editingPerson.value.familyId,
    name: editForm.name.trim(),
    gender: editForm.gender,
    generationLevel: Number(editForm.generationLevel) || 1,
    generationLabel: editForm.generationLabel.trim() || `第 ${editForm.generationLevel || 1} 代`,
    branchName: editForm.branchName.trim() || null,
    parentId: editForm.parentId || null,
    spouseName: editForm.spouseName.trim() || null,
    status: editForm.status,
    bio: editForm.bio.trim() || null,
    sortOrder: Number(editForm.sortOrder) || 1,
  };

  if (!payload.name) {
    message.warning("请先补全人物姓名");
    return;
  }

  if (payload.parentId === editingId.value) {
    message.warning("上代人物不能选择自己");
    return;
  }

  editorSaving.value = true;
  try {
    await adminStore.updateGenealogyPerson(editingId.value, payload);
    message.success("族谱人物已更新");
    editorVisible.value = false;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "族谱人物保存失败");
  } finally {
    editorSaving.value = false;
  }
}

function openPublicPreview() {
  if (!currentFamilyId.value) {
    return;
  }

  window.open(buildFamilyGenealogyUrl(currentFamilyId.value), "_blank", "noopener,noreferrer");
}

async function copyPublicPreviewUrl() {
  if (!currentFamilyId.value) {
    message.warning("当前家族未就绪");
    return;
  }

  try {
    await navigator.clipboard.writeText(buildFamilyGenealogyUrl(currentFamilyId.value));
    message.success("H5 展示链接已复制");
  } catch {
    message.error("复制失败");
  }
}

async function removePerson(id: string) {
  try {
    await adminStore.deleteGenealogyPerson(id);
    if (selectedId.value === id) {
      selectedId.value = "";
    }
    message.success("族谱人物已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "族谱人物删除失败");
  }
}

const columns = computed<DataTableColumns<GenealogyPerson>>(() => [
  {
    title: "人物",
    key: "name",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.name),
        h("p", { class: "text-xs text-white/46" }, `${row.generationLabel} · ${row.branchName || "未分支"}`),
      ]),
  },
  {
    title: "关系",
    key: "relation",
    render: (row) =>
      h("div", { class: "space-y-1 text-sm text-white/68" }, [
        h("p", null, row.parentId ? `上代：${currentFamilyPeople.value.find((item) => item.id === row.parentId)?.name || "未找到"}` : "根节点"),
        h("p", { class: "text-xs text-white/46" }, row.spouseName ? `配偶：${row.spouseName}` : "未录入配偶"),
      ]),
  },
  {
    title: "状态",
    key: "status",
    width: 120,
    render: (row) =>
      h(
        NTag,
        { round: true, type: row.status === "living" ? "success" : "warning" },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: "操作",
    key: "actions",
    width: 160,
    render: (row) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(
            NButton,
            { text: true, type: "primary", onClick: () => openEditor(row.id) },
            { default: () => "弹框编辑" },
          ),
          h(
            NButton,
            { text: true, type: "error", onClick: () => void removePerson(row.id) },
            { default: () => "删除" },
          ),
        ],
      }),
  },
]);

watch(
  () => [currentFamilyId.value, filteredPeople.value.length] as const,
  () => {
    if (!filteredPeople.value.some((item) => item.id === selectedId.value)) {
      selectedId.value = filteredPeople.value[0]?.id ?? "";
    }
  },
  { immediate: true },
);

watch(
  () => editForm.parentId,
  (value) => {
    if (!value) {
      return;
    }

    const parent = adminStore.genealogyPeople.find((item) => item.id === value);
    if (!parent) {
      return;
    }

    if (editForm.generationLevel <= parent.generationLevel) {
      editForm.generationLevel = parent.generationLevel + 1;
    }
  },
);

watch(
  () => editForm.familyId,
  () => {
    if (editForm.parentId && !parentOptions.value.some((item) => item.value === editForm.parentId)) {
      editForm.parentId = null;
    }
  },
);

watch(
  () => editorVisible.value,
  (visible) => {
    if (!visible) {
      editingId.value = "";
    }
  },
);

onMounted(() => {
  void adminStore.loadGenealogy(currentFamilyId.value);
});
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="族谱展示与维护">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl text-sm leading-7 text-white/64">
          当前展示已经切到 Topola 风格树图。录入层仍保持轻量，只维护人物、世代、上代和配偶名，
          展示层会自动转换成族谱树，供后台与 `KinTrace` H5 共用。
        </div>

        <div class="flex flex-wrap gap-3">
          <NButton tertiary @click="copyPublicPreviewUrl">复制 H5 链接</NButton>
          <NButton tertiary @click="openPublicPreview">预览 H5</NButton>
          <NButton type="primary" @click="router.push('/genealogy/new')">新增人物</NButton>
        </div>
      </div>

      <div class="mt-5 grid gap-3 md:grid-cols-4">
        <div class="admin-surface-muted p-4">
          <p class="text-xs uppercase tracking-[0.24em] text-white/35">人物总数</p>
          <p class="mt-3 text-2xl font-semibold text-white">{{ stats.total }}</p>
        </div>
        <div class="admin-surface-muted p-4">
          <p class="text-xs uppercase tracking-[0.24em] text-white/35">根节点</p>
          <p class="mt-3 text-2xl font-semibold text-white">{{ stats.roots }}</p>
        </div>
        <div class="admin-surface-muted p-4">
          <p class="text-xs uppercase tracking-[0.24em] text-white/35">在世人物</p>
          <p class="mt-3 text-2xl font-semibold text-white">{{ stats.living }}</p>
        </div>
        <div class="admin-surface-muted p-4">
          <p class="text-xs uppercase tracking-[0.24em] text-white/35">已录入世代</p>
          <p class="mt-3 text-2xl font-semibold text-white">{{ stats.maxGeneration }}</p>
        </div>
      </div>
    </NCard>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_320px]">
      <NCard class="admin-toolbar-card" :bordered="false" title="Topola 谱图预览">
        <template #header-extra>
          <div class="flex items-center gap-2">
            <span class="text-xs text-white/40">点击人物节点可直接弹框编辑</span>
            <NButton tertiary @click="openFullscreenPreview">放大全屏</NButton>
          </div>
        </template>

        <GenealogyTree
          :people="currentFamilyPeople"
          :chart-data="adminStore.genealogyChartData"
          :start-indi-id="adminStore.genealogyStartIndiId"
          :selected-id="selectedPerson?.id || ''"
          @select="selectPersonId"
        />
      </NCard>

      <NCard class="admin-toolbar-card" :bordered="false" title="人物详情">
        <template v-if="selectedPerson">
          <div class="space-y-4">
            <div>
              <p class="text-xs uppercase tracking-[0.24em] text-white/35">人物姓名</p>
              <h3 class="mt-2 text-2xl font-semibold text-white">{{ selectedPerson.name }}</h3>
            </div>

            <div class="grid gap-3">
              <div class="admin-surface-muted p-4">
                <p class="text-xs text-white/35">世代 / 性别</p>
                <p class="mt-2 text-sm font-medium text-white">
                  {{ selectedPerson.generationLabel }} · {{ genderLabel(selectedPerson.gender) }}
                </p>
              </div>
              <div class="admin-surface-muted p-4">
                <p class="text-xs text-white/35">支系 / 状态</p>
                <p class="mt-2 text-sm font-medium text-white">
                  {{ selectedPerson.branchName || "未分支" }} · {{ statusLabel(selectedPerson.status) }}
                </p>
              </div>
              <div class="admin-surface-muted p-4">
                <p class="text-xs text-white/35">上代人物</p>
                <p class="mt-2 text-sm font-medium text-white">
                  {{ currentFamilyPeople.find((item) => item.id === selectedPerson.parentId)?.name || "根节点" }}
                </p>
              </div>
              <div class="admin-surface-muted p-4">
                <p class="text-xs text-white/35">配偶</p>
                <p class="mt-2 text-sm font-medium text-white">{{ selectedPerson.spouseName || "未录入" }}</p>
              </div>
            </div>

            <div class="admin-surface-muted p-4">
              <p class="text-xs text-white/35">人物说明</p>
              <p class="mt-2 text-sm leading-7 text-white/68">{{ selectedPerson.bio || "暂无人物说明" }}</p>
            </div>

            <div class="flex gap-3">
              <NButton type="primary" @click="openEditor(selectedPerson.id)">弹框编辑</NButton>
              <NButton tertiary @click="router.push(`/genealogy/${selectedPerson.id}/edit`)">页面编辑</NButton>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="flex min-h-[320px] items-center justify-center text-sm text-white/46">
            当前家族还没有族谱人物。
          </div>
        </template>
      </NCard>
    </div>

    <NCard class="admin-toolbar-card" :bordered="false" title="人物列表">
      <div class="admin-list-toolbar mb-4">
        <NInput
          v-model:value="keyword"
          class="admin-list-search"
          clearable
          placeholder="按姓名、世代、支系、配偶或简介搜索"
        />
        <div class="admin-list-actions">
          <NButton type="primary" @click="router.push('/genealogy/new')">新增人物</NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="filteredPeople"
        :bordered="false"
        :single-line="false"
      />
    </NCard>

    <NModal v-model:show="previewExpanded">
      <div class="mx-auto flex h-[92vh] w-[96vw] max-w-none flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#10151d] shadow-[0_28px_90px_rgba(0,0,0,0.48)]">
        <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p class="text-xs uppercase tracking-[0.26em] text-white/32">Genealogy Workspace</p>
            <h3 class="mt-2 text-2xl font-semibold text-white">Topola 全屏编辑视图</h3>
            <p class="mt-2 text-sm leading-7 text-white/54">
              这里适合大谱图浏览和节点编辑。点击节点会直接带出人物弹框，右侧持续显示当前人物详情。
            </p>
          </div>

          <div class="flex shrink-0 gap-3">
            <NButton tertiary @click="router.push('/genealogy/new')">新增人物</NButton>
            <NButton tertiary @click="previewExpanded = false">关闭全屏</NButton>
          </div>
        </div>

        <div class="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div class="min-h-0 overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.02] p-4">
            <GenealogyTree
              expanded
              :people="currentFamilyPeople"
              :chart-data="adminStore.genealogyChartData"
              :start-indi-id="adminStore.genealogyStartIndiId"
              :selected-id="selectedPerson?.id || ''"
              @select="selectPersonId"
            />
          </div>

          <div class="min-h-0 overflow-auto rounded-[24px] border border-white/8 bg-white/[0.02] p-5">
            <template v-if="selectedPerson">
              <div class="space-y-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs uppercase tracking-[0.24em] text-white/35">当前聚焦人物</p>
                    <h4 class="mt-2 text-2xl font-semibold text-white">{{ selectedPerson.name }}</h4>
                  </div>
                  <NTag round type="info">{{ selectedPerson.generationLabel }}</NTag>
                </div>

                <div class="grid gap-3">
                  <div class="admin-surface-muted p-4">
                    <p class="text-xs text-white/35">支系 / 状态</p>
                    <p class="mt-2 text-sm font-medium text-white">
                      {{ selectedPerson.branchName || "未分支" }} · {{ statusLabel(selectedPerson.status) }}
                    </p>
                  </div>
                  <div class="admin-surface-muted p-4">
                    <p class="text-xs text-white/35">上代人物</p>
                    <p class="mt-2 text-sm font-medium text-white">
                      {{ currentFamilyPeople.find((item) => item.id === selectedPerson.parentId)?.name || "根节点" }}
                    </p>
                  </div>
                  <div class="admin-surface-muted p-4">
                    <p class="text-xs text-white/35">配偶</p>
                    <p class="mt-2 text-sm font-medium text-white">{{ selectedPerson.spouseName || "未录入" }}</p>
                  </div>
                </div>

                <div class="admin-surface-muted p-4">
                  <p class="text-xs text-white/35">人物说明</p>
                  <p class="mt-2 text-sm leading-7 text-white/68">{{ selectedPerson.bio || "暂无人物说明" }}</p>
                </div>

                <NButton type="primary" block @click="openEditor(selectedPerson.id)">编辑当前人物</NButton>
              </div>
            </template>

            <template v-else>
              <div class="flex h-full min-h-[240px] items-center justify-center text-sm text-white/42">
                当前还没有可聚焦的人物节点。
              </div>
            </template>
          </div>
        </div>
      </div>
    </NModal>

    <NModal v-model:show="editorVisible" preset="card" class="max-w-3xl" title="编辑族谱人物" :bordered="false">
      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="所属家族">
            <NSelect v-model:value="editForm.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="人物姓名">
            <NInput v-model:value="editForm.name" placeholder="请输入族谱人物姓名" />
          </NFormItem>
          <NFormItem label="性别">
            <NSelect v-model:value="editForm.gender" :options="genderOptions" />
          </NFormItem>
          <NFormItem label="状态">
            <NSelect v-model:value="editForm.status" :options="statusOptions" />
          </NFormItem>
          <NFormItem label="世代序号">
            <NInputNumber v-model:value="editForm.generationLevel" :min="1" :show-button="false" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="世代名称">
            <NInput v-model:value="editForm.generationLabel" placeholder="例如：一世 / 二世 / 三世" />
          </NFormItem>
          <NFormItem label="支系">
            <NInput v-model:value="editForm.branchName" placeholder="例如：宗脉主支 / 东房 / 南支" />
          </NFormItem>
          <NFormItem label="上代人物">
            <NSelect
              v-model:value="editForm.parentId"
              clearable
              :options="parentOptions"
              placeholder="可选，用于形成简单谱系关系"
            />
          </NFormItem>
          <NFormItem label="配偶姓名">
            <NInput v-model:value="editForm.spouseName" placeholder="简单版先维护配偶姓名" />
          </NFormItem>
          <NFormItem label="同代排序">
            <NInputNumber v-model:value="editForm.sortOrder" :min="1" :show-button="false" style="width: 100%;" />
          </NFormItem>
          <NFormItem class="md:col-span-2" label="人物说明">
            <NInput
              v-model:value="editForm.bio"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 5 }"
              placeholder="记录人物简介、支系说明或备注信息"
            />
          </NFormItem>
        </div>
      </NForm>

      <div class="admin-surface-muted mt-2 p-4 text-sm leading-7 text-white/58">
        点击谱图节点后会直接带出这个弹框，适合快速改姓名、支系、上代、配偶和说明；复杂调整仍可进入独立编辑页。
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton tertiary @click="closeEditor">取消</NButton>
          <NButton
            tertiary
            :disabled="!editingId"
            @click="editingId && router.push(`/genealogy/${editingId}/edit`)"
          >
            页面编辑
          </NButton>
          <NButton type="primary" :loading="editorSaving" @click="submitEditor">保存修改</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
