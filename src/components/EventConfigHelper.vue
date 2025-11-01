<template>
  <el-dialog
    v-model="dialogVisible"
    title="智能事件配置"
    width="900px"
    :before-close="closeDialog"
  >
    <div class="event-config-helper">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" class="steps-indicator">
        <el-step title="需求和字段" description="描述需求并选择字段"></el-step>
        <el-step title="意图分析" description="AI分析用户意图"></el-step>
        <el-step title="生成配置" description="生成事件配置"></el-step>
        <el-step title="应用配置" description="应用到字段"></el-step>
      </el-steps>

      <!-- 步骤1：需求描述和字段选择 -->
      <div v-if="currentStep === 0" class="step-content">
        <h4>请描述您需要的事件逻辑并选择相关字段</h4>
        
        <!-- 需求描述部分 -->
        <div class="description-section">
          <label class="section-label">事件逻辑描述：</label>
          <el-input
            v-model="description"
            type="textarea"
            :rows="3"
            placeholder="例如：当产品名称以bt开头时，单价在失去焦点时乘以10"
            class="description-input"
          />
          <div class="example-actions">
            <el-button size="small" @click="fillExample">填入示例</el-button>
          </div>
        </div>

        <!-- 字段选择部分 -->
        <div class="field-selection-section">
          <label class="section-label">选择相关字段：</label>
          <div class="field-selection">
            <el-checkbox-group v-model="selectedFields">
              <div class="fields-grid">
                <el-checkbox 
                  v-for="field in props.fields" 
                  :key="field.fieldName"
                  :label="field.fieldName"
                  class="field-checkbox"
                >
                  <div class="field-info">
                    <span class="field-label">{{ field.fieldLabel }}</span>
                    <span class="field-name">({{ field.fieldName }})</span>
                    <span class="field-type">{{ field.fieldType }}</span>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </div>

        <div class="step-actions">
          <el-button type="primary" :disabled="!description.trim() || selectedFields.length === 0" @click="analyzeIntent">
            下一步：分析意图
          </el-button>
        </div>
      </div>

      <!-- 步骤2：意图分析 -->
      <div v-if="currentStep === 1" class="step-content">
        <h4>AI正在分析您的意图...</h4>
        <div v-if="isAnalyzing" class="analyzing-content">
          <div v-loading="true" class="loading-area">
            <p>正在分析用户描述和选中字段的关系...</p>
          </div>
        </div>
        
        <div v-else-if="intentAnalysis" class="analysis-result">
          <h5>分析结果：</h5>
          <div class="analysis-card">
            <p><strong>事件类型：</strong>{{ intentAnalysis.eventType }}</p>
            <p><strong>触发条件：</strong>{{ intentAnalysis.condition || '无' }}</p>
            <p><strong>执行动作：</strong>{{ intentAnalysis.action }}</p>
            <p><strong>目标字段：</strong>{{ intentAnalysis.targetField }}</p>
            <p><strong>源字段：</strong>{{ intentAnalysis.sourceField }}</p>
          </div>
        </div>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button v-if="intentAnalysis" type="primary" @click="generateConfig">
            下一步：生成配置
          </el-button>
        </div>
      </div>

      <!-- 步骤3：配置生成 -->
      <div v-if="currentStep === 2" class="step-content">
        <h4>正在生成事件配置...</h4>
        <div v-if="isGenerating" class="generating-content">
          <div v-loading="true" class="loading-area">
            <p>基于意图分析结果生成具体的事件配置...</p>
          </div>
        </div>
        
        <div v-else-if="generatedEvent" class="config-result">
          <h5>生成的事件配置：</h5>
          <div class="config-preview">
            <pre>{{ JSON.stringify(generatedEvent, null, 2) }}</pre>
          </div>
          
          <!-- 验证错误 -->
          <div v-if="validationErrors.length > 0" class="validation-errors">
            <el-alert title="配置验证失败" type="error" :closable="false">
              <ul>
                <li v-for="error in validationErrors" :key="error">{{ error }}</li>
              </ul>
            </el-alert>
          </div>
        </div>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button v-if="generatedEvent && validationErrors.length === 0" type="primary" @click="nextStep">
            下一步：应用配置
          </el-button>
        </div>
      </div>

      <!-- 步骤4：应用配置 -->
      <div v-if="currentStep === 3" class="step-content">
        <h4>选择要应用事件的字段</h4>
        <el-form-item label="目标字段:">
          <el-select v-model="targetField" placeholder="选择要应用事件的字段">
            <el-option
              v-for="fieldName in selectedFields"
              :key="fieldName"
              :label="getFieldLabel(fieldName)"
              :value="fieldName"
            />
          </el-select>
        </el-form-item>

        <div class="final-preview">
          <div class="preview-row">
            <div class="config-section">
              <h5>配置预览：</h5>
              <div class="config-preview">
                <pre>{{ JSON.stringify(generatedEvent, null, 2) }}</pre>
              </div>
            </div>
            <div class="description-section">
              <h5>功能说明：</h5>
              <div class="natural-description">
                <el-icon class="description-icon"><InfoFilled /></el-icon>
                <span class="description-text">{{ naturalDescription }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" :disabled="!targetField" @click="applyEvent">
            应用事件配置
          </el-button>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="errorMessage" class="error-section">
        <el-alert :title="errorMessage" type="error" :closable="false" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button v-if="currentStep === 3 && targetField && generatedEvent" type="success" @click="applyEvent">
          完成配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { EventGeneratorService } from '../services/eventGenerator'
import type { FieldEvent, FieldConfig, IntentAnalysis } from '../../types/form-config'

interface Props {
  visible: boolean
  fields: FieldConfig[]
  targetFieldName?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'apply', event: FieldEvent, fieldName: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const currentStep = ref(0)
const description = ref('')
const selectedFields = ref<string[]>([])
const intentAnalysis = ref<IntentAnalysis | null>(null)
const generatedEvent = ref<FieldEvent | null>(null)
const targetField = ref('')
const naturalDescription = ref('') // 新增：自然语言描述
const isAnalyzing = ref(false)
const isGenerating = ref(false)
const validationErrors = ref<string[]>([])
const errorMessage = ref('')

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听targetFieldName变化，自动填充目标字段
watch(() => props.targetFieldName, (newTargetFieldName) => {
  if (newTargetFieldName) {
    targetField.value = newTargetFieldName
    // 如果目标字段不在选中字段列表中，自动添加
    if (!selectedFields.value.includes(newTargetFieldName)) {
      selectedFields.value.push(newTargetFieldName)
    }
  }
}, { immediate: true })

// 方法
const fillExample = () => {
  description.value = '当产品名称以bt开头时，单价在失去焦点时乘以10'
}

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const getFieldLabel = (fieldName: string) => {
  const field = props.fields.find(f => f.fieldName === fieldName)
  return field ? `${field.fieldLabel} (${fieldName})` : fieldName
}

// 意图分析
const analyzeIntent = async () => {
  if (selectedFields.value.length === 0) {
    errorMessage.value = '请选择相关字段'
    return
  }

  isAnalyzing.value = true
  errorMessage.value = ''
  currentStep.value = 1

  try {
    // 提取选中字段的详细信息
    const selectedFieldsInfo = props.fields.filter(field => 
      selectedFields.value.includes(field.fieldName)
    )

    // 调用LLM分析意图
    const analysis = await EventGeneratorService.analyzeIntent(
      description.value,
      selectedFieldsInfo
    )
    
    intentAnalysis.value = analysis
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '意图分析失败'
  } finally {
    isAnalyzing.value = false
  }
}

// 生成配置
const generateConfig = async () => {
  if (!intentAnalysis.value) {
    errorMessage.value = '缺少意图分析结果'
    return
  }

  isGenerating.value = true
  errorMessage.value = ''
  validationErrors.value = []
  currentStep.value = 2

  try {
    // 基于意图分析结果生成具体配置
    const event = await EventGeneratorService.generateEventConfig(
      intentAnalysis.value,
      props.fields
    )
    
    // 验证配置
    const validation = EventGeneratorService.validateEventConfig(event, props.fields)
    
    if (!validation.valid) {
      validationErrors.value = validation.errors
    } else {
      generatedEvent.value = event
      
      // 生成自然语言描述
      try {
        naturalDescription.value = await EventGeneratorService.generateNaturalDescription(
          event,
          targetField.value || intentAnalysis.value.targetField,
          props.fields
        )
      } catch (error) {
        console.warn('生成自然语言描述失败:', error)
        naturalDescription.value = '智能事件配置已生成'
      }
      
      nextStep() // 自动进入下一步
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '生成事件配置失败'
  } finally {
    isGenerating.value = false
  }
}

const applyEvent = () => {
  if (generatedEvent.value && targetField.value) {
    emit('apply', generatedEvent.value, targetField.value)
    closeDialog()
  }
}

const closeDialog = () => {
  // 重置所有状态
  currentStep.value = 0
  description.value = ''
  selectedFields.value = []
  intentAnalysis.value = null
  generatedEvent.value = null
  targetField.value = ''
  isAnalyzing.value = false
  isGenerating.value = false
  validationErrors.value = []
  errorMessage.value = ''
  
  emit('update:visible', false)
}

// 监听对话框关闭
watch(() => props.visible, (newVal) => {
  if (!newVal) {
    // 对话框关闭时重置状态
    setTimeout(() => {
      currentStep.value = 0
      description.value = ''
      selectedFields.value = []
      intentAnalysis.value = null
      generatedEvent.value = null
      targetField.value = ''
      isAnalyzing.value = false
      isGenerating.value = false
      validationErrors.value = []
      errorMessage.value = ''
    }, 300)
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
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.description-input {
  margin-bottom: 12px;
}

.input-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.fields-section {
  margin-bottom: 24px;
}

.fields-section h4 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  max-height: 120px;
  overflow-y: auto;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.field-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.field-label {
  font-weight: 500;
  color: #303133;
}

.field-name {
  font-size: 12px;
  color: #909399;
}

.field-type {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h4 {
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.config-preview {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.config-preview pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
}

.validation-errors {
  margin-bottom: 16px;
}

.validation-errors ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.loading-area {
  min-height: 80px;
  padding: 20px;
  text-align: center;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.apply-section {
  padding: 16px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.error-section {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 新增样式：合并步骤的布局 */
.description-section {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.example-actions {
  margin-top: 8px;
  text-align: right;
}

.field-selection-section {
  margin-bottom: 24px;
}

.field-selection-section .section-label {
  margin-bottom: 12px;
}

/* 最终预览布局样式 */
.preview-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.config-section {
  flex: 1;
  min-width: 0;
}

.description-section {
  flex: 0 0 300px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
}

.description-section h5 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.natural-description {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.description-icon {
  color: #409eff;
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.description-text {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .preview-row {
    flex-direction: column;
  }
  
  .description-section {
    flex: none;
  }
}
</style>