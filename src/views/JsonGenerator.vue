<template>
  <div class="json-generator">
    <!-- 页面标题 -->
    <div class="generator-header">
      <h2>JSON配置生成器</h2>
      <p>通过可视化表格配置字段属性，自动生成表单JSON配置</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="generator-content">
      <!-- 左侧：字段配置表格 -->
      <div class="config-panel">
        <div class="panel-header">
          <h3>字段配置</h3>
          <el-button type="primary" @click="addField" icon="Plus">添加字段</el-button>
        </div>

        <!-- 第一行：基本字段信息 -->
        <div class="table-section">
          <h4 class="section-title">基本信息</h4>
          <el-table :data="fields" border style="width: 100%; margin-bottom: 20px;">
            <el-table-column label="字段名称" width="180">
              <template #default="{ row, $index }">
                <el-input 
                  v-model="row.fieldName" 
                  placeholder="fieldName"
                  @blur="validateFieldName($index)"
                />
              </template>
            </el-table-column>

            <el-table-column label="字段标签" width="180">
              <template #default="{ row }">
                <el-input v-model="row.fieldLabel" placeholder="显示标签" />
              </template>
            </el-table-column>

            <el-table-column label="字段类型" width="150">
              <template #default="{ row }">
                <el-select v-model="row.fieldType" placeholder="选择类型" style="width: 100%">
                  <el-option
                    v-for="type in fieldTypes"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="必填" width="80" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.required" />
              </template>
            </el-table-column>

            <el-table-column label="禁用" width="80" align="center">
              <template #default="{ row }">
                <el-checkbox v-model="row.disabled" />
              </template>
            </el-table-column>

            <el-table-column label="占位符" width="180">
              <template #default="{ row }">
                <el-input v-model="row.placeholder" placeholder="placeholder" />
              </template>
            </el-table-column>

            <el-table-column label="默认值" width="150">
              <template #default="{ row }">
                <el-input v-model="row.defaultValue" placeholder="默认值" />
              </template>
            </el-table-column>

            <!-- 新增事件配置列 -->
            <el-table-column label="事件配置" width="200">
              <template #default="{ row, $index }">
                <div class="events-display">
                  <div v-if="row.events && row.events.length > 0" class="events-list">
                    <el-tooltip 
                      v-for="(event, eventIndex) in row.events" 
                      :key="eventIndex"
                      :content="event.description || `${event.type}事件`"
                      placement="top"
                      :disabled="!event.description || event.description.length <= 10"
                    >
                      <el-tag 
                        size="small"
                        :type="getEventTagType(event.type)"
                        closable
                        @close="removeEvent($index, eventIndex)"
                        class="event-tag"
                        @click="editEvent($index, eventIndex)"
                      >
                        {{ event.description || `${event.type}事件` }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                  <div class="events-actions">
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="addNewEvent($index)"
                      style="color: #409eff; padding: 2px 4px;"
                    >
                      + 添加事件
                    </el-button>
                  </div>
                </div>
              </template>
            </el-table-column>

            <!-- 新增校验规则列 -->
            <el-table-column label="校验规则" width="200">
              <template #default="{ row, $index }">
                <div class="validations-display">
                  <div v-if="row.validation && row.validation.rules && row.validation.rules.length > 0" class="validations-list">
                    <el-tooltip 
                      v-for="(rule, ruleIndex) in row.validation.rules" 
                      :key="ruleIndex"
                      :content="rule.description || getValidationRuleDescription(rule)"
                      placement="top"
                      :disabled="!rule.description || rule.description.length <= 10"
                    >
                      <el-tag 
                        size="small"
                        :type="getValidationTagType(rule)"
                        closable
                        @close="removeValidationRule($index, ruleIndex)"
                        class="validation-tag"
                        @click="editValidationRule()"
                      >
                        {{ rule.description || getValidationRuleDescription(rule) }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                  <div class="validations-actions">
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="addNewValidationRule($index)"
                      style="color: #409eff; padding: 2px 4px;"
                    >
                      + 添加校验
                    </el-button>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="60" fixed="right">
              <template #default="{ $index }">
                <div class="action-buttons">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="removeField($index)"
                    style="color: #f56c6c"
                  >
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 第二行：数据源配置 -->
        <div class="table-section">
          <h4 class="section-title">数据源配置</h4>
          <el-table :data="fields" border style="width: 100%;">
            <el-table-column label="字段名称" width="180">
              <template #default="{ row }">
                <span class="field-name-display">{{ row.fieldName || '未设置' }}</span>
              </template>
            </el-table-column>

            <el-table-column label="数据源类型" width="160">
              <template #default="{ row, $index }">
                <el-select 
                  v-model="row.dataSourceType"
                  placeholder="选择类型"
                  @change="onDataSourceTypeChange($index)"
                  style="width: 100%"
                >
                  <el-option label="手动填写" value="manual" />
                  <el-option label="接口获取" value="api" />
                  <el-option label="字典数据" value="dict" />
                  <el-option label="表单内部传递" value="internal" />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="数据源" width="240">
              <template #default="{ row, $index }">
                <!-- 字典数据源选择 -->
                <div v-if="row.dataSourceType === 'dict'" style="display: flex; flex-direction: column; gap: 4px;">
                  <el-select 
                    v-model="row.dictType"
                    placeholder="选择字典类型"
                    @change="onDictTypeChange($index)"
                    style="width: 100%"
                    size="small"
                    :loading="dictLoading"
                  >
                    <el-option
                      v-for="dict in dictTypes"
                      :key="dict.type"
                      :label="dict.name"
                      :value="dict.type"
                    >
                      <div style="display: flex; flex-direction: column;">
                        <span>{{ dict.name }}</span>
                        <span style="font-size: 11px; color: #909399;">{{ dict.labels }}</span>
                      </div>
                    </el-option>
                  </el-select>
                  <div v-if="dictError" class="dict-error">
                    <el-icon><WarningFilled /></el-icon>
                    {{ dictError }}
                  </div>
                </div>
                
                <!-- API数据源选择 -->
                <el-select 
                  v-else-if="row.dataSourceType === 'api'"
                  v-model="row.dataSourceId"
                  placeholder="选择API接口"
                  @change="onDataSourceChange($index)"
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in dataSourceOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                
                <!-- 内部字段传递 -->
                <div v-else-if="row.dataSourceType === 'internal'" style="display: flex; flex-direction: column; gap: 4px;">
                  <el-select 
                    v-model="row.internalFieldId"
                    placeholder="选择字段"
                    @change="onInternalFieldChange($index)"
                    style="width: 100%"
                    size="small"
                  >
                    <el-option
                      v-for="field in getAvailableInternalFields($index)"
                      :key="field.fieldName"
                      :label="field.fieldLabel"
                      :value="field.fieldName"
                    />
                  </el-select>
                  <el-select 
                    v-if="row.internalFieldId"
                    v-model="row.internalFieldProperty"
                    placeholder="选择属性"
                    @change="onDataSourceChange($index)"
                    style="width: 100%"
                    size="small"
                  >
                    <el-option
                      v-for="property in getAvailableFieldProperties(row.internalFieldId)"
                      :key="property.value"
                      :label="property.label"
                      :value="property.value"
                    />
                  </el-select>
                </div>
                
                <span v-else-if="row.dataSourceType === 'manual'" class="text-muted">手动填写</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>

            <el-table-column label="可用字段" min-width="200">
              <template #default="{ row }">
                <div v-if="needsDataSource() && row.dataSourceId" class="available-fields">
                  <el-tag 
                    v-for="field in getAvailableFields(row.dataSourceId)" 
                    :key="field.key"
                    size="small"
                    style="margin: 2px"
                  >
                    {{ field.label }}
                  </el-tag>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 右侧：JSON预览 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>JSON预览</h3>
          <div class="preview-actions">
            <el-button 
              size="small" 
              @click="toggleJsonEditMode" 
              :type="isJsonEditMode ? 'primary' : 'default'"
              :icon="isJsonEditMode ? 'View' : 'Edit'"
            >
              {{ isJsonEditMode ? '预览模式' : '编辑模式' }}
            </el-button>
            <el-button @click="copyJson" icon="DocumentCopy">复制</el-button>
            <el-button @click="downloadJson" icon="Download">下载</el-button>
          </div>
        </div>

        <!-- 预览模式 -->
        <div v-if="!isJsonEditMode" class="json-preview">
          <pre class="json-content" v-html="highlightedJson"></pre>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="json-editor">
          <el-input
            v-model="editableJsonText"
            type="textarea"
            :rows="20"
            placeholder="在此编辑JSON配置..."
            @input="validateJsonEdit"
            class="json-editor-input"
          />
          <div v-if="jsonEditError" class="json-edit-error">
            <el-icon><WarningFilled /></el-icon>
            {{ jsonEditError }}
          </div>
          <div class="json-editor-actions">
            <el-button size="small" @click="formatJsonEdit" icon="MagicStick">
              格式化
            </el-button>
            <el-button size="small" type="primary" @click="applyJsonEdit" icon="Check">
              应用更改
            </el-button>
            <el-button size="small" @click="cancelJsonEdit" icon="Close">
              取消
            </el-button>
          </div>
        </div>
      </div>

    </div>

    <!-- 事件配置助手 -->
    <EventConfigHelper
      v-model:visible="eventConfigVisible"
      :fields="fields"
      :target-field-name="currentFieldIndex >= 0 ? fields[currentFieldIndex]?.fieldName : undefined"
      :default-config-types="defaultConfigTypes"
      :current-event="getCurrentEvent()"
      @apply="applyEventToField"
      @applyEnhanced="applyEnhancedConfigToField"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus/es'
import { WarningFilled } from '@element-plus/icons-vue'
import type { FieldConfig, FieldEvent } from '../../types/form-config'
import { getDataSourceOptions, getDataSourceById } from '../data/data-sources'
import { fetchDictTypes, generateDictDataSource } from '../services/dictionaryService'
import EventConfigHelper from '../components/EventConfigHelper.vue'

// JSON编辑模式相关函数
const toggleJsonEditMode = () => {
  if (!isJsonEditMode.value) {
    editableJsonText.value = formattedJson.value
    jsonEditError.value = ''
  }
  isJsonEditMode.value = !isJsonEditMode.value
}

const validateJsonEdit = () => {
  try {
    JSON.parse(editableJsonText.value)
    jsonEditError.value = ''
  } catch (error: any) {
    jsonEditError.value = `JSON格式错误: ${error.message}`
  }
}

const formatJsonEdit = () => {
  try {
    const parsed = JSON.parse(editableJsonText.value)
    editableJsonText.value = JSON.stringify(parsed, null, 2)
    jsonEditError.value = ''
  } catch (error) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

const applyJsonEdit = () => {
  try {
    const parsed = JSON.parse(editableJsonText.value)
    if (parsed.fields && Array.isArray(parsed.fields)) {
      fields.value = parsed.fields
      isJsonEditMode.value = false
      ElMessage.success('JSON配置已应用')
    } else {
      ElMessage.error('JSON格式不正确，缺少fields字段')
    }
  } catch (error) {
    ElMessage.error('JSON格式错误，无法应用')
  }
}

const cancelJsonEdit = () => {
  isJsonEditMode.value = false
  editableJsonText.value = ''
  jsonEditError.value = ''
}

// 扩展FieldConfig接口以支持表格编辑
interface EditableFieldConfig extends FieldConfig {
  placeholder?: string;
  defaultValue?: any;
  dataSourceId?: string; // 添加数据源ID字段
  componentConfig?: any; // 添加组件配置字段
  dataSourceType?: 'manual' | 'api' | 'internal' | 'dict'; // 添加数据源类型字段，包含手动填写选项
  dictType?: string; // 添加字典类型字段
  internalFieldId?: string; // 添加内部字段ID字段
  internalFieldProperty?: string; // 添加内部字段属性字段
  events?: any[]; // 添加事件配置字段
}

// 字段类型选项
const fieldTypes = [
  { value: 'string', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'integer', label: '整数' },
  { value: 'float', label: '浮点数' },
  { value: 'date', label: '日期' },
  { value: 'select', label: '下拉选择' },
  { value: 'radio', label: '单选按钮' },
  { value: 'checkbox', label: '多选框' }
]

// 数据源选项
const dataSourceOptions = getDataSourceOptions()

// localStorage键名
const STORAGE_KEY = 'json-generator-fields'

// 从localStorage加载数据
const loadFromStorage = (): EditableFieldConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsedData = JSON.parse(stored)
      // 验证数据结构
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData
      }
    }
  } catch (error) {
    console.warn('从localStorage加载数据失败:', error)
  }
  
  // 返回默认数据，包含示例事件
  return [
    {
      fieldName: "product",
      fieldLabel: "产品",
      fieldType: "string",
      required: false,
      disabled: false,
      componentConfig: {},
      events: [
        {
          type: "change",
          description: "产品变更时清空价格",
          actions: [
            {
              type: "setValue",
              targetField: "price",
              value: ""
            }
          ]
        }
      ],
      validation: {
        rules: []
      }
    },
    {
      fieldName: "price",
      fieldLabel: "单价",
      fieldType: "string",
      required: false,
      disabled: false,
      componentConfig: {},
      events: [],
      validation: {
        rules: []
      }
    }
  ]
}

