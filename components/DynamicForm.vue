<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    :label-width="config.layout?.labelWidth || '120px'"
    :label-position="config.layout?.labelPosition || 'right'"
    :size="config.layout?.size || 'default'"
    v-loading="formLoading"
  >
    <el-row :gutter="config.layout?.gutter || 20">
      <el-col
        v-for="field in visibleFields"
        :key="field.fieldName"
        :span="field.layout?.span ?? defaultSpan"
        :offset="field.layout?.offset || 0"
      >
        <DynamicField
          :field-config="field"
          v-model="formData[field.fieldName]"
          :form-context="formData"
          @field-change="handleFieldChange"
          @field-focus="handleFieldFocus"
          @field-blur="handleFieldBlur"
          @field-input="handleFieldInput"
        />
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import DynamicField from './DynamicField.vue'
import type { FormConfig, FieldConfig, FormData, OptionItem } from '../types/form-config'

/** 通用动态表单组件 */
defineOptions({ name: 'DynamicForm' })

interface Props {
  // 表单配置
  config: FormConfig
  // 表单数据
  modelValue?: FormData
}

interface Emits {
  (e: 'update:modelValue', value: FormData): void
  (e: 'submit', formData: FormData): void
  (e: 'reset'): void
  (e: 'fieldChange', fieldName: string, value: any, selectedOption?: OptionItem): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref()
const formLoading = ref(false)
const formData = ref<FormData>({ ...props.modelValue })
const formRules = reactive<Record<string, any>>({})

// 计算属性
// 可见字段
const visibleFields = computed(() => {
  return props.config.fields.filter(field => field.visible !== false)
})

const defaultSpan = computed(() => {
  const cols = props.config.layout?.columns || 2
  const span = Math.floor(24 / cols)
  return span
})

// 用于防止循环更新的标志
const isUpdatingFromParent = ref(false)

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && !isUpdatingFromParent.value) {
    isUpdatingFromParent.value = true
    formData.value = { ...newValue }
    nextTick(() => {
      isUpdatingFromParent.value = false
    })
  }
}, { deep: true })

// 监听内部数据变化，向外发送
watch(formData, (newValue) => {
  if (!isUpdatingFromParent.value) {
    emit('update:modelValue', { ...newValue })
  }
}, { deep: true })

// 初始化表单数据和验证规则
const initForm = () => {
  // 重置表单数据
  const newFormData: FormData = { ...props.modelValue }
  const newFormRules: Record<string, any> = {}

  // 遍历字段配置，初始化数据和规则
  props.config.fields.forEach(field => {
    // 初始化字段默认值
    if (!(field.fieldName in newFormData)) {
      newFormData[field.fieldName] = getDefaultValue(field)
    }

    // 构建验证规则
    if (field.required || field.validation?.rules) {
      const rules: any[] = []
      
      // 必填验证
      if (field.required) {
        rules.push({
          required: true,
          message: `请输入${field.fieldLabel}`,
          trigger: ['blur', 'change']
        })
      }

      // 自定义验证规则
      if (field.validation?.rules) {
        rules.push(...field.validation.rules)
      }

      if (rules.length > 0) {
        newFormRules[field.fieldName] = rules
      }
    }
  })

  formData.value = newFormData
  Object.assign(formRules, newFormRules)
}

// 获取字段默认值
const getDefaultValue = (field: FieldConfig): any => {
  switch (field.fieldType) {
    case 'string':
    case 'textarea':
      return ''
    case 'integer':
    case 'float':
      return undefined
    case 'date':
      return null
    case 'select':
    case 'radio':
      return undefined
    case 'checkbox':
      return []
    default:
      return undefined
  }
}

// 字段变更处理
const handleFieldChange = (fieldName: string, value: any, selectedOption?: OptionItem) => {
  console.log('字段变更:', { fieldName, value, selectedOption })
  
  // 获取当前字段配置
  const field = props.config.fields.find(f => f.fieldName === fieldName)
  
  // 记录旧值用于调试
  const oldValue = formData.value[fieldName]
  console.log(`值比较: oldValue=${oldValue} (${typeof oldValue}), newValue=${value} (${typeof value})`)
  
  // 先更新表单数据
  formData.value[fieldName] = value
  
  // 处理字段联动事件（使用更新后的formData）
  // 注意：总是处理联动事件，因为即使当前字段值相同，其他依赖字段可能已经变化
  if (field?.events) {
    console.log(`处理字段 ${fieldName} 的联动事件`)
    processFieldEvents(field, value, selectedOption)
  }
  
  // 向外发送事件
  emit('fieldChange', fieldName, value, selectedOption)
}

