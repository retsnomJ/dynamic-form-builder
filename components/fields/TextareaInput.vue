<template>
  <el-input
    :model-value="modelValue"
    type="textarea"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :style="config.style"
    @input="$emit('update:modelValue', $event)"
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
  rows?: number
  componentConfig?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  rows: 3,
  componentConfig: () => ({})
})

const config = computed(() => props.componentConfig || {})
</script>