// 保存到localStorage
const saveToStorage = (data: EditableFieldConfig[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.warn('保存数据到localStorage失败:', error)
  }
}

// 字段配置数据 - 从localStorage加载或使用默认数据
const fields = ref<EditableFieldConfig[]>(loadFromStorage())

// 事件配置相关
const eventConfigVisible = ref(false)
const currentFieldIndex = ref(-1)
const defaultConfigTypes = ref<string[]>([]) // 新增：默认配置类型

// JSON编辑相关
const isJsonEditMode = ref(false)
const editableJsonText = ref('')
const jsonEditError = ref('')

// 字典相关状态
const dictTypes = ref<Array<{name: string, type: string, labels: string}>>([])
const dictLoading = ref(false)
const dictError = ref('')

// 监听fields变化，自动保存到localStorage
watch(fields, (newFields) => {
  saveToStorage(newFields)
}, { deep: true })

// 组件挂载时确保数据已加载
onMounted(() => {
  // 如果fields为空，确保至少有一个示例字段
  if (fields.value.length === 0) {
    addField()
  }
  // 加载字典类型
  loadDictTypes()
})

// 加载字典类型
const loadDictTypes = async () => {
  dictLoading.value = true
  dictError.value = ''
  try {
    const types = await fetchDictTypes('i')
    dictTypes.value = types
    console.log('字典类型加载成功:', types)
  } catch (error) {
    dictError.value = '加载字典类型失败: ' + (error as Error).message
    console.error('加载字典类型失败:', error)
  } finally {
    dictLoading.value = false
  }
}