// 处理字段事件
const processFieldEvents = (field: FieldConfig, _value: any, selectedOption?: OptionItem, eventType: string = 'change') => {
  if (!field.events) return

  console.log(`处理字段 ${field.fieldName} 的 ${eventType} 事件`)

  field.events.forEach(event => {
    if (event.type === eventType) {
      console.log('匹配到事件:', event)
      event.actions.forEach(action => {
        console.log('执行动作:', action)
        
        // 检查动作级别的条件
        if (action.condition && !evaluateCondition(action.condition, selectedOption)) {
          console.log('条件不满足，跳过动作')
          return
        }
        
        if (action.type === 'setValue') {
          let targetValue: any
          
          if (action.sourceExpression) {
            // 使用表达式计算值
            console.log('计算表达式:', action.sourceExpression)
            targetValue = evaluateExpression(action.sourceExpression, selectedOption)
            console.log('表达式计算结果:', targetValue)
          } else if (action.value !== undefined) {
            // 使用直接值
            targetValue = action.value
          }
          
          if (targetValue !== undefined && action.targetField) {
            // 防止递归更新：检查目标字段的值是否真的需要改变
            const oldTargetValue = formData.value[action.targetField]
            if (oldTargetValue !== targetValue) {
              console.log(`设置字段 ${action.targetField} 的值从 ${oldTargetValue} 改为 ${targetValue}`)
              formData.value[action.targetField] = targetValue
            } else {
              console.log(`字段 ${action.targetField} 的值未变化，跳过设置`)
            }
          }
        }
      })
    }
  })
}

// 简单的表达式求值（支持 selectedOption.property 和 formData.property 格式）
const evaluateExpression = (expression: string, selectedOption?: OptionItem): any => {
  try {
    if (expression.startsWith('selectedOption.')) {
      if (!selectedOption) return undefined
      const property = expression.replace('selectedOption.', '')
      return (selectedOption as any)[property]
    } else if (expression.includes('formData.')) {
      // 支持复杂的formData表达式计算
      // 创建一个安全的计算环境
      // const context = {
      //   formData: formData.value,
      //   selectedOption: selectedOption || {}
      // }
      
      // 简单的表达式替换和计算
      let evalExpression = expression
      
      // 替换formData引用
      Object.keys(formData.value).forEach(key => {
        const regex = new RegExp(`formData\\.${key}`, 'g')
        const value = formData.value[key]
        if (typeof value === 'string') {
          evalExpression = evalExpression.replace(regex, `"${value}"`)
        } else {
          evalExpression = evalExpression.replace(regex, String(value || 0))
        }
      })
      
      // 替换selectedOption引用
      if (selectedOption) {
        Object.keys(selectedOption).forEach(key => {
          const regex = new RegExp(`selectedOption\\.${key}`, 'g')
          const value = (selectedOption as any)[key]
          if (typeof value === 'string') {
            evalExpression = evalExpression.replace(regex, `"${value}"`)
          } else {
            evalExpression = evalExpression.replace(regex, String(value || 0))
          }
        })
      }
      
      console.log('原始表达式:', expression)
      console.log('计算表达式:', evalExpression)
      
      // 使用Function构造器进行安全计算
      try {
        const result = new Function('return ' + evalExpression)()
        console.log('计算结果:', result)
        return result
      } catch (error) {
        console.warn('表达式计算失败:', evalExpression, error)
        return undefined
      }
    }
    return undefined
  } catch (error) {
    console.warn('表达式求值失败:', expression, error)
    return undefined
  }
}

// 条件判断
const evaluateCondition = (condition: string, selectedOption?: OptionItem): boolean => {
  try {
    // 简单的条件判断，支持formData引用和selectedOption引用
    // let evalCondition = condition
    
    // 创建一个安全的执行环境
    const context = {
      selectedOption: selectedOption || {},
      formData: formData.value
    }
    
    console.log('条件判断:', condition, '上下文:', context)
    
    // 使用Function构造器创建一个带有上下文的函数
    const func = new Function('selectedOption', 'formData', `return ${condition}`)
    const result = func(context.selectedOption, context.formData)
    
    console.log('条件判断结果:', result)
    return Boolean(result)
  } catch (error) {
    console.warn('条件判断失败:', condition, error)
    return false
  }
}

// 字段聚焦处理
const handleFieldFocus = (fieldName: string) => {
  console.log('字段聚焦:', fieldName)
}

// 字段失焦处理
const handleFieldBlur = (fieldName: string) => {
  console.log('字段失焦:', fieldName)
  
  // 处理字段失焦事件
  const field = props.config.fields.find(f => f.fieldName === fieldName)
  if (field?.events) {
    processFieldEvents(field, formData.value[fieldName], undefined, 'blur')
  }
}

// 字段输入处理
const handleFieldInput = (fieldName: string, value: any) => {
  console.log('字段输入:', fieldName, value)
}

// 表单提交
const submitForm = async () => {
  try {
    formLoading.value = true
    const isValid = await formRef.value?.validate()
    if (isValid) {
      emit('submit', { ...formData.value })
      return true
    }
    return false
  } catch (error) {
    console.error('表单验证失败:', error)
    return false
  } finally {
    formLoading.value = false
  }
}

// 表单重置
const resetFields = () => {
  formRef.value?.resetFields()
  initForm()
  emit('reset')
}

// 表单验证
const validate = async () => {
  try {
    return await formRef.value?.validate()
  } catch (error) {
    throw error
  }
}

// 清空验证
const clearValidate = (props?: string | string[]) => {
  formRef.value?.clearValidate(props)
}

// 暴露方法给父组件
defineExpose({
  submitForm,
  resetFields,
  validate,
  clearValidate,
  formData: computed(() => formData.value)
})

// 初始化
initForm()

// 监听配置变化，重新初始化
watch(() => props.config, () => {
  nextTick(() => {
    initForm()
  })
}, { deep: true })
</script>

<style scoped>
.el-form {
  padding: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-input-number) {
  width: 100%;
}
</style>
