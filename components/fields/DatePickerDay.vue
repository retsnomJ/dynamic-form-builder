<template>
  <el-date-picker
    :model-value="modelValue"
    type="date"
    :placeholder="placeholder"
    :disabled="disabled"
    :format="format"
    :value-format="valueFormat"
    :size="config.size"
    :style="config.style"
    class="!w-full"
    @update:model-value="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
    @focus="$emit('focus')"
    @blur="$emit('blur')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: any
  placeholder?: string
  disabled?: boolean
  format?: string
  valueFormat?: string
  componentConfig?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  format: 'YYYY-MM-DD',
  valueFormat: 'x',
  componentConfig: () => ({})
})

const config = computed(() => props.componentConfig || {})
</script>