// 添加字段
const addField = () => {
  fields.value.push({
    fieldName: `field${fields.value.length + 1}`,
    fieldLabel: `字段${fields.value.length + 1}`,
    fieldType: 'string',
    required: false,
    disabled: false,
    placeholder: '',
    defaultValue: '',
    dataSourceType: 'manual', // 新增字段默认选择手动填写
    componentConfig: {}, // 预留组件配置
    events: [], // 预留事件配置
    validation: { // 预留验证配置
      rules: []
    }
  })
}

// 删除字段
const removeField = (index: number) => {
  fields.value.splice(index, 1)
}

// 打开事件配置 - 函数已移动到其他地方使用

// 应用事件到字段
const applyEventToField = (event: FieldEvent, fieldName: string) => {
  console.group('📝 应用事件到字段')
  console.log('🎯 目标字段名:', fieldName)
  console.log('⚙️ 事件配置:', event)
  
  const fieldIndex = fields.value.findIndex(f => f.fieldName === fieldName)
  console.log('📍 字段索引:', fieldIndex)
  
  if (fieldIndex !== -1) {
    if (!fields.value[fieldIndex].events) {
      fields.value[fieldIndex].events = []
      console.log('🆕 初始化字段events数组')
    }
    
    // 为事件添加description字段（如果没有的话）
    const eventWithDescription = {
      ...event,
      description: event.description || `${event.type}事件`
    }
    
    // 如果是编辑现有事件
    if (currentEventIndex.value >= 0 && currentEventIndex.value < fields.value[fieldIndex].events!.length) {
      fields.value[fieldIndex].events![currentEventIndex.value] = eventWithDescription
      console.log('🔄 更新现有事件')
      ElMessage.success('事件已更新')
    } else {
      // 添加新事件或替换同类型事件
      const existingEventIndex = fields.value[fieldIndex].events!.findIndex(e => e.type === event.type)
      console.log('🔍 现有事件索引:', existingEventIndex)
      
      if (existingEventIndex !== -1) {
        fields.value[fieldIndex].events![existingEventIndex] = eventWithDescription
        console.log('🔄 替换现有事件')
        ElMessage.success('同类型事件已替换')
      } else {
        fields.value[fieldIndex].events!.push(eventWithDescription)
        console.log('➕ 添加新事件')
        ElMessage.success('事件已添加')
      }
    }
    
    console.log('✅ 更新后的字段:', fields.value[fieldIndex])
  } else {
    console.error('❌ 未找到目标字段:', fieldName)
  }
  
  // 重置当前事件索引
  currentEventIndex.value = -1
  console.groupEnd()
}

