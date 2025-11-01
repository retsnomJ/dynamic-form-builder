<template>
  <el-dialog
    v-model="visible"
    title="智能事件配置助手"
    width="800px"
    :before-close="handleClose"
  >
    <div class="event-config-helper">
      <!-- 自然语言输入区域 -->
      <div class="input-section">
        <h4>描述您的事件需求</h4>
        <p class="hint">
          例如：当产品名称的值以bt开头时，单价在失去焦点时乘以10
        </p>
        <el-input
          v-model="naturalLanguageInput"
          type="textarea"
          :rows="4"
          placeholder="请用自然语言描述您的事件逻辑..."
          class="natural-input"
        />
      </div>

      <!-- 字段信息展示 -->
      <div class="fields-section">
        <h4>可用字段</h4>
        <div class="fields-grid">
          <el-tag
            v-for="field in availableFields"
            :key="field.fieldName"
            class="field-tag"
            :type="getFieldTagType(field.fieldType)"
          >
            {{ field.fieldLabel }} ({{ field.fieldName }})
          </el-tag>
        </div>
      </div>

      <!-- 生成的事件配置预览 -->
      <div v-if="generatedEvent" class="preview-section">
        <h4>生成的事件配置</h4>
        <div class="event-preview">
          <pre><code>{{ formattedEventConfig }}</code></pre>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <el-button @click="generateEvent" type="primary" :loading="generating">
          生成事件配置
        </el-button>
        <el-button @click="applyEvent" :disabled="!generatedEvent">
          应用到字段
        </el-button>
        <el-button @click="handleClose">取消</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FieldConfig, FieldEvent } from '../types/form-config'

interface Props {
  modelValue: boolean
  fields: FieldConfig[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'apply-event', fieldName: string, event: FieldEvent): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const naturalLanguageInput = ref('')
const generating = ref(false)
const generatedEvent = ref<FieldEvent | null>(null)

// 可用字段信息
const availableFields = computed(() => {
  return props.fields.map(field => ({
    fieldName: field.fieldName,
    fieldLabel: field.fieldLabel,
    fieldType: field.fieldType
  }))
})

// 获取字段标签类型
const getFieldTagType = (fieldType: string) => {
  const typeMap: Record<string, string> = {
    'string': 'info',
    'integer': 'warning',
    'float': 'warning',
    'select': 'success',
    'date': 'danger'
  }
  return typeMap[fieldType] || 'info'
}

// 格式化事件配置
const formattedEventConfig = computed(() => {
  if (!generatedEvent.value) return ''
  return JSON.stringify(generatedEvent.value, null, 2)
})

// 提取关键信息用于LLM生成
const extractKeyInfo = () => {
  const fieldInfo = availableFields.value.map(field => ({
    name: field.fieldName,
    label: field.fieldLabel,
    type: field.fieldType
  }))

  return {
    description: naturalLanguageInput.value,
    availableFields: fieldInfo,
    supportedEvents: ['change', 'focus', 'blur', 'input'],
    supportedActions: ['setValue', 'show', 'hide', 'enable', 'disable', 'validate']
  }
}

// 生成LLM提示词
const generateLLMPrompt = (keyInfo: any) => {
  return `
请根据以下信息生成事件配置：

用户描述：${keyInfo.description}

可用字段：
${keyInfo.availableFields.map((f: any) => `- ${f.label}(${f.name}): ${f.type}`).join('\n')}

支持的事件类型：${keyInfo.supportedEvents.join(', ')}
支持的动作类型：${keyInfo.supportedActions.join(', ')}

请生成符合以下格式的JSON配置：
{
  "type": "事件类型(change/focus/blur/input)",
  "condition": "触发条件表达式(可选)",
  "actions": [
    {
      "type": "动作类型",
      "targetField": "目标字段名",
      "sourceExpression": "源表达式",
      "value": "设置的值(可选)",
      "condition": "执行条件(可选)"
    }
  ]
}

注意：
1. 条件表达式使用formData.fieldName格式访问字段值
2. 字符串比较使用startsWith、endsWith、includes等方法
3. 数值计算直接使用数学运算符
4. 只返回JSON配置，不要其他说明文字

生成的事件配置：`
}

// 模拟LLM生成事件配置
const simulateLLMGeneration = async (prompt: string): Promise<FieldEvent> => {
  // 这里模拟LLM的响应，实际项目中应该调用真实的LLM API
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 根据用户输入模拟生成配置
  const input = naturalLanguageInput.value.toLowerCase()
  
  if (input.includes('单价') && input.includes('产品') && input.includes('bt') && input.includes('10')) {
    return {
      type: 'blur',
      actions: [
        {
          type: 'setValue',
          targetField: 'price',
          sourceExpression: 'formData.price * 10',
          condition: 'formData.product && formData.product.startsWith("bt")'
        }
      ]
    }
  }
  
  // 默认返回一个示例配置
  return {
    type: 'change',
    actions: [
      {
        type: 'setValue',
        targetField: 'targetField',
        sourceExpression: 'formData.sourceField'
      }
    ]
  }
}

// 生成事件配置
const generateEvent = async () => {
  if (!naturalLanguageInput.value.trim()) {
    return
  }

  generating.value = true
  
  try {
    const keyInfo = extractKeyInfo()
    const prompt = generateLLMPrompt(keyInfo)
    
    // 调用LLM生成事件配置
    const event = await simulateLLMGeneration(prompt)
    generatedEvent.value = event
  } catch (error) {
    console.error('生成事件配置失败:', error)
  } finally {
    generating.value = false
  }
}

// 应用事件到字段
const applyEvent = () => {
  if (!generatedEvent.value) return
  
  console.group('🎯 应用事件到字段')
  console.log('📋 生成的事件:', generatedEvent.value)
  
  // 找到目标字段
  const targetAction = generatedEvent.value.actions.find(action => action.targetField)
  if (targetAction) {
    console.log('🎯 目标字段:', targetAction.targetField)
    console.log('📤 发出apply-event事件')
    emit('apply-event', targetAction.targetField!, generatedEvent.value)
    handleClose()
  } else {
    console.error('❌ 未找到目标字段')
  }
  console.groupEnd()
}

// 关闭对话框
const handleClose = () => {
  naturalLanguageInput.value = ''
  generatedEvent.value = null
  visible.value = false
}

// 监听对话框打开，重置状态
watch(visible, (newVal) => {
  if (newVal) {
    naturalLanguageInput.value = ''
    generatedEvent.value = null
  }
})
</script>

<style scoped>
.event-config-helper {
  padding: 20px 0;
}

.input-section {
  margin-bottom: 24px;
}

.input-section h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.hint {
  margin: 0 0 12px 0;
  color: #909399;
  font-size: 14px;
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.natural-input {
  width: 100%;
}

.fields-section {
  margin-bottom: 24px;
}

.fields-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.fields-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.field-tag {
  margin: 0;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.event-preview {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  max-height: 200px;
  overflow-y: auto;
}

.event-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}
</style>