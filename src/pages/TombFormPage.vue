<script setup lang="ts">
import { computed, reactive, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NUpload,
  useMessage,
  type UploadCustomRequestOptions,
} from "naive-ui";
import LocationPickerMap from "@/components/LocationPickerMap.vue";
import { uploadImage } from "@/lib/http";
import { useAdminStore } from "@/stores/admin";
import type { TombPoint } from "@/types/models";

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const message = useMessage();
const uploading = ref(false);
const pickerVisible = ref(false);

const familyOptions = computed(() =>
  adminStore.families.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

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

const isEdit = computed(() => route.path.endsWith("/edit"));
const editingId = computed(() => String(route.params.id ?? ""));
const targetPoint = computed(() => adminStore.tombs.find((item) => item.id === editingId.value) ?? null);

function fillForm(point?: TombPoint | null) {
  form.familyId = point?.familyId ?? adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.name = point?.name ?? "";
  form.titleName = point?.titleName ?? "";
  form.generation = point?.generation ?? "";
  form.branchName = point?.branchName ?? "";
  form.lng = point ? String(point.lng) : "121.493700";
  form.lat = point ? String(point.lat) : "31.215400";
  form.areaName = point?.areaName ?? "";
  form.description = point?.description ?? "";
  form.coverImage = point?.coverImage ?? "";
}

watch(
  () => [isEdit.value, targetPoint.value, adminStore.currentFamily?.id, adminStore.families.length] as const,
  ([editing, point]) => {
    if (editing) {
      if (point) {
        fillForm(point);
      }
      return;
    }

    fillForm(null);
  },
  { immediate: true },
);

function updatePickedLocation(payload: { lng: number; lat: number }) {
  form.lng = payload.lng.toFixed(6);
  form.lat = payload.lat.toFixed(6);
}

const normalizedLng = computed(() => {
  const value = Number(form.lng);
  return Number.isFinite(value) ? value : null;
});

const normalizedLat = computed(() => {
  const value = Number(form.lat);
  return Number.isFinite(value) ? value : null;
});

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
    if (isEdit.value) {
      if (!editingId.value) {
        message.warning("缺少点位 ID");
        return;
      }
      await adminStore.updateTomb(editingId.value, payload);
      message.success("点位已更新");
    } else {
      await adminStore.createTomb(payload);
      message.success("点位已创建");
    }

    void router.push("/tombs");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "点位保存失败");
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
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" :title="isEdit ? '编辑点位' : '新增点位'">
      <template #header-extra>
        <NButton tertiary @click="router.push('/tombs')">返回列表</NButton>
      </template>

      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="点位名称">
            <NInput v-model:value="form.name" placeholder="请输入祭扫点位名称" />
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
          <NFormItem label="经度">
            <NInput v-model:value="form.lng" />
          </NFormItem>
          <NFormItem label="纬度">
            <NInput v-model:value="form.lat" />
          </NFormItem>
          <NFormItem class="md:col-span-2" label="封面图地址">
            <NInput v-model:value="form.coverImage" placeholder="可手动填写，也可直接上传图片" />
          </NFormItem>
          <NFormItem class="md:col-span-2" label="点位说明">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 4 }"
              placeholder="记录点位背景、识别方式或祭扫提示"
            />
          </NFormItem>
        </div>

        <div class="admin-surface-muted mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4">
          <div>
            <p class="text-sm text-white">地图点选定位</p>
            <p class="text-xs text-white/58">
              支持地名搜索和地图点选。当前坐标：{{ normalizedLng ?? "--" }}, {{ normalizedLat ?? "--" }}
            </p>
          </div>
          <NButton type="primary" @click="pickerVisible = true">打开地图</NButton>
        </div>
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

      <div class="flex justify-end gap-3">
        <NButton tertiary @click="router.push('/tombs')">取消</NButton>
        <NButton type="primary" @click="submit">
          {{ isEdit ? "保存点位" : "创建点位" }}
        </NButton>
      </div>
    </NCard>

    <NModal
      v-model:show="pickerVisible"
      preset="card"
      style="width: min(1100px, 94vw);"
      title="地图选点"
    >
      <LocationPickerMap
        :lng="normalizedLng"
        :lat="normalizedLat"
        height-class="h-[68vh]"
        :enable-search="true"
        @pick="updatePickedLocation"
      />

      <template #footer>
        <div class="flex justify-end gap-3">
          <NButton tertiary @click="pickerVisible = false">关闭</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>