// 应用增强配置到字段
const applyEnhancedConfigToField = (configWithTargets: {
  event?: { config: FieldEvent; targetField: string }
  validation?: { config: any; targetField: string }
  componentConfig?: { config: any; targetField: string }
}) => {
  console.group('🚀 应用增强配置到字段')
  console.log('⚙️ 增强配置:', configWithTargets)
  
  const appliedConfigs = []
  
  // 应用事件配置
  if (configWithTargets.event) {
    const { config: eventConfig, targetField } = configWithTargets.event
    console.log('🎯 应用事件配置到字段:', targetField)
    
    const fieldIndex = fields.value.findIndex(f => f.fieldName === targetField)
    if (fieldIndex !== -1) {
      const field = fields.value[fieldIndex]
      
      if (!field.events) {
        field.events = []
        console.log('🆕 初始化字段events数组')
      }
      
      const eventWithDescription = {
        ...eventConfig,
        description: eventConfig.description || `${eventConfig.type}事件`
      }
      
      // 添加新事件或替换同类型事件
      const existingEventIndex = field.events.findIndex(e => e.type === eventConfig.type)
      
      if (existingEventIndex !== -1) {
        field.events[existingEventIndex] = eventWithDescription
        console.log('🔄 替换现有事件')
      } else {
        field.events.push(eventWithDescription)
        console.log('➕ 添加新事件')
      }
      
      appliedConfigs.push(`事件(${targetField})`)
    }
  }
  
  // 应用校验配置
  if (configWithTargets.validation) {
    const { config: validationConfig, targetField } = configWithTargets.validation
    console.log('🎯 应用校验配置到字段:', targetField)
    
    const fieldIndex = fields.value.findIndex(f => f.fieldName === targetField)
    if (fieldIndex !== -1) {
      const field = fields.value[fieldIndex]
      
      if (!field.validation) {
        field.validation = { rules: [] }
      }
      
      if (!field.validation.rules) {
        field.validation.rules = []
      }
      
      // 合并校验规则
      if (validationConfig.rules && Array.isArray(validationConfig.rules)) {
        validationConfig.rules.forEach((newRule: any) => {
          const existingRuleIndex = field.validation!.rules!.findIndex(
            (rule: any) => rule.type === newRule.type || (rule.required && newRule.required)
          )
          
          if (existingRuleIndex !== -1) {
            field.validation!.rules![existingRuleIndex] = newRule
            console.log('🔄 替换现有校验规则:', newRule.type || 'required')
          } else {
            field.validation!.rules!.push(newRule)
            console.log('➕ 添加新校验规则:', newRule.type || 'required')
          }
        })
      }
      
      appliedConfigs.push(`校验(${targetField})`)
    }
  }
  
  // 应用组件配置
  if (configWithTargets.componentConfig) {
    const { config: componentConfig, targetField } = configWithTargets.componentConfig
    console.log('🎯 应用组件配置到字段:', targetField)
    
    const fieldIndex = fields.value.findIndex(f => f.fieldName === targetField)
    if (fieldIndex !== -1) {
      const field = fields.value[fieldIndex]
      
      if (!field.componentConfig) {
        field.componentConfig = {}
      }
      
      // 合并组件配置
      Object.assign(field.componentConfig, componentConfig)
      console.log('⚙️ 更新组件配置:', field.componentConfig)
      
      appliedConfigs.push(`组件配置(${targetField})`)
    }
  }
  
  // 显示成功消息
  if (appliedConfigs.length > 0) {
    ElMessage.success(`已应用: ${appliedConfigs.join(', ')}`)
  }
  
  // 重置当前事件索引
  currentEventIndex.value = -1
  console.groupEnd()
}

