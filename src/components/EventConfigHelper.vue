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
        
        <!-- 配置类型选择 -->
        <div class="config-type-selection">
          <label class="section-label">选择需要生成的配置类型：</label>
          <el-checkbox-group v-model="selectedConfigTypes" class="config-type-options">
            <el-checkbox label="event">事件配置</el-checkbox>
            <el-checkbox label="validation">校验规则</el-checkbox>
            <el-checkbox label="componentConfig">配置限制</el-checkbox>
          </el-checkbox-group>
          <div class="config-type-hint">
            <el-text size="small" type="info">至少选择一种配置类型</el-text>
          </div>
        </div>
        
        <!-- 需求描述部分 -->
        <div class="description-section">
          <label class="section-label">配置需求描述：</label>
          <el-input
            v-model="description"
            type="textarea"
            :rows="3"
            :placeholder="getDescriptionPlaceholder()"
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
          <el-button type="primary" :disabled="!description.trim() || selectedFields.length === 0 || selectedConfigTypes.length === 0" @click="analyzeIntent">
            下一步：智能分析
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
        
        <div v-else-if="intentAnalysis || enhancedIntentAnalysis" class="analysis-result">
          <h5>分析结果：</h5>
          
          <!-- 传统模式分析结果 -->
          <div v-if="!useEnhancedMode && intentAnalysis" class="analysis-card">
            <p><strong>事件类型：</strong>{{ intentAnalysis.eventType }}</p>
            <p><strong>触发条件：</strong>{{ intentAnalysis.condition || '无' }}</p>
            <p><strong>执行动作：</strong>{{ intentAnalysis.action }}</p>
            <p><strong>目标字段：</strong>{{ intentAnalysis.targetField }}</p>
            <p><strong>源字段：</strong>{{ intentAnalysis.sourceField }}</p>
          </div>
          
          <!-- 增强模式分析结果 -->
           <div v-if="useEnhancedMode && enhancedIntentAnalysis" class="enhanced-analysis-card">
             <div v-if="enhancedIntentAnalysis.eventAnalysis" class="analysis-section">
               <h6>事件分析：</h6>
               <div class="analysis-item">
                 <p><strong>事件类型：</strong>{{ enhancedIntentAnalysis.eventAnalysis.eventType }}</p>
                 <p><strong>触发条件：</strong>{{ enhancedIntentAnalysis.eventAnalysis.condition || '无' }}</p>
                 <p><strong>执行动作：</strong>{{ enhancedIntentAnalysis.eventAnalysis.action }}</p>
                 <p><strong>目标字段：</strong>{{ enhancedIntentAnalysis.eventAnalysis.targetField }}</p>
                 <p><strong>源字段：</strong>{{ enhancedIntentAnalysis.eventAnalysis.sourceField }}</p>
               </div>
             </div>
             
             <div v-if="enhancedIntentAnalysis.validationAnalysis" class="analysis-section">
               <h6>校验分析：</h6>
               <div class="analysis-item">
                 <p><strong>校验描述：</strong>{{ enhancedIntentAnalysis.validationAnalysis.description }}</p>
                 <p><strong>是否有校验：</strong>{{ enhancedIntentAnalysis.validationAnalysis.hasValidation ? '是' : '否' }}</p>
                 <div v-if="enhancedIntentAnalysis.validationAnalysis.rules.length > 0">
                   <p><strong>校验规则：</strong></p>
                   <ul>
                     <li v-for="rule in enhancedIntentAnalysis.validationAnalysis.rules" :key="rule.type">
                       {{ rule.type }}: {{ rule.message }}
                     </li>
                   </ul>
                 </div>
               </div>
             </div>
             
             <div v-if="enhancedIntentAnalysis.componentConfigAnalysis" class="analysis-section">
               <h6>组件配置分析：</h6>
               <div class="analysis-item">
                 <p><strong>配置描述：</strong>{{ enhancedIntentAnalysis.componentConfigAnalysis.description }}</p>
                 <p><strong>是否有配置：</strong>{{ enhancedIntentAnalysis.componentConfigAnalysis.hasConfig ? '是' : '否' }}</p>
               </div>
             </div>
           </div>
        </div>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button v-if="intentAnalysis || enhancedIntentAnalysis" type="primary" @click="generateConfig">
            {{ useEnhancedMode ? '下一步：生成智能配置' : '下一步：生成配置' }}
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
        
        <div v-else-if="generatedEvent || generatedConfig" class="config-result">
          <h5>{{ useEnhancedMode ? '生成的智能配置：' : '生成的事件配置：' }}</h5>
          
          <!-- 传统模式配置预览 -->
          <div v-if="!useEnhancedMode && generatedEvent" class="config-preview">
            <pre>{{ JSON.stringify(generatedEvent, null, 2) }}</pre>
          </div>
          
          <!-- 增强模式配置预览 -->
          <div v-if="useEnhancedMode && generatedConfig" class="enhanced-config-preview">
            <el-tabs type="border-card">
              <el-tab-pane v-if="generatedConfig.event" label="事件配置">
                <pre>{{ JSON.stringify(generatedConfig.event, null, 2) }}</pre>
              </el-tab-pane>
              <el-tab-pane v-if="generatedConfig.validation" label="校验配置">
                <pre>{{ JSON.stringify(generatedConfig.validation, null, 2) }}</pre>
              </el-tab-pane>
              <el-tab-pane v-if="generatedConfig.componentConfig" label="组件配置">
                <pre>{{ JSON.stringify(generatedConfig.componentConfig, null, 2) }}</pre>
              </el-tab-pane>
            </el-tabs>
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
          <el-button v-if="(generatedEvent || generatedConfig) && validationErrors.length === 0" type="primary" @click="nextStep">
            下一步：应用配置
          </el-button>
        </div>
      </div>

      <!-- 步骤4：应用配置 -->
      <div v-if="currentStep === 3" class="step-content">
        <!-- 传统模式：单一目标字段选择 -->
        <div v-if="!useEnhancedMode">
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
        </div>

        <!-- 增强模式：为每个配置项单独选择目标字段 -->
        <div v-else>
          <h4>为每个配置项选择目标字段</h4>
          
          <!-- 事件配置目标字段 -->
          <div v-if="generatedConfig?.event" class="config-field-assignment">
            <h5>事件配置</h5>
            <el-form-item label="目标字段:">
              <el-select v-model="eventTargetField" placeholder="选择应用事件配置的字段">
                <el-option
                  v-for="fieldName in selectedFields"
                  :key="fieldName"
                  :label="getFieldLabel(fieldName)"
                  :value="fieldName"
                />
              </el-select>
            </el-form-item>
            <div class="config-preview-mini">
              <pre>{{ JSON.stringify(generatedConfig.event, null, 2) }}</pre>
            </div>
          </div>

          <!-- 校验配置目标字段 -->
          <div v-if="generatedConfig?.validation" class="config-field-assignment">
            <h5>校验配置</h5>
            <el-form-item label="目标字段:">
              <el-select v-model="validationTargetField" placeholder="选择应用校验配置的字段">
                <el-option
                  v-for="fieldName in selectedFields"
                  :key="fieldName"
                  :label="getFieldLabel(fieldName)"
                  :value="fieldName"
                />
              </el-select>
            </el-form-item>
            <div class="config-preview-mini">
              <pre>{{ JSON.stringify(generatedConfig.validation, null, 2) }}</pre>
            </div>
          </div>

          <!-- 组件配置目标字段 -->
          <div v-if="generatedConfig?.componentConfig" class="config-field-assignment">
            <h5>组件配置</h5>
            <el-form-item label="目标字段:">
              <el-select v-model="componentConfigTargetField" placeholder="选择应用组件配置的字段">
                <el-option
                  v-for="fieldName in selectedFields"
                  :key="fieldName"
                  :label="getFieldLabel(fieldName)"
                  :value="fieldName"
                />
              </el-select>
            </el-form-item>
            <div class="config-preview-mini">
              <pre>{{ JSON.stringify(generatedConfig.componentConfig, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- 传统模式的预览 -->
        <div v-if="!useEnhancedMode" class="final-preview">
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
          <el-button 
            type="primary" 
            :disabled="useEnhancedMode ? !canApplyEnhancedConfig() : !targetField" 
            @click="useEnhancedMode ? applyConfig() : applyEvent()"
          >
            {{ useEnhancedMode ? '应用智能配置' : '应用事件配置' }}
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
        <el-button v-if="currentStep === 3 && targetField && (generatedEvent || generatedConfig)" type="success" @click="useEnhancedMode ? applyConfig() : applyEvent()">
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
import type { FieldEvent, FieldConfig, IntentAnalysis, EnhancedIntentAnalysis } from '../../types/form-config'

interface Props {
  visible: boolean
  fields: FieldConfig[]
  targetFieldName?: string
  defaultConfigTypes?: string[] // 新增：默认勾选的配置类型
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'apply', event: FieldEvent, fieldName: string): void
  (e: 'applyEnhanced', config: {
    event?: { config: FieldEvent; targetField: string }
    validation?: { config: any; targetField: string }
    componentConfig?: { config: any; targetField: string }
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const currentStep = ref(0)
const description = ref('')
const selectedFields = ref<string[]>([])
const intentAnalysis = ref<IntentAnalysis | null>(null)
const enhancedIntentAnalysis = ref<EnhancedIntentAnalysis | null>(null)
const generatedEvent = ref<FieldEvent | null>(null)
const generatedConfig = ref<{ event?: FieldEvent; validation?: any; componentConfig?: any } | null>(null)
const targetField = ref('')
// 新增：为每个配置项单独设置目标字段
const eventTargetField = ref('')
const validationTargetField = ref('')
const componentConfigTargetField = ref('')
const naturalDescription = ref('') // 自然语言描述
const isAnalyzing = ref(false)
const isGenerating = ref(false)
const validationErrors = ref<string[]>([])
const errorMessage = ref('')
const useEnhancedMode = ref(true) // 新增：是否使用增强模式
const selectedConfigTypes = ref<string[]>(['event']) // 新增：选择的配置类型，默认选择事件配置

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

// 监听defaultConfigTypes变化，设置默认勾选的配置类型
watch(() => props.defaultConfigTypes, (newDefaultConfigTypes) => {
  if (newDefaultConfigTypes && newDefaultConfigTypes.length > 0) {
    selectedConfigTypes.value = [...newDefaultConfigTypes]
  }
}, { immediate: true })

// 监听弹窗显示状态，重置表单
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    // 重置表单状态
    currentStep.value = 0
    description.value = ''
    selectedFields.value = []
    intentAnalysis.value = null
    enhancedIntentAnalysis.value = null
    generatedEvent.value = null
    generatedConfig.value = null
    targetField.value = ''
    eventTargetField.value = ''
    validationTargetField.value = ''
    componentConfigTargetField.value = ''
    naturalDescription.value = ''
    isAnalyzing.value = false
    isGenerating.value = false
    validationErrors.value = []
    errorMessage.value = ''
    
    // 设置默认配置类型
    if (props.defaultConfigTypes && props.defaultConfigTypes.length > 0) {
      selectedConfigTypes.value = [...props.defaultConfigTypes]
    } else {
      selectedConfigTypes.value = ['event'] // 默认选择事件配置
    }
    
    // 如果有目标字段，自动添加到选中字段列表
    if (props.targetFieldName) {
      targetField.value = props.targetFieldName
      if (!selectedFields.value.includes(props.targetFieldName)) {
        selectedFields.value.push(props.targetFieldName)
      }
    }
  }
})

// 方法
const fillExample = () => {
  description.value = '当产品名称以bt开头时，单价在失去焦点时乘以10'
}

// 获取描述占位符
const getDescriptionPlaceholder = () => {
  const types = selectedConfigTypes.value
  if (types.length === 0) {
    return '请先选择配置类型'
  }
  
  const examples = []
  if (types.includes('event')) {
    examples.push('事件逻辑：当产品名称以bt开头时，单价在失去焦点时乘以10')
  }
  if (types.includes('validation')) {
    examples.push('校验规则：单价必须大于0')
  }
  if (types.includes('componentConfig')) {
    examples.push('配置限制：产品名称最多输入20个字符')
  }
  
  return `例如：${examples.join('；')}`
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
  
  if (selectedConfigTypes.value.length === 0) {
    errorMessage.value = '请选择配置类型'
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

    // 根据选择的配置类型进行分析
    const analysis = await EventGeneratorService.analyzeSelectiveIntent(
      description.value,
      selectedFieldsInfo,
      selectedConfigTypes.value
    )
    
    enhancedIntentAnalysis.value = analysis
    
    // 设置推荐的目标字段
    if (analysis.eventAnalysis && selectedConfigTypes.value.includes('event')) {
      eventTargetField.value = analysis.eventAnalysis.recommendedTargetField || analysis.eventAnalysis.targetField
    }
    if (analysis.validationAnalysis && selectedConfigTypes.value.includes('validation')) {
      validationTargetField.value = analysis.validationAnalysis.recommendedTargetField || ''
    }
    if (analysis.componentConfigAnalysis && selectedConfigTypes.value.includes('componentConfig')) {
      componentConfigTargetField.value = analysis.componentConfigAnalysis.recommendedTargetField || ''
    }
    
    // 为了向后兼容，如果有事件分析，也设置传统的意图分析结果
    if (analysis.eventAnalysis) {
      intentAnalysis.value = {
        eventType: analysis.eventAnalysis.eventType,
        condition: analysis.eventAnalysis.condition,
        action: analysis.eventAnalysis.action,
        targetField: analysis.eventAnalysis.targetField,
        sourceField: analysis.eventAnalysis.sourceField
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '意图分析失败'
  } finally {
    isAnalyzing.value = false
  }
}

// 生成配置
const generateConfig = async () => {
  if (!enhancedIntentAnalysis.value) {
    errorMessage.value = '缺少意图分析结果'
    return
  }

  isGenerating.value = true
  errorMessage.value = ''
  validationErrors.value = []
  currentStep.value = 2

  try {
    // 提取选中字段的详细信息
    const selectedFieldsInfo = props.fields.filter(field => 
      selectedFields.value.includes(field.fieldName)
    )

    // 使用选择性配置生成
    const config = await EventGeneratorService.generateSelectiveConfig(
      enhancedIntentAnalysis.value,
      selectedFieldsInfo,
      selectedConfigTypes.value
    )
    
    generatedConfig.value = config
    
    // 为了向后兼容，如果有事件配置，也设置到generatedEvent
    if (config.event) {
      generatedEvent.value = config.event
    }
    
    // 验证事件配置（如果存在）
    if (config.event) {
      const validation = EventGeneratorService.validateEventConfig(config.event, props.fields)
      if (!validation.valid) {
        validationErrors.value = validation.errors
      }
    }
    
    if (validationErrors.value.length === 0) {
      // 生成自然语言描述
      try {
        if (config.event) {
          naturalDescription.value = await EventGeneratorService.generateNaturalDescription(
            config.event,
            targetField.value || enhancedIntentAnalysis.value.eventAnalysis?.targetField || '',
            selectedFieldsInfo
          )
        } else {
          // 根据生成的配置类型生成描述
          const configTypes = []
          if (config.validation) configTypes.push('校验规则')
          if (config.componentConfig) configTypes.push('组件配置')
          naturalDescription.value = `已生成${configTypes.join('和')}配置`
        }
      } catch (error) {
        console.warn('生成自然语言描述失败:', error)
        naturalDescription.value = '智能配置已生成'
      }
      
      nextStep() // 自动进入下一步
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '生成配置失败'
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

// 检查是否可以应用增强配置
const canApplyEnhancedConfig = () => {
  if (!generatedConfig.value) return false
  
  // 检查每个配置项是否都有对应的目标字段
  if (generatedConfig.value.event && !eventTargetField.value) return false
  if (generatedConfig.value.validation && !validationTargetField.value) return false
  if (generatedConfig.value.componentConfig && !componentConfigTargetField.value) return false
  
  return true
}

// 应用配置
const applyConfig = () => {
  if (useEnhancedMode.value && generatedConfig.value) {
    // 应用增强配置，传递每个配置项的目标字段
    const configWithTargets = {
      event: generatedConfig.value.event ? {
        config: generatedConfig.value.event,
        targetField: eventTargetField.value
      } : undefined,
      validation: generatedConfig.value.validation ? {
        config: generatedConfig.value.validation,
        targetField: validationTargetField.value
      } : undefined,
      componentConfig: generatedConfig.value.componentConfig ? {
        config: generatedConfig.value.componentConfig,
        targetField: componentConfigTargetField.value
      } : undefined
    }
    
    emit('applyEnhanced', configWithTargets)
  } else if (generatedEvent.value && targetField.value) {
    // 应用传统事件配置
    emit('apply', generatedEvent.value, targetField.value)
  }
  
  closeDialog()
}

// 重置状态
const resetState = () => {
  description.value = ''
  selectedFields.value = []
  intentAnalysis.value = null
  enhancedIntentAnalysis.value = null
  generatedEvent.value = null
  generatedConfig.value = null
  naturalDescription.value = ''
  errorMessage.value = ''
  validationErrors.value = []
  currentStep.value = 0
  targetField.value = ''
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

.steps-indicator {
  margin-bottom: 30px;
}

.step-content {
  min-height: 300px;
}

.mode-selection {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.mode-options {
  margin-top: 10px;
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

.field-checkbox {
  margin-bottom: 8px;
}

.field-info {
  display: flex;
  flex-direction: column;
  margin-left: 8px;
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

.analyzing-content {
  margin-top: 20px;
}

.generating-content {
  margin-top: 20px;
}

.analysis-result {
  margin-top: 20px;
}

.analysis-card {
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.enhanced-analysis-card {
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.analysis-section {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.analysis-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.analysis-section h6 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

.analysis-item {
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #409eff;
}

.analysis-item p {
  margin: 5px 0;
  font-size: 13px;
}

.analysis-item ul {
  margin: 5px 0 5px 20px;
  font-size: 13px;
}

.config-result {
  margin-top: 20px;
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

.enhanced-config-preview {
  margin-top: 10px;
}

.enhanced-config-preview pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
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

.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
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

.final-preview {
  margin-top: 20px;
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

/* 新增：配置项字段分配样式 */
.config-field-assignment {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.config-field-assignment h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.config-preview-mini {
  margin-top: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.config-preview-mini pre {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.4;
  color: #606266;
  margin: 0;
}
</style>