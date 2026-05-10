<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { NButton, NInput } from "naive-ui";
import { loadAmap } from "@/lib/amap";

const props = withDefaults(
  defineProps<{
    lng?: number | null;
    lat?: number | null;
    heightClass?: string;
    enableSearch?: boolean;
  }>(),
  {
    heightClass: "h-56",
    enableSearch: false,
  },
);

const emit = defineEmits<{
  pick: [payload: { lng: number; lat: number }];
}>();

const mapRef = ref<HTMLDivElement | null>(null);
const keyword = ref("");
const searching = ref(false);
const searchResults = ref<
  Array<{ id: string; name: string; address: string; lng: number; lat: number }>
>([]);

const mapClass = computed(() => props.heightClass);

let mapInstance: any = null;
let marker: any = null;
let placeSearch: any = null;

function normalizeCoordinate(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function setMarker(AMap: any, lng: number, lat: number) {
  if (!mapInstance) {
    return;
  }

  if (marker) {
    mapInstance.remove(marker);
    marker = null;
  }

  marker = new AMap.Marker({
    position: [lng, lat],
  });
  mapInstance.add(marker);
  mapInstance.setCenter([lng, lat]);
  mapInstance.setZoom(16);
}

function updateMarker(AMap: any, lng?: number | null, lat?: number | null) {
  const validLng = normalizeCoordinate(lng);
  const validLat = normalizeCoordinate(lat);

  if (validLng === null || validLat === null || !mapInstance) {
    return;
  }

  setMarker(AMap, validLng, validLat);
}

function initPlaceSearch(AMap: any) {
  if (!props.enableSearch || placeSearch) {
    return;
  }

  AMap.plugin(["AMap.PlaceSearch"], () => {
    placeSearch = new AMap.PlaceSearch({
      pageSize: 8,
      pageIndex: 1,
      extensions: "all",
    });
  });
}

async function initMap() {
  if (!mapRef.value) {
    return;
  }

  const AMap = await loadAmap();
  if (!AMap) {
    return;
  }

  await nextTick();

  if (!mapInstance) {
    const initLng = normalizeCoordinate(props.lng) ?? 121.4737;
    const initLat = normalizeCoordinate(props.lat) ?? 31.2304;
    mapInstance = new AMap.Map(mapRef.value, {
      zoom: normalizeCoordinate(props.lng) !== null && normalizeCoordinate(props.lat) !== null ? 16 : 13,
      center: [initLng, initLat],
      mapStyle: "amap://styles/whitesmoke",
      viewMode: "2D",
    });

    mapInstance.on("click", (event: any) => {
      const lng = event.lnglat?.getLng?.() ?? event.lnglat?.lng;
      const lat = event.lnglat?.getLat?.() ?? event.lnglat?.lat;
      if (typeof lng === "number" && typeof lat === "number") {
        setMarker(AMap, lng, lat);
        emit("pick", { lng, lat });
      }
    });
  }

  initPlaceSearch(AMap);
  updateMarker(AMap, props.lng, props.lat);
}

async function searchByKeyword() {
  const keywordValue = keyword.value.trim();
  if (!keywordValue) {
    searchResults.value = [];
    return;
  }

  const AMap = await loadAmap();
  if (!AMap) {
    return;
  }

  initPlaceSearch(AMap);
  if (!placeSearch) {
    return;
  }

  searching.value = true;
  placeSearch.search(keywordValue, (status: string, result: any) => {
    searching.value = false;
    if (status !== "complete") {
      searchResults.value = [];
      return;
    }

    const pois = Array.isArray(result?.poiList?.pois) ? result.poiList.pois : [];
    searchResults.value = pois
      .map((poi: any, index: number) => {
        const lng = poi?.location?.getLng?.() ?? poi?.location?.lng;
        const lat = poi?.location?.getLat?.() ?? poi?.location?.lat;
        return {
          id: String(poi?.id ?? `${index}`),
          name: String(poi?.name ?? "未知地点"),
          address: [poi?.cityname, poi?.adname, poi?.address].filter(Boolean).join(" "),
          lng: Number(lng),
          lat: Number(lat),
        };
      })
      .filter((item: { lng: number; lat: number }) => Number.isFinite(item.lng) && Number.isFinite(item.lat));
  });
}

async function pickSearchResult(item: { lng: number; lat: number }) {
  const AMap = await loadAmap();
  if (!AMap) {
    return;
  }

  updateMarker(AMap, item.lng, item.lat);
  emit("pick", { lng: item.lng, lat: item.lat });
}

onMounted(() => {
  void initMap();
});

watch(
  () => [props.lng, props.lat] as const,
  async ([lng, lat]) => {
    const AMap = await loadAmap();
    if (!AMap) {
      return;
    }
    updateMarker(AMap, lng, lat);
  },
);

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
    marker = null;
    placeSearch = null;
  }
});
</script>

<template>
  <div class="space-y-3">
    <div v-if="enableSearch" class="space-y-2">
      <div class="flex flex-wrap gap-2">
        <NInput
          v-model:value="keyword"
          clearable
          placeholder="搜索地名，如 上海市人民广场"
          @keyup.enter="void searchByKeyword()"
        />
        <NButton type="primary" :loading="searching" @click="void searchByKeyword()">搜索地点</NButton>
      </div>

      <div v-if="searchResults.length" class="max-h-40 overflow-y-auto rounded-lg border border-white/12">
        <button
          v-for="item in searchResults"
          :key="item.id"
          type="button"
          class="block w-full border-b border-white/8 px-3 py-2 text-left last:border-b-0 hover:bg-white/6"
          @click="void pickSearchResult(item)"
        >
          <p class="text-sm text-white">{{ item.name }}</p>
          <p class="text-xs text-white/55">{{ item.address || `${item.lng.toFixed(6)}, ${item.lat.toFixed(6)}` }}</p>
        </button>
      </div>
    </div>

    <div ref="mapRef" :class="[mapClass, 'w-full overflow-hidden rounded-lg border border-white/10']" />
  </div>
</template>