// 验证字段名称
const validateFieldName = (index: number) => {
  const field = fields.value[index]
  if (!field.fieldName) {
    field.fieldName = `field${index + 1}`
  }
  // 检查重复
  const duplicateIndex = fields.value.findIndex((f, i) => 
    i !== index && f.fieldName === field.fieldName
  )
  if (duplicateIndex !== -1) {
    field.fieldName = `${field.fieldName}_${index + 1}`
  }
}

// 获取事件标签类型
const getEventTagType = (eventType: string) => {
  const typeMap: Record<string, string> = {
    'change': 'primary',
    'click': 'success',
    'focus': 'info',
    'blur': 'warning',
    'input': 'danger'
  }
  return typeMap[eventType] || 'default'
}

// 删除事件
const removeEvent = (fieldIndex: number, eventIndex: number) => {
  const field = fields.value[fieldIndex]
  if (field.events && field.events.length > eventIndex) {
    field.events.splice(eventIndex, 1)
    ElMessage.success('事件已删除')
  }
}

// 编辑事件
const editEvent = (fieldIndex: number, eventIndex: number) => {
  currentFieldIndex.value = fieldIndex
  currentEventIndex.value = eventIndex
  eventConfigVisible.value = true
}

// 添加新事件
const addNewEvent = (fieldIndex: number) => {
  currentFieldIndex.value = fieldIndex
  currentEventIndex.value = -1 // -1 表示新增事件
  defaultConfigTypes.value = ['event'] // 默认勾选事件配置
  eventConfigVisible.value = true
}

