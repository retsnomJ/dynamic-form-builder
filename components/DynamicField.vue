<template>
  <el-form-item 
    :label="fieldConfig.fieldLabel" 
    :prop="fieldConfig.fieldName"
    :required="fieldConfig.required"
  >
    <!-- 字符串输入框 -->
    <el-input
      v-if="fieldConfig.fieldType === 'string'"
      :model-value="modelValue"
      :placeholder="getPlaceholder()"
      :disabled="isDisabled"
      :clearable="componentConfig.clearable"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 多行文本框 -->
    <el-input
      v-else-if="fieldConfig.fieldType === 'textarea'"
      :model-value="modelValue"
      type="textarea"
      :placeholder="getPlaceholder()"
      :disabled="isDisabled"
      :rows="componentConfig.rows || 3"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 数字输入框 -->
    <el-input-number
      v-else-if="fieldConfig.fieldType === 'integer' || fieldConfig.fieldType === 'float'"
      :model-value="modelValue"
      :placeholder="getPlaceholder()"
      :disabled="isDisabled"
      :min="componentConfig.min"
      :max="componentConfig.max"
      :precision="fieldConfig.fieldType === 'float' ? (componentConfig.precision || 2) : 0"
      class="!w-full"
      @update:model-value="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 日期选择器 -->
    <el-date-picker
      v-else-if="fieldConfig.fieldType === 'date'"
      :model-value="modelValue"
      type="date"
      :placeholder="getPlaceholder()"
      :disabled="isDisabled"
      :format="componentConfig.format || 'YYYY-MM-DD'"
      value-format="x"
      class="!w-full"
      @update:model-value="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <!-- 下拉选择框 -->
    <el-select
      v-else-if="fieldConfig.fieldType === 'select'"
      :model-value="modelValue"
      :placeholder="getPlaceholder()"
      :disabled="isDisabled"
      :clearable="componentConfig.clearable"
      :filterable="componentConfig.filterable"
      :multiple="componentConfig.multiple"
      :remote="hasRemoteDataSource"
      :remote-method="hasRemoteDataSource ? handleRemoteSearch : undefined"
      class="!w-full"
      @update:model-value="handleSelectChange"
      @focus="handleFocus"
      @blur="handleBlur"
    >
      <el-option
        v-for="option in options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
        :disabled="option.disabled"
      />
    </el-select>

    <!-- 单选框组 -->
    <el-radio-group
      v-else-if="fieldConfig.fieldType === 'radio'"
      :model-value="modelValue"
      :disabled="isDisabled"
      @update:model-value="handleInput"
      @change="handleChange"
    >
      <el-radio
        v-for="option in options"
        :key="option.value"
        :label="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </el-radio>
    </el-radio-group>

    <!-- 多选框组 -->
    <el-checkbox-group
      v-else-if="fieldConfig.fieldType === 'checkbox'"
      :model-value="modelValue"
      :disabled="isDisabled"
      @update:model-value="handleInput"
      @change="handleChange"
    >
      <el-checkbox
        v-for="option in options"
        :key="option.value"
        :label="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </el-checkbox>
    </el-checkbox-group>

    <!-- 未支持的字段类型 -->
    <div v-else class="text-red-500">
      不支持的字段类型: {{ fieldConfig.fieldType }}
    </div>
  </el-form-item>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import type { FieldConfig, OptionItem } from '../types/form-config'

