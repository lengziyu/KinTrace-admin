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
  NImage,
  NInput,
  NSelect,
  NSpace,
  NUpload,
  useMessage,
  type DataTableColumns,
  type UploadCustomRequestOptions,
} from "naive-ui";
import LocationPickerMap from "@/components/LocationPickerMap.vue";
import TombCover from "@/components/TombCover.vue";
import { uploadImage } from "@/lib/http";
import { useAdminStore } from "@/stores/admin";
import type { TombPoint } from "@/types/models";

const adminStore = useAdminStore();
const message = useMessage();
const drawerVisible = ref(false);
const editingId = ref("");
const keyword = ref("");
const uploading = ref(false);

const form = reactive({
  familyId: "",
  name: "",
  titleName: "",
  generation: "",
  branchName: "",
  lng: "121.493700",
  lat: "31.215400",
  areaName: "",
  description: "",
  coverImage: "",
});

const familyOptions = computed(() =>
  adminStore.families.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const filteredPoints = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return adminStore.tombs.filter((point) => {
    if (familyId && point.familyId !== familyId) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return [point.name, point.titleName, point.branchName, point.areaName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

function resetForm() {
  form.familyId = adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.name = "";
  form.titleName = "";
  form.generation = "";
  form.branchName = "";
  form.lng = "121.493700";
  form.lat = "31.215400";
  form.areaName = "";
  form.description = "";
  form.coverImage = "";
  editingId.value = "";
}

function openCreateDrawer() {
  resetForm();
  drawerVisible.value = true;
}

function openEditDrawer(pointId: string) {
  const point = adminStore.tombs.find((item) => item.id === pointId);
  if (!point) {
    return;
  }

  editingId.value = point.id;
  form.familyId = point.familyId;
  form.name = point.name;
  form.titleName = point.titleName ?? "";
  form.generation = point.generation ?? "";
  form.branchName = point.branchName ?? "";
  form.lng = String(point.lng);
  form.lat = String(point.lat);
  form.areaName = point.areaName ?? "";
  form.description = point.description ?? "";
  form.coverImage = point.coverImage ?? "";
  drawerVisible.value = true;
}

function updatePickedLocation(payload: { lng: number; lat: number }) {
  form.lng = payload.lng.toFixed(6);
  form.lat = payload.lat.toFixed(6);
}

async function submit() {
  const payload = {
    familyId: form.familyId || adminStore.currentFamily?.id || "",
    name: form.name.trim(),
    titleName: form.titleName.trim() || null,
    generation: form.generation.trim() || null,
    branchName: form.branchName.trim() || null,
    lng: Number(form.lng),
    lat: Number(form.lat),
    areaName: form.areaName.trim() || null,
    description: form.description.trim() || null,
    coverImage: form.coverImage.trim() || null,
  };

  try {
    if (editingId.value) {
      await adminStore.updateTomb(editingId.value, payload);
      message.success("墓点已更新");
    } else {
      await adminStore.createTomb(payload);
      message.success("墓点已创建");
    }

    drawerVisible.value = false;
    resetForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "墓点保存失败");
  }
}

async function remove(pointId: string) {
  try {
    await adminStore.deleteTomb(pointId);
    message.success("墓点已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "墓点删除失败");
  }
}

async function customUpload(options: UploadCustomRequestOptions) {
  const rawFile = options.file.file;
  if (!(rawFile instanceof File)) {
    options.onError();
    return;
  }

  uploading.value = true;
  try {
    const uploaded = await uploadImage(rawFile);
    form.coverImage = uploaded.url;
    options.onFinish();
    message.success("封面图上传成功");
  } catch (error) {
    options.onError();
    message.error(error instanceof Error ? error.message : "图片上传失败");
  } finally {
    uploading.value = false;
  }
}

const columns = computed<DataTableColumns<TombPoint>>(() => [
  {
    title: "封面",
    key: "coverImage",
    width: 120,
    render: (row) =>
      row.coverImage
        ? h(NImage, {
            src: row.coverImage,
            width: 84,
            height: 56,
            objectFit: "cover",
            style: { borderRadius: "12px" },
          })
        : h(TombCover, { tomb: row, class: "h-[56px] w-[84px]" }),
  },
  {
    title: "墓点信息",
    key: "name",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.name),
        h(
          "p",
          { class: "text-xs text-white/46" },
          `${row.titleName || "未填写称谓"} · ${row.generation || "未填写辈分"}`,
        ),
      ]),
  },
  {
    title: "片区 / 支系",
    key: "areaName",
    render: (row) => `${row.areaName || "未填写片区"} / ${row.branchName || "未填写支系"}`,
  },
  {
    title: "坐标",
    key: "location",
    render: (row) => `${row.lng}, ${row.lat}`,
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
    <NCard class="admin-toolbar-card" :bordered="false" title="祭扫墓点列表">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NInput v-model:value="keyword" placeholder="按名称、称谓、支系或片区搜索" clearable />
        <NButton type="primary" @click="openCreateDrawer">新增墓点</NButton>
      </div>

      <NDataTable
        :columns="columns"
        :data="filteredPoints"
        :bordered="false"
        :single-line="false"
      />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="520" placement="right">
      <NDrawerContent :title="editingId ? '编辑墓点' : '新增墓点'" closable>
        <NForm label-placement="top">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="墓点名称">
            <NInput v-model:value="form.name" placeholder="请输入祭扫墓点名称" />
          </NFormItem>
          <NFormItem label="称谓">
            <NInput v-model:value="form.titleName" placeholder="例如：始祖 / 二房先人" />
          </NFormItem>
          <NFormItem label="辈分">
            <NInput v-model:value="form.generation" placeholder="例如：一世 / 三世" />
          </NFormItem>
          <NFormItem label="支系">
            <NInput v-model:value="form.branchName" placeholder="例如：东房 / 宗脉主支" />
          </NFormItem>
          <NFormItem label="片区">
            <NInput v-model:value="form.areaName" placeholder="请输入纪念区或片区名称" />
          </NFormItem>

          <div class="grid gap-3 md:grid-cols-2">
            <NFormItem label="经度">
              <NInput v-model:value="form.lng" />
            </NFormItem>
            <NFormItem label="纬度">
              <NInput v-model:value="form.lat" />
            </NFormItem>
          </div>

          <div class="mb-4 flex flex-wrap items-center gap-3">
            <span class="text-xs text-white/46">支持手动录入经纬度，也支持直接在地图上点选定位。</span>
          </div>

          <LocationPickerMap
            :lng="Number(form.lng)"
            :lat="Number(form.lat)"
            @pick="updatePickedLocation"
          />

          <NFormItem class="mt-4" label="封面图地址">
            <NInput v-model:value="form.coverImage" placeholder="可手动填写，也可以直接上传图片" />
          </NFormItem>
          <NFormItem label="墓点说明">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 4 }"
              placeholder="记录墓点背景、辨识方式或现场提醒"
            />
          </NFormItem>
        </NForm>

        <div class="mb-4">
          <NUpload
            accept="image/*"
            :default-upload="false"
            :custom-request="customUpload"
            :show-file-list="false"
          >
            <NButton :loading="uploading">上传封面图</NButton>
          </NUpload>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton tertiary @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="submit">
              {{ editingId ? "保存墓点" : "创建墓点" }}
            </NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