// 获取校验规则标签类型
const getValidationTagType = (rule: any) => {
  if (rule.required) return 'danger'
  if (rule.type === 'email') return 'primary'
  if (rule.pattern) return 'warning'
  if (rule.min || rule.max) return 'info'
  if (rule.validator) return 'success'
  return 'default'
}

// 获取校验规则描述
const getValidationRuleDescription = (rule: any) => {
  // 优先使用规则中的description字段
  if (rule.description) return rule.description
  
  // 如果没有description，则根据规则类型生成描述
  if (rule.required) return '必填校验'
  if (rule.type === 'email') return '邮箱格式'
  if (rule.type === 'number') return '数字类型'
  if (rule.pattern) return '格式校验'
  if (rule.min && rule.max) return `长度${rule.min}-${rule.max}`
  if (rule.min) return `最小${rule.min}`
  if (rule.max) return `最大${rule.max}`
  if (rule.validator) return '自定义校验'
  return '校验规则'
}

// 删除校验规则
const removeValidationRule = (fieldIndex: number, ruleIndex: number) => {
  const field = fields.value[fieldIndex]
  if (field.validation && field.validation.rules && field.validation.rules.length > ruleIndex) {
    field.validation.rules.splice(ruleIndex, 1)
    // 如果没有校验规则了，清空validation对象
    if (field.validation.rules.length === 0) {
      field.validation = undefined
    }
    ElMessage.success('校验规则已删除')
  }
}

// 编辑校验规则 - 功能开发中
const editValidationRule = () => {
  ElMessage.info('校验规则编辑功能开发中...')
  // TODO: 实现校验规则编辑功能
}

// 添加新校验规则
const addNewValidationRule = (fieldIndex: number) => {
  currentFieldIndex.value = fieldIndex
  currentEventIndex.value = -1 // -1 表示新增
  defaultConfigTypes.value = ['validation'] // 默认勾选校验规则
  eventConfigVisible.value = true
}

// 当前编辑的事件索引
const currentEventIndex = ref(-1)

// 获取当前编辑的事件
const getCurrentEvent = () => {
  if (currentFieldIndex.value >= 0 && currentEventIndex.value >= 0) {
    const field = fields.value[currentFieldIndex.value]
    if (field.events && field.events.length > currentEventIndex.value) {
      return field.events[currentEventIndex.value]
    }
  }
  return null
}

// 判断是否需要数据源（现在所有字段类型都支持数据源）
const needsDataSource = () => {
  return true // 所有字段类型都支持数据源选择
}

// 数据源类型变化处理
const onDataSourceTypeChange = (index: number) => {
  const field = fields.value[index]
  // 清空之前的数据源配置
  field.dataSourceId = undefined
  field.internalFieldId = undefined
  field.internalFieldProperty = undefined
  field.dataSource = undefined
  field.componentConfig = undefined
  field.events = undefined
  field.dictType = undefined // 清空字典类型选择
}

// 获取可用的内部字段
const getAvailableInternalFields = (currentIndex: number) => {
  return fields.value
    .filter((_field, index) => index !== currentIndex) // 排除当前字段
    .map(field => ({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType
    }))
}

// 内部字段选择变化处理
const onInternalFieldChange = (index: number) => {
  const field = fields.value[index]
  // 清空字段属性选择
  field.internalFieldProperty = undefined
  field.events = undefined
}

// 获取字段的可用属性
const getAvailableFieldProperties = (fieldName: string) => {
  const sourceField = fields.value.find(f => f.fieldName === fieldName)
  if (!sourceField) return []
  
  // 基础属性
  const properties = [
    { value: fieldName, label: `字段值 (${fieldName})` }
  ]
  
  // 如果源字段有数据源配置，添加数据源相关属性
  if (sourceField.dataSource && sourceField.dataSource.responseMapping) {
    const mapping = sourceField.dataSource.responseMapping
    if (mapping.customData) {
      Object.keys(mapping.customData).forEach(key => {
        properties.push({
          value: key,
          label: `${key} (来自数据源)`
        })
      })
    }
  }
  
  return properties
}

