<template>
  <div class="json-converter">
    <div class="converter-header">
      <h2>JSON转换器</h2>
      <p>粘贴数据库字段JSON，转换为表单配置JSON，并自动补全缺失值</p>
    </div>
    <div class="converter-content">
      <div class="panel">
        <div class="panel-header">
          <h3>输入JSON</h3>
          <div class="panel-actions">
            <el-button size="small" @click="formatInput">格式化</el-button>
            <el-button size="small" @click="clearInput">清空</el-button>
          </div>
        </div>
        <div class="fetch-panel">
          <el-input v-model="fetchId" placeholder="id" size="small" style="width: 160px" />
          <el-input v-model="fetchPageCode" placeholder="pageCode" size="small" style="width: 240px" />
          <el-button type="primary" size="small" :loading="fetching" @click="fetchFromApi">获取JSON</el-button>
        </div>
        <el-input v-model="inputText" type="textarea" :rows="18" placeholder="粘贴JSON数组，如：[...]"></el-input>
        <div v-if="errorText" class="error-text">
          <el-icon><WarningFilled /></el-icon>
          {{ errorText }}
        </div>
        <div class="panel-footer">
          <el-button type="primary" @click="convert">转换</el-button>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <h3>输出JSON</h3>
          <div class="panel-actions">
            <el-button size="small" @click="copyOutput">复制</el-button>
            <el-button size="small" @click="downloadOutput">下载</el-button>
          </div>
        </div>
        <el-input v-model="outputText" type="textarea" :rows="18" placeholder="转换结果"></el-input>
      </div>
    </div>
  </div>
  </template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus/es'
import { WarningFilled } from '@element-plus/icons-vue'
import type { FieldConfig } from '../../types/form-config'

const inputText = ref('')
const outputText = ref('')
const errorText = ref('')
const fetchId = ref('')
const fetchPageCode = ref('')
const fetching = ref(false)

const formatInput = () => {
  try {
    const obj = JSON.parse(inputText.value)
    inputText.value = JSON.stringify(obj, null, 2)
    errorText.value = ''
  } catch (e: any) {
    errorText.value = `JSON格式错误: ${e.message}`
  }
}

const clearInput = () => {
  inputText.value = ''
  errorText.value = ''
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制输出JSON')
  } catch {
    ElMessage.error('复制失败')
  }
}

const downloadOutput = () => {
  const blob = new Blob([outputText.value || ''], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'form-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

const fetchFromApi = async () => {
  try {
    errorText.value = ''
    if (!fetchId.value || !fetchPageCode.value) {
      ElMessage.error('请填写id和pageCode')
      return
    }
    fetching.value = true
    const url = `http://192.168.177.81:48125/admin-api/basedata/basequery/common/listSystemPageFieldConfig?id=${encodeURIComponent(fetchId.value)}&pageCode=${encodeURIComponent(fetchPageCode.value)}`
    const resp = await fetch(url, { headers: { 'tenant-id': '1' } })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json()
    let data = json?.data
    let arr: any
    if (typeof data === 'string') {
      try { arr = JSON.parse(data) } catch { arr = data }
    } else {
      arr = data
    }
    if (!arr) throw new Error('响应为空')
    inputText.value = typeof arr === 'string' ? arr : JSON.stringify(arr, null, 2)
    ElMessage.success('已获取并填入输入框')
  } catch (e: any) {
    errorText.value = `接口请求失败: ${e.message}`
    ElMessage.error('接口请求失败')
  } finally {
    fetching.value = false
  }
}

type InputRow = {
  fieldId?: any
  fieldName?: string
  tableName?: string
  fieldLabel?: string
  fieldType?: string
  maskStrategy?: string | null
  required?: boolean
  visible?: boolean
  editable?: boolean
  isLogic?: number
  expression?: string | null
  logic?: boolean
}

const toUiType = (t?: string): FieldConfig['fieldType'] => {
  const s = (t || '').toLowerCase()
  if (s === 'select' || s === 'radio' || s === 'checkbox' || s === 'textarea') return s as any
  if (s.includes('int')) return 'number'
  if (s.includes('decimal') || s.includes('numeric') || s.includes('float') || s.includes('double')) return 'number'
  if (s.includes('date') || s.includes('time') || s.includes('timestamp')) return 'date'
  if (s.includes('char') || s.includes('string') || s.includes('varchar') || s === 'string') return 'text'
  if (s.includes('text')) return 'text'
  return 'text'
}

const convert = () => {
  try {
    const parsed = JSON.parse(inputText.value)
    if (!Array.isArray(parsed)) {
      errorText.value = '输入需为JSON数组'
      return
    }
    const fields: FieldConfig[] = parsed.map((row: InputRow) => {
      const fieldName = row.fieldName || ''
      const fieldLabel = row.fieldLabel || fieldName || '未命名字段'
      const srcType = (row.fieldType || '').toLowerCase()
      const fieldType = toUiType(srcType)
      const required = !!row.required
      const visible = row.visible !== undefined ? !!row.visible : true
      const editable = row.editable !== undefined ? !!row.editable : true
      const isLogic = (row.isLogic === 1) || !!row.logic
      const disabled = isLogic ? true : !editable
      const fc: FieldConfig = {
        fieldName,
        fieldLabel,
        fieldType,
        required,
        disabled,
        editable,
        visible,
        componentConfig: {},
        events: [],
        validation: { rules: [] }
      }
      if (fieldType === 'number') {
        if (srcType.includes('int')) {
          fc.componentConfig = { precision: 0, step: 1, controls: true }
        } else {
          fc.componentConfig = { precision: 2, step: 0.1, controls: true }
        }
      }
      return fc
    })
    const formConfig = {
      formName: 'generatedForm',
      formTitle: '生成的表单',
      layout: { columns: 2 },
      fields
    }
    outputText.value = JSON.stringify(formConfig, null, 2)
    errorText.value = ''
    ElMessage.success('转换完成')
  } catch (e: any) {
    errorText.value = `JSON解析失败: ${e.message}`
  }
}
</script>

<style scoped>
.json-converter {
  padding: 20px;
}
.converter-header {
  margin-bottom: 16px;
}
.converter-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.panel {
  background: #fff;
  border: 1px solid #e6e8eb;
  border-radius: 8px;
  padding: 16px;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.panel-actions {
  display: flex;
  gap: 8px;
}
.panel-footer {
  margin-top: 8px;
}
.fetch-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.error-text {
  margin-top: 8px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 6px;
}
@media (max-width: 1024px) {
  .converter-content { grid-template-columns: 1fr; }
}
</style>