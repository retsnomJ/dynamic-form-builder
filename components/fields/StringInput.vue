<template>
  <el-input
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="config.clearable"
    :size="config.size"
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
  componentConfig?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  componentConfig: () => ({})
})

const config = computed(() => props.componentConfig || {})
</script>