// 字典类型选择处理
const onDictTypeChange = (index: number) => {
  const field = fields.value[index]
  if (field.dictType) {
    const selectedDict = dictTypes.value.find(d => d.type === field.dictType)
    if (selectedDict) {
      // 生成字典数据源配置
      const dictDataSource = generateDictDataSource(field.dictType, selectedDict.name)
      field.dataSource = dictDataSource
      
      // 确保字段类型为select
      if (field.fieldType !== 'select') {
        field.fieldType = 'select'
      }
      
      // 添加下拉框配置
      if (!field.componentConfig) {
        field.componentConfig = {}
      }
      field.componentConfig.clearable = true
      
      ElMessage.success(`已选择字典: ${selectedDict.name}`)
    }
  } else {
    // 清空字典相关配置
    field.dataSource = undefined
  }
}



// 数据源变化处理
const onDataSourceChange = (index: number) => {
  const field = fields.value[index]
  
  if (field.dataSourceType === 'dict' && field.dictType) {
    // 字典数据源已在onDictTypeChange中处理
    return
  }
  
  if (field.dataSourceType === 'api' && field.dataSourceId) {
    // API数据源处理
    const dataSource = getDataSourceById(field.dataSourceId)
    if (dataSource) {
      // 根据选择的数据源创建完整的DataSource对象
      const dataSourceConfig: any = {
        type: 'api',
        url: dataSource.url,
        method: dataSource.method || 'GET',
        responseMapping: dataSource.responseMapping
      }
      
      // 添加headers（如果存在）
      if (dataSource.headers) {
        dataSourceConfig.headers = dataSource.headers
      }
      
      // 添加params参数（如果存在）
      if (dataSource.params) {
        dataSourceConfig.params = dataSource.params
      }
      
      // 添加dataPath（如果存在）
      if (dataSource.dataPath) {
        dataSourceConfig.dataPath = dataSource.dataPath
      }
      
      field.dataSource = dataSourceConfig
      
      // 如果是搜索类型的接口，自动添加搜索相关的componentConfig
      if (dataSource.isSearchable) {
        // 确保字段类型为select才添加下拉框相关配置
        if (field.fieldType === 'select') {
          if (!field.componentConfig) {
            field.componentConfig = {}
          }
          field.componentConfig.clearable = true
          field.componentConfig.filterable = true
          field.componentConfig.remote = true
        } else {
          // 如果字段类型不是select，但配置了API数据源，自动修改字段类型为select
          field.fieldType = 'select'
          if (!field.componentConfig) {
            field.componentConfig = {}
          }
          field.componentConfig.clearable = true
          field.componentConfig.filterable = true
          field.componentConfig.remote = true
        }
      }
    }
  } else if (field.dataSourceType === 'internal' && field.internalFieldId && field.internalFieldProperty) {
    // 内部字段传递处理
    const sourceField = fields.value.find(f => f.fieldName === field.internalFieldId)
    if (sourceField) {
      // 将事件配置添加到源字段上，而不是目标字段
      if (!sourceField.events) {
        sourceField.events = []
      }
      
      // 检查是否已经存在相同的事件配置，避免重复
      const existingEventIndex = sourceField.events.findIndex((event: any) => 
        event.type === 'change' && 
        event.actions?.some((action: any) => action.targetField === field.fieldName)
      )
      
      const newAction = {
        type: 'setValue',
        targetField: field.fieldName,
        sourceExpression: `selectedOption.${field.internalFieldProperty}`
      }
      
      if (existingEventIndex >= 0) {
        // 如果已存在change事件，添加新的action
        const changeEvent = sourceField.events[existingEventIndex]
        if (!changeEvent.actions.some((action: any) => action.targetField === field.fieldName)) {
          changeEvent.actions.push(newAction)
        }
      } else {
        // 创建新的change事件
        sourceField.events.push({
          type: 'change',
          actions: [newAction]
        })
      }
      
      // 清空目标字段的事件配置和API相关配置
      field.events = undefined
      field.dataSource = undefined
      field.componentConfig = undefined
    }
  } else if (field.dataSourceType === 'manual') {
    // 手动填写模式：清空所有数据源相关配置
    field.dataSource = undefined
    field.componentConfig = undefined
    field.events = undefined
  } else {
    // 清空所有配置
    field.dataSource = undefined
    field.componentConfig = undefined
    field.events = undefined
  }
}

// 获取可用字段
const getAvailableFields = (dataSourceId: string) => {
  const dataSource = getDataSourceById(dataSourceId)
  return dataSource?.fields || []
}

