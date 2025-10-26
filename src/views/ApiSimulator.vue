<template>
  <div class="api-simulator">
    <el-card class="simulator-card">
      <template #header>
        <div class="card-header">
          <span>JSON 表单生成器</span>
          <el-button type="primary" @click="generateForm" :disabled="!jsonInput.trim()">
            生成表单
          </el-button>
        </div>
      </template>
      
      <el-row :gutter="20">
        <!-- JSON 输入区域 -->
        <el-col :span="12">
          <div class="input-section">
            <h3>JSON 配置输入</h3>
            <el-input
              v-model="jsonInput"
              type="textarea"
              :rows="20"
              placeholder="请粘贴您的 JSON 表单配置..."
              class="json-input"
            />
            <div class="input-actions">
              <el-button @click="clearInput" size="small">清空</el-button>
              <el-button @click="formatJson" size="small" type="info">格式化</el-button>
              <el-button @click="loadExample" size="small" type="success">加载示例</el-button>
            </div>
          </div>
        </el-col>
        
        <!-- 表单预览区域 -->
        <el-col :span="12">
          <div class="preview-section">
            <h3>表单预览</h3>
            <div class="form-preview" v-if="formConfig">
              <DynamicForm 
                :config="formConfig"
                v-model="formData"
                @submit="handleFormSubmit"
              />
            </div>
            <div v-else class="no-preview">
              <el-empty description="请输入 JSON 配置并生成表单" />
            </div>
          </div>
        </el-col>
      </el-row>
      
      <!-- 错误信息显示 -->
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        closable
        @close="errorMessage = ''"
        class="error-alert"
      />
      
      <!-- 生成的表单数据显示 -->
      <el-card v-if="formData && Object.keys(formData).length > 0" class="data-card">
        <template #header>
          <span>表单数据</span>
        </template>
        <pre class="form-data">{{ JSON.stringify(formData, null, 2) }}</pre>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DynamicForm from '../../components/DynamicForm.vue'
import type { FormConfig, FormData } from '../../types/form-config'

// 响应式数据
const jsonInput = ref('')
const formConfig = ref<FormConfig | null>(null)
const formData = ref<FormData>({})
const errorMessage = ref('')

// 生成表单
const generateForm = () => {
  try {
    errorMessage.value = ''
    const config = JSON.parse(jsonInput.value)
    
    // 验证配置格式
    if (!config.fields || !Array.isArray(config.fields)) {
      throw new Error('JSON 配置必须包含 fields 数组')
    }
    
    formConfig.value = config as FormConfig
    formData.value = {}
    
    console.log('表单配置生成成功')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'JSON 解析失败'
    formConfig.value = null
  }
}

// 清空输入
const clearInput = () => {
  jsonInput.value = ''
  formConfig.value = null
  formData.value = {}
  errorMessage.value = ''
}

// 格式化 JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsed, null, 2)
  } catch (error) {
    errorMessage.value = 'JSON 格式错误，无法格式化'
  }
}

// 加载示例
const loadExample = () => {
  const exampleConfig = {
    "title": "示例表单",
    "description": "这是一个示例表单配置",
    "fields": [
      {
        "name": "name",
        "label": "姓名",
        "type": "input",
        "required": true,
        "placeholder": "请输入姓名"
      },
      {
        "name": "email",
        "label": "邮箱",
        "type": "input",
        "inputType": "email",
        "required": true,
        "placeholder": "请输入邮箱地址"
      },
      {
        "name": "gender",
        "label": "性别",
        "type": "select",
        "required": true,
        "options": [
          { "label": "男", "value": "male" },
          { "label": "女", "value": "female" }
        ]
      },
      {
        "name": "age",
        "label": "年龄",
        "type": "number",
        "min": 1,
        "max": 120
      },
      {
        "name": "description",
        "label": "个人描述",
        "type": "textarea",
        "rows": 4,
        "placeholder": "请输入个人描述"
      }
    ]
  }
  
  jsonInput.value = JSON.stringify(exampleConfig, null, 2)
}

// 表单提交处理
const handleFormSubmit = (data: FormData) => {
  console.log('表单提交:', data)
  formData.value = { ...data }
}
</script>

<style scoped>
.api-simulator {
  padding: 20px;
}

.simulator-card {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-section,
.preview-section {
  height: 100%;
}

.input-section h3,
.preview-section h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.json-input {
  margin-bottom: 12px;
}

.json-input :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.input-actions {
  display: flex;
  gap: 8px;
}

.form-preview {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 20px;
  background-color: #fafafa;
  min-height: 400px;
}

.no-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

.error-alert {
  margin-top: 20px;
}

.data-card {
  margin-top: 20px;
}

.form-data {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
  max-height: 300px;
  overflow-y: auto;
}
</style>