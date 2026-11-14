<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElDatePicker, ElConfigProvider } from 'element-plus'
import es from 'element-plus/es/locale/lang/es'
import 'element-plus/dist/index.css'
import type { DateRangeValue } from '@/utils/dateRange'

const props = withDefaults(
  defineProps<{
    modelValue?: DateRangeValue
    startPlaceholder?: string
    endPlaceholder?: string
    clearable?: boolean
  }>(),
  {
    modelValue: null,
    startPlaceholder: 'Inicio',
    endPlaceholder: 'Fin',
    clearable: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeValue]
  change: [value: DateRangeValue]
}>()

const pickerRef = ref<InstanceType<typeof ElDatePicker> | null>(null)

const dates = computed({
  get: () => props.modelValue,
  set: (val: DateRangeValue) => {
    emit('update:modelValue', val)
    emit('change', val)
  },
})

function openPicker() {
  const picker = pickerRef.value as any
  if (!picker) return
  if (typeof picker.handleOpen === 'function') {
    picker.handleOpen()
    return
  }
  if (typeof picker.focus === 'function') {
    picker.focus()
    return
  }
  // Fallback: click en el editor
  const el = picker.$el as HTMLElement | undefined
  const editor =
    el?.querySelector?.('.el-range-editor') ||
    el?.querySelector?.('.el-date-editor') ||
    el
  ;(editor as HTMLElement | undefined)?.click?.()
}

defineExpose({ openPicker, pickerRef })
</script>

<template>
  <ElConfigProvider :locale="es">
    <div class="date-range-filter">
      <ElDatePicker
        ref="pickerRef"
        v-model="dates"
        type="daterange"
        size="small"
        range-separator="–"
        :start-placeholder="startPlaceholder"
        :end-placeholder="endPlaceholder"
        value-format="YYYY-MM-DD"
        format="DD/MM/YY"
        :unlink-panels="true"
        :single-panel="true"
        :editable="false"
        :clearable="clearable"
        :teleported="true"
        placement="bottom-end"
        class="date-range-filter__picker"
      />
    </div>
  </ElConfigProvider>
</template>

<style scoped>
.date-range-filter {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  flex: 0 1 auto;
  max-width: 100%;
}

.date-range-filter__picker {
  width: auto !important;
  max-width: 100%;
}

:deep(.el-date-editor.el-input__wrapper),
:deep(.el-range-editor.el-input__wrapper) {
  width: auto !important;
  max-width: 100%;
  padding: 0 6px;
  min-height: 28px;
}

:deep(.el-range-input) {
  font-size: 0.8rem;
  width: 4.6rem;
}

:deep(.el-range-separator) {
  flex: 0;
  padding: 0 2px;
  font-size: 0.75rem;
  line-height: 1;
}

:deep(.el-range__icon),
:deep(.el-range__close-icon) {
  font-size: 0.85rem;
}
</style>