// 生成JSON配置
const formattedJson = computed(() => {
  const config = {
    formName: 'generatedForm',
    formTitle: '生成的表单',
    fields: fields.value.map(field => {
      const result: any = {
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType
      }
      
      // 始终包含required和disabled，即使为false
      result.required = field.required || false
      result.disabled = field.disabled || false
      
      // 合并componentConfig
      const componentConfig: any = {}
      if (field.placeholder) componentConfig.placeholder = field.placeholder
      if (field.defaultValue) componentConfig.defaultValue = field.defaultValue
      
      // 合并来自数据源的componentConfig
      if (field.componentConfig) {
        Object.assign(componentConfig, field.componentConfig)
      }
      
      // 始终包含componentConfig，即使为空对象
      result.componentConfig = componentConfig
      
      if (field.dataSource) result.dataSource = field.dataSource
      
      // 处理events，保留所有字段包括description
      if (field.events && field.events.length > 0) {
        result.events = field.events.map(event => ({
          ...event
        }))
      } else {
        result.events = []
      }
      
      result.validation = field.validation || { rules: [] }
      
      return result
    })
  }
  
  return JSON.stringify(config, null, 2)
})

// JSON语法高亮
const highlightedJson = computed(() => {
  const json = formattedJson.value
  // 使用更精确的正则表达式，避免破坏换行符
  return json
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, '<span class="json-key">$1</span>:')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
    .replace(/:\s*(true|false)\b/g, ': <span class="json-boolean">$1</span>')
    .replace(/:\s*(\d+(?:\.\d+)?)\b/g, ': <span class="json-number">$1</span>')
    .replace(/:\s*(null)\b/g, ': <span class="json-null">$1</span>')
    .replace(/([{}[\]])/g, '<span class="json-bracket">$1</span>')
})

// 复制JSON
const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    console.log('JSON已复制到剪贴板')
  } catch (err) {
    console.error('复制失败')
  }
}

// 下载JSON
const downloadJson = () => {
  const blob = new Blob([formattedJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-config.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  console.log('JSON文件已下载')
}



// 初始化一个示例字段
addField()
</script>

<style scoped>
.json-generator {
  padding: 20px;
  background: #fff;
  min-height: 100vh;
}

.generator-header {
  margin-bottom: 30px;
  text-align: center;
}

.generator-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.generator-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.generator-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
}

.config-panel {
  flex: 1;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.preview-panel {
  width: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 15px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.json-preview {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: #fafafa;
}

.json-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #2c3e50;
}

.text-muted {
  color: #c0c4cc;
}

.available-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.el-table {
  font-size: 12px;
}

.el-table .el-table__cell {
  padding: 8px 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
.action-buttons .el-button {
  padding: 4px 8px;
  font-size: 12px;
}

/* 新增样式：表格分组样式 */
.table-section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.field-name-display {
  font-weight: 500;
  color: #303133;
}

.field-name-display:empty::before {
  content: "未设置";
  color: #c0c4cc;
  font-style: italic;
}

/* JSON编辑器样式 */
.json-editor {
  width: 100%;
  min-height: 300px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  background-color: #fafafa;
}

.json-editor:focus {
  border-color: #409eff;
  outline: none;
}

.json-error {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 字典错误提示样式 */
.dict-error {
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 4px;
  color: #f56c6c;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}



/* JSON预览区域样式 */
.json-preview {
  background-color: #fafafa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.json-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* JSON语法高亮 */
.json-key {
  color: #e96900;
  font-weight: bold;
}

.json-string {
  color: #032f62;
}

.json-number {
  color: #005cc5;
}

.json-boolean {
  color: #d73a49;
  font-weight: bold;
}

.json-null {
  color: #6f42c1;
  font-weight: bold;
}

.json-bracket {
  color: #24292e;
  font-weight: bold;
}
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .generator-content {
    flex-direction: column;
    height: auto;
  }
  
  .preview-panel {
    width: 100%;
    min-height: 400px;
  }
}

/* 事件配置列样式 */
.events-display {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 40px;
}

.events-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.events-list .event-tag {
  max-width: 120px;
  margin: 2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.events-list .event-tag .el-tag__content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.events-list .event-tag .el-tag__close {
  flex-shrink: 0;
  margin-left: 4px;
}

.events-actions {
  display: flex;
  justify-content: flex-start;
}

.events-actions .el-button {
  font-size: 11px;
  height: 20px;
  line-height: 1;
}
</style>