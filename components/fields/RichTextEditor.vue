<template>
  <div
    :class="['rte-wrapper', disabled ? 'is-disabled' : '']"
    :style="config.style"
  >
  <div
      class="rte-editor"
      :contenteditable="!disabled"
      :placeholder="placeholder"
      :innerHTML="modelValue || ''"
      @input="onInput"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    />
  </div>
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

const emit = defineEmits<{
  (e: 'update:modelValue', v: any): void
  (e: 'change', v: any): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const onInput = (e: Event) => {
  const html = (e.target as HTMLElement).innerHTML
  emit('update:modelValue', html)
  emit('change', html)
}
</script>

<style scoped>
.rte-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background: #fff;
}
.rte-editor {
  min-height: 120px;
  outline: none;
}
.is-disabled .rte-editor {
  pointer-events: none;
  opacity: 0.6;
}
</style>