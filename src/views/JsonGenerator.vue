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

        <el-table :data="fields" border style="width: 100%">
          <el-table-column label="字段名称" width="150">
            <template #default="{ row, $index }">
              <el-input 
                v-model="row.fieldName" 
                placeholder="fieldName"
                @blur="validateFieldName($index)"
              />
            </template>
          </el-table-column>

          <el-table-column label="字段标签" width="150">
            <template #default="{ row }">
              <el-input v-model="row.fieldLabel" placeholder="显示标签" />
            </template>
          </el-table-column>

          <el-table-column label="字段类型" width="120">
            <template #default="{ row }">
              <el-select v-model="row.fieldType" placeholder="选择类型">
                <el-option
                  v-for="type in fieldTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="必填" width="80">
            <template #default="{ row }">
              <el-checkbox v-model="row.required" />
            </template>
          </el-table-column>

          <el-table-column label="禁用" width="80">
            <template #default="{ row }">
              <el-checkbox v-model="row.disabled" />
            </template>
          </el-table-column>

          <el-table-column label="占位符" width="150">
            <template #default="{ row }">
              <el-input v-model="row.placeholder" placeholder="placeholder" />
            </template>
          </el-table-column>

          <el-table-column label="默认值" width="120">
            <template #default="{ row }">
              <el-input v-model="row.defaultValue" placeholder="默认值" />
            </template>
          </el-table-column>

          <el-table-column label="数据源" width="180">
            <template #default="{ row, $index }">
              <el-select 
                v-if="needsDataSource(row.fieldType)"
                v-model="row.dataSourceId"
                placeholder="选择数据源"
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
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column label="可用字段" width="200">
            <template #default="{ row }">
              <div v-if="needsDataSource(row.fieldType) && row.dataSourceId" class="available-fields">
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

          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ $index }">
              <el-button 
                type="text" 
                size="small" 
                @click="removeField($index)"
                style="color: #f56c6c"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 右侧：JSON预览 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>JSON预览</h3>
          <div class="preview-actions">
            <el-button @click="copyJson" icon="DocumentCopy">复制</el-button>
            <el-button @click="downloadJson" icon="Download">下载</el-button>
          </div>
        </div>

        <div class="json-preview">
          <pre><code>{{ formattedJson }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FieldConfig, DataSource } from '../../types/form-config'
import { getDataSourceOptions, getDataSourceById, type DataSourceOption } from '../data/data-sources'

// 扩展FieldConfig接口以支持表格编辑
interface EditableFieldConfig extends FieldConfig {
  placeholder?: string;
  defaultValue?: any;
  dataSourceId?: string; // 添加数据源ID字段
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

// 字段配置数据
const fields = ref<EditableFieldConfig[]>([])

// 添加字段
const addField = () => {
  fields.value.push({
    fieldName: `field${fields.value.length + 1}`,
    fieldLabel: `字段${fields.value.length + 1}`,
    fieldType: 'string',
    required: false,
    disabled: false,
    placeholder: '',
    defaultValue: ''
  })
}

// 删除字段
const removeField = (index: number) => {
  fields.value.splice(index, 1)
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

// 判断是否需要数据源
const needsDataSource = (fieldType: string) => {
  return ['select', 'radio', 'checkbox'].includes(fieldType)
}

// 数据源变化处理
const onDataSourceChange = (index: number) => {
  const field = fields.value[index]
  if (field.dataSourceId) {
    const dataSource = getDataSourceById(field.dataSourceId)
    if (dataSource) {
      // 根据选择的数据源创建DataSource对象
      field.dataSource = {
        type: 'api',
        url: dataSource.url,
        method: 'GET',
        responseMapping: {
          value: dataSource.fields[0]?.key || 'id',
          label: dataSource.fields[1]?.key || 'name'
        }
      }
    }
  } else {
    field.dataSource = undefined
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
      
      if (field.required) result.required = field.required
      if (field.disabled) result.disabled = field.disabled
      
      // 将placeholder和defaultValue放入componentConfig
      const componentConfig: any = {}
      if (field.placeholder) componentConfig.placeholder = field.placeholder
      if (field.defaultValue) componentConfig.defaultValue = field.defaultValue
      if (Object.keys(componentConfig).length > 0) {
        result.componentConfig = componentConfig
      }
      
      if (field.dataSource) result.dataSource = field.dataSource
      
      return result
    })
  }
  
  return JSON.stringify(config, null, 2)
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
</style>