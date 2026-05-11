<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  ChartColors,
  createChart,
  DetailedRenderer,
  HourglassChart,
  type ChartHandle,
} from "topola";
import type { GenealogyChartData, GenealogyPerson } from "@/types/models";

const props = withDefaults(
  defineProps<{
    people: GenealogyPerson[];
    chartData: GenealogyChartData;
    startIndiId?: string;
    selectedId?: string;
    emptyText?: string;
    expanded?: boolean;
  }>(),
  {
    startIndiId: "",
    selectedId: "",
    emptyText: "当前家族还没有可展示的族谱数据。",
    expanded: false,
  },
);

const emit = defineEmits<{
  select: [personId: string];
}>();

const svgId = `genealogy-topola-${Math.random().toString(36).slice(2, 9)}`;
const svgRef = ref<SVGSVGElement | null>(null);
const chartHandle = ref<ChartHandle | null>(null);
const currentStartId = ref("");

const realPersonIds = computed(() => new Set(props.people.map((item) => item.id)));
const hasData = computed(() => props.chartData.indis.length > 0);
const svgClasses = computed(() =>
  props.expanded ? "min-h-[78vh] min-w-[1600px]" : "min-h-[560px] min-w-[960px]",
);

function resolveStartId() {
  if (props.selectedId && realPersonIds.value.has(props.selectedId)) {
    return props.selectedId;
  }

  if (props.startIndiId) {
    return props.startIndiId;
  }

  return props.chartData.indis[0]?.id ?? "";
}

async function renderChart() {
  if (!svgRef.value || !hasData.value) {
    return;
  }

  currentStartId.value = resolveStartId();
  await nextTick();

  if (!chartHandle.value) {
    chartHandle.value = createChart({
      json: props.chartData,
      svgSelector: `#${svgId}`,
      chartType: HourglassChart,
      renderer: DetailedRenderer,
      horizontal: true,
      expanders: true,
      animate: true,
      colors: ChartColors.COLOR_BY_GENERATION,
      updateSvgSize: true,
      indiCallback: ({ id }) => {
        if (!realPersonIds.value.has(id)) {
          return;
        }

        currentStartId.value = id;
        emit("select", id);
        void nextTick(() => {
          chartHandle.value?.render({ startIndi: id });
        });
      },
    });
  } else {
    chartHandle.value.setData(props.chartData);
  }

  svgRef.value.innerHTML = "";
  chartHandle.value.render({ startIndi: currentStartId.value });
}

watch(
  () => [props.chartData, props.selectedId, props.startIndiId] as const,
  () => {
    void renderChart();
  },
  { deep: true },
);

onMounted(() => {
  void renderChart();
});
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="hasData"
      class="admin-surface-muted overflow-auto rounded-[24px] p-4"
    >
      <svg
        :id="svgId"
        ref="svgRef"
        :class="svgClasses"
      />
    </div>

    <div
      v-else
      class="rounded-[24px] border border-dashed border-white/12 bg-white/[0.02] px-5 py-8 text-center text-sm text-white/46"
    >
      {{ emptyText }}
    </div>
  </div>
</template>