interface Props {
  fieldConfig: FieldConfig
  modelValue: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'fieldChange', fieldName: string, value: any, selectedOption?: OptionItem): void
  (e: 'fieldFocus', fieldName: string): void
  (e: 'fieldBlur', fieldName: string): void
  (e: 'fieldInput', fieldName: string, value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 组件配置
const componentConfig = computed(() => props.fieldConfig.componentConfig || {})

// 是否禁用
const isDisabled = computed(() => 
  props.fieldConfig.disabled === true
)

// 选项数据
const options = ref<OptionItem[]>([])

// 是否有远程数据源
const hasRemoteDataSource = computed(() => 
  props.fieldConfig.dataSource?.type === 'api'
)

// 获取占位符文本
const getPlaceholder = () => {
  if (componentConfig.value.placeholder) {
    return componentConfig.value.placeholder
  }
  
  const typeMap = {
    string: '请输入',
    textarea: '请输入',
    integer: '请输入',
    float: '请输入',
    date: '请选择',
    select: '请选择',
    radio: '请选择',
    checkbox: '请选择'
  }
  
  const prefix = typeMap[props.fieldConfig.fieldType] || '请输入'
  return `${prefix}${props.fieldConfig.fieldLabel}`
}

// 加载选项数据
const loadOptions = async (searchKeyword?: string) => {
  if (!props.fieldConfig.dataSource) {
    return
  }

  const { dataSource } = props.fieldConfig
  
  try {
    if (dataSource.type === 'static' && dataSource.options) {
      // 静态数据
      options.value = dataSource.options
    } else if (dataSource.type === 'api' && dataSource.url) {
      // API数据源
      console.log('正在请求API:', dataSource.url, '搜索关键词:', searchKeyword)
      
      // 构建请求URL
      let url = dataSource.url
      const params = new URLSearchParams()
      
      // 添加参数
      if (dataSource.params) {
        Object.keys(dataSource.params).forEach(key => {
          let value = dataSource.params![key]
          // 替换搜索关键词占位符
          if (value === '{searchKeyword}' && searchKeyword) {
            value = searchKeyword
          }
          if (value && value !== '{searchKeyword}') {
            params.append(key, value)
          }
        })
      }
      
      // 如果有参数，添加到URL
      if (params.toString()) {
        url += (url.includes('?') ? '&' : '?') + params.toString()
      }
      
      console.log('最终请求URL:', url)
      
      // 发送请求
      const response = await fetch(url, {
        method: dataSource.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...dataSource.headers
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // 检查响应内容类型
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API返回的不是JSON格式数据，而是: ${contentType}`)
      }
      
      const result = await response.json()
      console.log('API响应:', result)
      
      // 处理响应数据
      let data = result
      if (dataSource.dataPath) {
        // 如果指定了数据路径，提取对应的数据
        data = result[dataSource.dataPath]
      }
      
      if (Array.isArray(data)) {
        // 映射数据格式
        const mapping = dataSource.responseMapping || { value: 'value', label: 'label' }
        options.value = data.map(item => ({
          value: item[mapping.value || 'value'],
          label: item[mapping.label || 'label'],
          disabled: item.disabled || false,
          // 保存原始数据和自定义数据
          ...item,
          ...(mapping.customData ? Object.keys(mapping.customData).reduce((acc, key) => {
            acc[key] = item[mapping.customData![key]]
            return acc
          }, {} as Record<string, any>) : {})
        }))
        
        console.log('处理后的选项数据:', options.value)
      } else {
        console.warn('API返回的数据不是数组格式:', data)
        options.value = []
      }
    } else if (dataSource.type === 'computed' && dataSource.expression) {
      // 计算数据 - 后续实现
      console.log('TODO: 实现计算数据', dataSource.expression)
      options.value = []
    }
  } catch (error) {
    console.error('加载选项数据失败:', error)
    options.value = []
  }
}

// 远程搜索处理
const searchTimeout = ref<NodeJS.Timeout | null>(null)

const handleRemoteSearch = (query: string) => {
  console.log('远程搜索:', query)
  
  // 清除之前的定时器
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // 如果查询为空，清空选项
  if (!query || query.trim() === '') {
    options.value = []
    return
  }
  
  // 设置防抖延迟
  searchTimeout.value = setTimeout(() => {
    loadOptions(query.trim())
  }, 300) // 300ms 防抖延迟
}

// 事件处理
const handleChange = (value: any) => {
  emit('update:modelValue', value)
  emit('fieldChange', props.fieldConfig.fieldName, value)
}

const handleSelectChange = (value: any) => {
  const selectedOption = options.value.find(opt => opt.value === value)
  
  // 先发出字段变更事件，让父组件处理联动逻辑
  emit('fieldChange', props.fieldConfig.fieldName, value, selectedOption)
  
  // 然后更新v-model值
  emit('update:modelValue', value)
}

const handleFocus = () => {
  emit('fieldFocus', props.fieldConfig.fieldName)
}

const handleBlur = () => {
  emit('fieldBlur', props.fieldConfig.fieldName)
}

// 处理输入事件
const handleInput = (value: any) => {
  emit('update:modelValue', value)
}

// 监听字段配置变化，重新加载选项
watch(() => props.fieldConfig.dataSource, () => {
  loadOptions()
}, { deep: true })

// 组件挂载时加载选项
onMounted(() => {
  loadOptions()
})
</script>