// 事件生成服务
import type { FieldConfig, FieldEvent, EnhancedIntentAnalysis } from '../../types/form-config'

// ==================== 提示词模板 ====================
// 增强的意图分析提示词模板 - 动态版本，根据选择的类型生成对应内容
const ENHANCED_INTENT_ANALYSIS_PROMPT_TEMPLATE = `你是一个表单配置专家。请分析用户的需求描述，{analysisType}。

用户描述：{description}
事件触发描述：{eventTriggerDescription}

相关字段完整信息：
{fieldsInfo}

可用事件类型：{eventTypes}

{analysisInstructions}

请以JSON格式返回分析结果：
{jsonStructure}

注意事项：
1. 仔细分析用户描述中涉及的所有字段
2. 为每个配置项推荐最合适的目标字段
3. 推荐字段必须从可用字段列表中选择
4. 如果描述中明确指定了字段，优先使用指定的字段
5. 如果没有明确指定，根据语义分析推荐最合适的字段
6. 确保推荐的字段与配置的功能相匹配
7. {selectionNote}
8. 确保各个部分不重复，各司其职
9. 校验规则只关注数据验证，不涉及业务逻辑
10. 组件配置只关注UI展示，不涉及数据处理
11. ⚠️ 重要限制：事件类型只能使用 blur 或 change，严禁使用 input、focus 等其他事件类型
12. ⚠️ blur事件：在字段失去焦点时触发，适用于格式验证、数据处理等场景
13. ⚠️ change事件：在字段值发生变化时触发，适用于联动计算、实时更新等场景

请只返回JSON，不要其他内容。`

// 事件配置生成提示词模板
const CONFIG_GENERATION_PROMPT_TEMPLATE = `你是一个表单事件配置代码生成专家。基于意图分析结果，生成具体的事件配置代码。

意图分析结果：
- 事件类型: {eventType}
- 触发条件: {condition}
- 执行动作: {action}
- 目标字段: {targetField} (事件作用的目标字段，即被修改的字段)
- 事件绑定字段: {eventBindingField} (触发事件的字段，即事件监听器绑定的字段)
- 源字段: {sourceField}

所有字段信息：
{fieldsInfo}

📋 字段说明：
- 目标字段(targetField)：事件执行动作作用的对象，即被修改的字段
- 事件绑定字段(eventBindingField)：事件监听器绑定的字段，即触发事件的字段
- 如果未指定事件绑定字段，则事件绑定在目标字段上

请生成符合以下格式的事件配置JSON：
{
  "type": "事件类型",
  "description": "事件功能的简洁描述（10个字以内）",
  "actions": [
    {
      "type": "动作类型",
      "targetField": "目标字段",
      "sourceExpression": "值或表达式",
      "value": "直接值(可选)",
      "condition": "动作执行条件(可选)"
    }
  ]
}

🎯 重要：推荐使用三元表达式而不是单独的condition字段！

✅ 推荐方式（三元表达式）：
"sourceExpression": "(formData.product && formData.product.startsWith('bt')) ? formData.price * 10 : formData.price"

❌ 不推荐方式（单独condition）：
"condition": "formData.product && formData.product.startsWith('bt')",
"sourceExpression": "formData.price * 10"

动作类型包括：setValue, show, hide, enable, disable, validate, callApi

三元表达式示例：
- 条件赋值: "(formData.category === 'vip') ? formData.price * 0.8 : formData.price"
- 条件文本: "(formData.status === 'active') ? '启用' : '禁用'"
- 多条件: "(formData.type === 'A' && formData.level > 5) ? 100 : 50"
- 保持原值: "(formData.product) ? formData.price * 1.1 : formData.price"

⚠️ 重要限制：
1. 事件类型只能使用 blur 或 change，严禁使用 input、focus 等其他事件类型
2. blur事件：在字段失去焦点时触发，适用于格式验证、数据处理等场景
3. change事件：在字段值发生变化时触发，适用于联动计算、实时更新等场景
4. 必须严格遵守事件类型限制，不得生成其他类型的事件

请只返回JSON配置，不要其他内容。`

// 校验配置生成提示词模板
const VALIDATION_GENERATION_PROMPT_TEMPLATE = `你是一个表单校验规则专家。基于意图分析结果，生成具体的校验配置代码。

校验分析结果：
- 校验描述: {description}
- 校验规则: {rules}
- 目标字段: {targetField}

所有字段信息：
{fieldsInfo}

请生成符合以下格式的校验配置JSON：
{
  "rules": [
    {
      "required": true/false,
      "message": "错误提示信息",
      "trigger": "触发时机(blur/change/submit)",
      "type": "校验类型(string/number/date/email/url/pattern等)",
      "min": "最小值/长度(可选)",
      "max": "最大值/长度(可选)",
      "pattern": "正则表达式(可选)",
      "validator": "自定义校验函数(可选)",
      "description": "校验规则的简洁描述（10个字以内）"
    }
  ]
}

校验规则类型说明：
1. **required**: 必填校验
2. **min/max**: 长度或数值范围校验
3. **pattern**: 正则表达式校验
4. **type**: 数据类型校验 (string/number/integer/float/date/email/url)
5. **validator**: 自定义校验函数

常用校验示例：
- 必填: {"required": true, "message": "此字段为必填项", "trigger": "blur", "description": "必填校验"}
- 邮箱: {"type": "email", "message": "请输入正确的邮箱格式", "trigger": "blur", "description": "邮箱格式"}
- 手机: {"pattern": "^1[3-9]\\d{9}$", "message": "请输入正确的手机号", "trigger": "blur", "description": "手机号格式"}
- 长度: {"min": 6, "max": 20, "message": "长度应在6-20个字符之间", "trigger": "blur", "description": "长度限制"}
- 数值范围: {"type": "number", "min": 0, "max": 100, "message": "数值应在0-100之间", "trigger": "change", "description": "数值范围"}

注意事项：
1. 根据字段类型选择合适的校验规则
2. 提供清晰易懂的错误提示信息
3. 选择合适的触发时机 (blur适合格式校验，change适合实时校验)
4. 可以组合多个校验规则
5. 自定义校验函数应该返回Promise<void>或boolean
6. 每个校验规则必须包含description字段，用于可视化标签显示
7. ⚠️ 重要限制：触发时机只能使用 blur、change 或 submit，严禁使用 input、focus 等其他事件类型
8. ⚠️ blur触发：在字段失去焦点时触发校验，适用于格式验证、完整性检查等场景
9. ⚠️ change触发：在字段值发生变化时触发校验，适用于实时验证、数值范围检查等场景

请只返回JSON配置，不要其他内容。`

// 组件配置生成提示词模板
const COMPONENT_CONFIG_GENERATION_PROMPT_TEMPLATE = `你是一个表单组件配置专家。基于意图分析结果，生成具体的组件配置代码。

组件配置分析结果：
- 配置描述: {description}
- 基础配置: {config}
- 目标字段: {targetField}
- 字段类型: {fieldType}

所有字段信息：
{fieldsInfo}

请生成符合以下格式的组件配置JSON：
{
  "placeholder": "占位符文本",
  "clearable": true/false,
  "disabled": true/false,
  "readonly": true/false,
  "size": "large/default/small",
  "maxlength": 数字,
  "showWordLimit": true/false,
  "prefixIcon": "图标名称",
  "suffixIcon": "图标名称",
  "其他特定配置": "配置值"
}

不同字段类型的特定配置：

**输入框 (input/textarea)**:
- placeholder: 占位符
- clearable: 是否显示清空按钮
- maxlength: 最大输入长度
- showWordLimit: 是否显示字数统计
- prefixIcon/suffixIcon: 前缀/后缀图标

**选择器 (select)**:
- placeholder: 占位符
- clearable: 是否可清空
- filterable: 是否可搜索
- multiple: 是否多选
- collapseTags: 多选时是否折叠标签
- multipleLimit: 多选数量限制

**数字输入框 (number)**:
- min: 最小值
- max: 最大值
- step: 步长
- precision: 精度
- controls: 是否显示控制按钮
- controlsPosition: 控制按钮位置

**日期选择器 (date)**:
- format: 显示格式
- valueFormat: 绑定值格式
- placeholder: 占位符
- clearable: 是否可清空
- editable: 是否可输入

**开关 (switch)**:
- activeText: 打开时的文字描述
- inactiveText: 关闭时的文字描述
- activeValue: 打开时的值
- inactiveValue: 关闭时的值

配置原则：
1. 根据字段类型提供合适的配置
2. 提升用户体验和易用性
3. 保持界面一致性
4. 考虑无障碍访问
5. 提供合理的默认值

请只返回JSON配置，不要其他内容。`

// 自然语言描述生成提示词模板
const DESCRIPTION_GENERATION_PROMPT_TEMPLATE = `你是一个技术文档专家。请将事件配置转换为易懂的自然语言描述。

事件配置：
{eventConfig}

事件绑定字段：{targetField} 


字段信息：
{fieldsInfo}

📋 字段说明：
- 目标字段：事件执行动作作用的对象，即被修改的字段
- 事件绑定字段：事件监听器绑定的字段，即触发事件的字段

请生成一个简洁明了的功能描述，说明这个事件配置的作用。

要求：
1. 使用通俗易懂的语言
2. 突出关键的触发条件和执行动作
3. 明确区分触发字段和目标字段
4. 一句话概括功能
5. 不要包含技术术语

示例：
- "当产品名称以bt开头时，单价会自动乘以10"
- "选择VIP类别时，价格会自动打8折"
- "输入完成后，自动验证数据格式"

请只返回描述文字，不要其他内容。`

// ==================== 接口定义 ====================
// 字段摘要信息 - 增强版本，包含完整字段信息
export interface FieldSummary {
  name: string
  label: string
  type: string
  // 添加完整字段信息
  visible?: boolean
  editable?: boolean
  required?: boolean
  disabled?: boolean
  dataSource?: any
  componentConfig?: any
  validation?: any
}

// 保持向后兼容的意图分析结果接口
export interface IntentAnalysis {
  eventType: string
  condition?: string
  action: string
  targetField: string // 目标字段：事件作用的目标字段（被修改的字段）
  eventBindingField?: string // 事件绑定字段：触发事件的字段（事件监听器绑定的字段）
  sourceField?: string
}

// 关键信息接口
export interface EventKeyInfo {
  description: string
  availableFields: FieldSummary[]
  supportedEvents: string[]
  supportedActions: string[]
}

// ==================== 配置 ====================
// LLM API配置
const LLM_CONFIG = {
  apiKey: 'sk-ixauooosjextdttvjfhnzhlrowjuxuenohsrlblbtblaqwem',
  model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  baseURL: 'https://api.siliconflow.cn/v1/chat/completions'
}

// ==================== 主要服务类 ====================
export class EventGeneratorService {
  
  /**
   * 从表单配置中提取关键信息 - 增强版本，包含完整字段信息
   */
  static extractKeyInfo(fields: FieldConfig[], description: string): EventKeyInfo {
    const fieldSummaries: FieldSummary[] = fields.map(field => ({
      name: field.fieldName,
      label: field.fieldLabel,
      type: field.fieldType,
      visible: field.visible,
      editable: field.editable,
      required: field.required,
      disabled: field.disabled,
      dataSource: field.dataSource,
      componentConfig: field.componentConfig,
      validation: field.validation
    }))

    return {
      description: description.trim(),
      availableFields: fieldSummaries,
      supportedEvents: ['change', 'blur'],
      supportedActions: ['setValue', 'show', 'hide', 'enable', 'disable', 'validate', 'callApi']
    }
  }

  private static async generateComponentConfig(componentConfigAnalysis: NonNullable<EnhancedIntentAnalysis['componentConfigAnalysis']>, selectedFields: FieldConfig[]): Promise<any> {
    try {
      console.log('🔧 生成组件配置 - 使用LLM')
      
      const prompt = this.buildComponentConfigGenerationPrompt(componentConfigAnalysis, selectedFields)
      const response = await this.callLLMAPI(prompt)
      const componentConfig = this.parseComponentConfig(response)
      
      console.log('✅ LLM生成的组件配置:', componentConfig)
      return componentConfig
    } catch (error) {
      console.warn('⚠️ LLM生成组件配置失败，使用原始配置:', error)
      // 回退到原始逻辑
      return componentConfigAnalysis.config || {}
    }
  }

  /**
   * 选择性意图分析 - 根据用户选择的配置类型进行分析
   * 现在作为统一的意图分析入口，支持选择性分析和完整分析
   */
  static async analyzeSelectiveIntent(
    description: string, 
    selectedFields: FieldConfig[], 
    selectedTypes: string[] = ['event', 'validation', 'componentConfig'],
    eventTriggerDescription?: string
  ): Promise<EnhancedIntentAnalysis> {
    console.group('🧠 选择性意图分析')
    console.log('📝 用户描述:', description)
    console.log('🎯 选择的字段:', selectedFields.map(f => `${f.fieldLabel}(${f.fieldName})`))
    console.log('🔧 选择的配置类型:', selectedTypes)
    if (eventTriggerDescription) {
      console.log('⚡ 事件触发描述:', eventTriggerDescription)
    }
    
    try {
      const prompt = this.buildSelectiveIntentAnalysisPrompt(description, selectedFields, selectedTypes, eventTriggerDescription)
      const response = await this.callLLMAPI(prompt)
      const analysis = this.parseEnhancedIntentAnalysis(response)
      
      console.log('✅ 选择性意图分析结果:', analysis)
      console.groupEnd()
      
      return analysis
    } catch (error) {
      console.error('❌ 选择性意图分析失败:', error)
      console.groupEnd()
      throw new Error(`选择性意图分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }



  /**
   * 第一步：分析用户意图（保持向后兼容）
   */
  static async analyzeIntent(description: string, selectedFields: FieldConfig[], eventTriggerDescription?: string): Promise<IntentAnalysis> {
    console.group('🧠 步骤1：意图分析')
    console.log('📝 用户描述:', description)
    if (eventTriggerDescription) {
      console.log('⚡ 事件触发描述:', eventTriggerDescription)
    }
    console.log('🎯 选择的字段:', selectedFields.map(f => `${f.fieldLabel}(${f.fieldName})`))
    
    // 使用选择性分析，但只返回事件部分以保持兼容性
    try {
      const enhancedAnalysis = await this.analyzeSelectiveIntent(
        description, 
        selectedFields, 
        ['event', 'validation', 'componentConfig'],
        eventTriggerDescription
      )
      
      // 检查eventAnalysis是否存在
      if (!enhancedAnalysis.eventAnalysis) {
        throw new Error('增强意图分析未返回事件分析结果')
      }
      
      const compatibleAnalysis: IntentAnalysis = {
        eventType: enhancedAnalysis.eventAnalysis.eventType,
        condition: enhancedAnalysis.eventAnalysis.condition,
        action: enhancedAnalysis.eventAnalysis.action,
        targetField: enhancedAnalysis.eventAnalysis.targetField,
        eventBindingField: enhancedAnalysis.eventAnalysis.eventBindingField, // 新增事件绑定字段
        sourceField: enhancedAnalysis.eventAnalysis.sourceField
      }
      
      console.log('✅ 意图分析结果:', compatibleAnalysis)
      console.groupEnd()
      
      return compatibleAnalysis
    } catch (error) {
      console.error('❌ 意图分析失败:', error)
      console.groupEnd()
      throw new Error(`意图分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 选择性配置生成 - 根据用户选择的配置类型生成对应配置
   */
  static async generateSelectiveConfig(
    enhancedAnalysis: EnhancedIntentAnalysis, 
    selectedFields: FieldConfig[], 
    selectedTypes: string[]
  ): Promise<{
    event?: FieldEvent;
    validation?: any;
    componentConfig?: any;
  }> {
    const result: {
      event?: FieldEvent;
      validation?: any;
      componentConfig?: any;
    } = {}

    try {
      // 根据选择的类型生成对应配置
      if (selectedTypes.includes('event') && enhancedAnalysis.eventAnalysis) {
        result.event = await this.generateEventConfig({
          eventType: enhancedAnalysis.eventAnalysis.eventType,
          condition: enhancedAnalysis.eventAnalysis.condition,
          action: enhancedAnalysis.eventAnalysis.action,
          targetField: enhancedAnalysis.eventAnalysis.targetField,
          eventBindingField: enhancedAnalysis.eventAnalysis.eventBindingField, // 新增事件绑定字段
          sourceField: enhancedAnalysis.eventAnalysis.sourceField
        }, selectedFields)
      }

      if (selectedTypes.includes('validation') && enhancedAnalysis.validationAnalysis?.hasValidation) {
        result.validation = await this.generateValidationConfig(enhancedAnalysis.validationAnalysis, selectedFields)
      }

      if (selectedTypes.includes('componentConfig') && enhancedAnalysis.componentConfigAnalysis?.hasConfig) {
        result.componentConfig = await this.generateComponentConfig(enhancedAnalysis.componentConfigAnalysis, selectedFields)
      }

      return result
    } catch (error) {
      console.error('选择性配置生成失败:', error)
      throw new Error('选择性配置生成失败，请重试')
    }
  }



  /**
   * 生成校验配置
   */
  private static async generateValidationConfig(validationAnalysis: NonNullable<EnhancedIntentAnalysis['validationAnalysis']>, selectedFields: FieldConfig[]): Promise<any> {
    console.group('🔍 生成校验配置')
    console.log('📋 校验分析结果:', validationAnalysis)
    
    try {
      const prompt = this.buildValidationGenerationPrompt(validationAnalysis, selectedFields)
      console.log('📝 校验生成提示词:', prompt)
      
      const response = await this.callLLMAPI(prompt)
      console.log('🤖 LLM响应:', response)
      
      const validationConfig = this.parseValidationConfig(response)
      console.log('✅ 解析的校验配置:', validationConfig)
      console.groupEnd()
      
      return validationConfig
    } catch (error) {
      console.error('❌ 校验配置生成失败:', error)
      console.groupEnd()
      
      // 降级到原有的硬编码逻辑
      const rules = validationAnalysis.rules.map(rule => {
        const validationRule: any = {
          trigger: rule.trigger || 'blur'
        }
        
        switch (rule.type) {
          case 'required':
            validationRule.required = true
            validationRule.message = rule.message || '此字段为必填项'
            validationRule.description = '必填校验'
            break
          case 'min':
            validationRule.min = rule.value
            validationRule.message = rule.message || `最小长度为 ${rule.value}`
            validationRule.description = '最小长度'
            break
          case 'max':
            validationRule.max = rule.value
            validationRule.message = rule.message || `最大长度为 ${rule.value}`
            validationRule.description = '最大长度'
            break
          case 'pattern':
            validationRule.pattern = rule.value
            validationRule.message = rule.message || '格式不正确'
            validationRule.description = '格式校验'
            break
          case 'custom':
            validationRule.validator = rule.value
            validationRule.message = rule.message || '验证失败'
            validationRule.description = '自定义校验'
            break
        }
        
        return validationRule
      })
      
      return { rules }
    }
  }
  static async generateEventConfig(intentAnalysis: IntentAnalysis, selectedFields: FieldConfig[]): Promise<FieldEvent> {
    console.group('⚙️ 步骤2：生成事件配置')
    console.log('🧠 意图分析结果:', intentAnalysis)
    console.log('📋 所有字段:', selectedFields.map(f => `${f.fieldLabel}(${f.fieldName})`))
    
    const prompt = this.buildConfigGenerationPrompt(intentAnalysis, selectedFields)
    
    try {
      const response = await this.callLLMAPI(prompt)
      const eventConfig = this.parseEventConfig(response)
      
      console.log('✅ 生成的事件配置:', eventConfig)
      console.groupEnd()
      
      return eventConfig
    } catch (error) {
      console.error('❌ 生成事件配置失败:', error)
      console.groupEnd()
      throw new Error(`生成事件配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 生成事件配置的自然语言描述
   */
  static async generateNaturalDescription(event: FieldEvent, targetField: string, selectedFields: FieldConfig[]): Promise<string> {
    console.group('🗣️ 生成自然语言描述')
    console.log('📝 事件配置:', event)
    console.log('🎯 目标字段:', targetField)
    
    try {
      const prompt = this.buildDescriptionGenerationPrompt(event, targetField, selectedFields)
      console.log('💬 提示词:', prompt)
      
      const response = await this.callLLMAPI(prompt)
      console.log('🤖 AI响应:', response)
      
      // 解析响应，提取自然语言描述
      const description = this.parseNaturalDescription(response)
      console.log('✅ 生成的描述:', description)
      
      return description
    } catch (error) {
      console.error('❌ 生成描述失败:', error)
      // 返回默认描述
      return this.generateFallbackDescription(event)
    } finally {
      console.groupEnd()
    }
  }

  /**
   * 验证生成的事件配置
   */
  static validateEventConfig(event: FieldEvent, fields: FieldConfig[]): { valid: boolean; errors: string[] } {
    console.group('✅ 验证事件配置')
    console.log('📋 待验证的事件:', event)
    console.log('🏷️ 可用字段:', fields.map(f => f.fieldName))
    
    const errors: string[] = []
    const fieldNames = fields.map(f => f.fieldName)
    
    // 验证事件类型
    const validEventTypes = ['change', 'blur']
    console.log('🔍 验证事件类型:', event.type)
    if (!validEventTypes.includes(event.type)) {
      const error = `无效的事件类型: ${event.type}`
      console.error('❌', error)
      errors.push(error)
    } else {
      console.log('✅ 事件类型有效')
    }
    
    // 验证动作
    console.log('🔍 验证动作列表:', event.actions)
    event.actions.forEach((action, index) => {
      console.log(`🔍 验证动作 ${index + 1}:`, action)
      
      const validActionTypes = ['setValue', 'show', 'hide', 'enable', 'disable', 'validate', 'callApi']
      if (!validActionTypes.includes(action.type)) {
        const error = `动作${index + 1}: 无效的动作类型 ${action.type}`
        console.error('❌', error)
        errors.push(error)
      } else {
        console.log(`✅ 动作${index + 1}类型有效`)
      }
      
      if (action.targetField && !fieldNames.includes(action.targetField)) {
        const error = `动作${index + 1}: 目标字段 ${action.targetField} 不存在`
        console.error('❌', error)
        errors.push(error)
      } else if (action.targetField) {
        console.log(`✅ 动作${index + 1}目标字段有效`)
      }
    })
    
    const result = {
      valid: errors.length === 0,
      errors
    }
    
    console.log('📊 验证结果:', result)
    console.groupEnd()
    
    return result
  }

  // ==================== 私有方法 ====================
  
  /**
   * 构建选择性意图分析提示词
   */
  private static buildSelectiveIntentAnalysisPrompt(description: string, selectedFields: FieldConfig[], selectedTypes: string[], eventTriggerDescription?: string): string {
    // 提供完整的 JSON 格式字段信息
    const fieldsInfo = JSON.stringify(selectedFields, null, 2)

    const eventTypes = ['blur', 'change']
    
    // 根据选择的类型构建分析说明
    let analysisType = ''
    let analysisInstructions = '请仔细分析用户描述，识别以下方面的需求：\n\n'
    let requiredSections = []
    
    if (selectedTypes.includes('event')) {
      analysisType += '事件逻辑'
      analysisInstructions += '1. **事件逻辑**：字段间的交互、数据联动、自动计算等\n'
      analysisInstructions += '   - 目标字段：事件作用的对象（被修改的字段）\n'
      analysisInstructions += '   - 事件绑定字段：触发事件的字段（事件监听器绑定的字段）参考【事件触发描述】\n'
      requiredSections.push('eventAnalysis')
    }
    
    if (selectedTypes.includes('validation')) {
      if (analysisType) analysisType += '、校验规则'
      else analysisType += '校验规则'
      analysisInstructions += `${selectedTypes.indexOf('validation') + 1}. **校验规则**：数据验证、格式检查、必填项等\n`
      requiredSections.push('validationAnalysis')
    }
    
    if (selectedTypes.includes('componentConfig')) {
      if (analysisType) analysisType += '、组件配置'
      else analysisType += '组件配置'
      analysisInstructions += `${selectedTypes.indexOf('componentConfig') + 1}. **组件配置**：UI展示相关的配置，如占位符、清空按钮、过滤等\n`
      requiredSections.push('componentConfigAnalysis')
    }

    // 构建JSON结构说明
    let jsonStructure = '{\n'
    
    if (selectedTypes.includes('event')) {
      jsonStructure += `  "eventAnalysis": {
    "eventType": "事件类型(blur/change)",
    "condition": "触发条件(可选)",
    "action": "执行动作的描述",
    "targetField": "目标字段名称(事件作用的目标字段，即被修改的字段)",
    "eventBindingField": "事件绑定字段名称(触发事件的字段，即事件监听器绑定的字段，可选)",
    "sourceField": "源字段名称(如果有条件判断)",
    "description": "事件功能的简洁描述",
    "recommendedTargetField": "AI推荐的最佳目标字段",
    "recommendedEventBindingField": "AI推荐的最佳事件绑定字段"
  },\n`
    }
    
    if (selectedTypes.includes('validation')) {
      jsonStructure += `  "validationAnalysis": {
    "hasValidation": true/false,
    "rules": [
      {
        "type": "校验类型(required/min/max/pattern/custom)",
        "value": "校验值(如果适用)",
        "message": "错误提示信息",
        "trigger": "触发时机(blur/change)"
      }
    ],
    "description": "校验规则的描述",
    "recommendedTargetField": "AI推荐应用校验的字段"
  },\n`
    }
    
    if (selectedTypes.includes('componentConfig')) {
      jsonStructure += `  "componentConfigAnalysis": {
    "hasConfig": true/false,
    "config": {
      "placeholder": "占位符文本",
      "clearable": true/false,
      "filterable": true/false,
      "其他配置": "配置值"
    },
    "description": "组件配置的描述",
    "recommendedTargetField": "AI推荐应用配置的字段"
  },\n`
    }
    
    // 构建选择说明
    let selectionNote = ''
    let configTypeDescription = ''
    
    if (selectedTypes.length === 3) {
      selectionNote = '事件逻辑是必须的，校验和配置是可选的'
      configTypeDescription = '将其分解为事件逻辑、校验规则和组件配置三个独立的部分'
    } else {
      selectionNote = `只分析用户选择的配置类型，未选择的类型可以省略或设为null`
      const typeNames = selectedTypes.map(type => {
        const typeMap: { [key: string]: string } = {
          'event': '事件逻辑',
          'validation': '校验规则', 
          'componentConfig': '组件配置'
        }
        return typeMap[type] || type
      })
      configTypeDescription = `将其分解为${typeNames.join('、')}独立的部分`
    }

    return ENHANCED_INTENT_ANALYSIS_PROMPT_TEMPLATE
      .replace('{analysisType}', configTypeDescription)
      .replace('{description}', description)
      .replace('{eventTriggerDescription}', eventTriggerDescription || '用户未指定具体的事件触发条件')
      .replace('{fieldsInfo}', fieldsInfo)
      .replace('{eventTypes}', eventTypes.join(', '))
      .replace('{analysisInstructions}', analysisInstructions)
      .replace('{jsonStructure}', jsonStructure)
      .replace('{selectionNote}', selectionNote)
  }

  /**
   * 构建意图分析提示词（保持向后兼容）
   * @deprecated 使用 buildSelectiveIntentAnalysisPrompt 替代
   */
  // @ts-ignore - 忽略未使用警告，保持向后兼容
  private static buildIntentAnalysisPrompt(description: string, selectedFields: FieldConfig[], eventTriggerDescription?: string): string {
    // 使用选择性分析版本的提示词构建，默认包含所有类型以保持向后兼容
    return this.buildSelectiveIntentAnalysisPrompt(description, selectedFields, ['event', 'validation', 'componentConfig'], eventTriggerDescription)
  }



  /**
   * 构建配置生成提示词
   */
  private static buildConfigGenerationPrompt(intentAnalysis: IntentAnalysis, selectedFields: FieldConfig[]): string {
    const fieldsInfo = JSON.stringify(selectedFields, null, 2)

    return CONFIG_GENERATION_PROMPT_TEMPLATE
      .replace('{eventType}', intentAnalysis.eventType)
      .replace('{condition}', intentAnalysis.condition || '无')
      .replace('{action}', intentAnalysis.action)
      .replace('{targetField}', intentAnalysis.targetField)
      .replace('{eventBindingField}', intentAnalysis.eventBindingField || '无') 
      .replace('{sourceField}', intentAnalysis.sourceField || '无')
      .replace('{fieldsInfo}', fieldsInfo)
  }

  /**
   * 构建校验配置生成提示词
   */
  private static buildValidationGenerationPrompt(validationAnalysis: NonNullable<EnhancedIntentAnalysis['validationAnalysis']>, selectedFields: FieldConfig[]): string {
    const fieldsInfo = JSON.stringify(selectedFields, null, 2)

    const rulesInfo = validationAnalysis.rules.map(rule => 
      `${rule.type}: ${rule.message || ''} (触发: ${rule.trigger || 'blur'})`
    ).join(', ')

    return VALIDATION_GENERATION_PROMPT_TEMPLATE
      .replace('{description}', validationAnalysis.description || '校验规则')
      .replace('{rules}', rulesInfo)
      .replace('{targetField}', validationAnalysis.recommendedTargetField || '未指定')
      .replace('{fieldsInfo}', fieldsInfo)
  }

  /**
   * 构建组件配置生成提示词
   */
  private static buildComponentConfigGenerationPrompt(componentConfigAnalysis: NonNullable<EnhancedIntentAnalysis['componentConfigAnalysis']>, selectedFields: FieldConfig[]): string {
    const fieldsInfo = JSON.stringify(selectedFields, null, 2)

    // 找到目标字段的类型
    const targetField = componentConfigAnalysis.recommendedTargetField || ''
    const targetFieldInfo = selectedFields.find(f => f.fieldName === targetField)
    const fieldType = targetFieldInfo?.fieldType || 'unknown'

    return COMPONENT_CONFIG_GENERATION_PROMPT_TEMPLATE
      .replace('{description}', componentConfigAnalysis.description || '组件配置')
      .replace('{config}', JSON.stringify(componentConfigAnalysis.config, null, 2))
      .replace('{targetField}', targetField)
      .replace('{fieldType}', fieldType)
      .replace('{fieldsInfo}', fieldsInfo)
  }

  /**
   * 构建描述生成提示词
   */
  private static buildDescriptionGenerationPrompt(event: FieldEvent, targetField: string, selectedFields: FieldConfig[]): string {
    const fieldsInfo = JSON.stringify(selectedFields, null, 2)

    return DESCRIPTION_GENERATION_PROMPT_TEMPLATE
      .replace('{eventConfig}', JSON.stringify(event, null, 2))
      .replace('{targetField}', targetField)
      .replace('{fieldsInfo}', fieldsInfo)
  }

  /**
   * 调用LLM API
   */
  private static async callLLMAPI(prompt: string): Promise<string> {
    const requestData = {
      model: LLM_CONFIG.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    }

    // 打印请求信息
    console.group('🚀 LLM API 请求')
    console.log('📍 请求URL:', LLM_CONFIG.baseURL)
    console.log('🔑 API Key:', LLM_CONFIG.apiKey.substring(0, 20) + '...')
    console.log('🤖 模型:', LLM_CONFIG.model)
    console.log('📝 请求数据:', JSON.stringify(requestData, null, 2))
    console.log('💬 提示词内容:')
    console.log(prompt)
    console.groupEnd()

    try {
      const startTime = Date.now()
      
      const response = await fetch(LLM_CONFIG.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_CONFIG.apiKey}`
        },
        body: JSON.stringify(requestData)
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      // 打印响应信息
      console.group('📥 LLM API 响应')
      console.log('⏱️ 请求耗时:', duration + 'ms')
      console.log('📊 响应状态:', response.status, response.statusText)
      console.log('📋 响应头:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 错误响应内容:', errorText)
        console.groupEnd()
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ 响应数据:', JSON.stringify(data, null, 2))
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('❌ API响应格式错误:', data)
        console.groupEnd()
        throw new Error('API响应格式错误')
      }

      const content = data.choices[0].message.content
      console.log('📄 提取的内容:')
      console.log(content)
      console.groupEnd()

      return content
    } catch (error) {
      console.group('❌ LLM API 错误')
      console.error('错误详情:', error)
      console.groupEnd()
      throw new Error(`LLM API调用失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析增强的意图分析结果
   */
  private static parseEnhancedIntentAnalysis(response: string): EnhancedIntentAnalysis {
    console.group('🔍 解析增强意图分析结果')
    console.log('📄 原始响应:', response)
    
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ 响应中未找到有效的JSON')
        throw new Error('响应中未找到有效的JSON')
      }

      console.log('📋 提取的JSON:', jsonMatch[0])
      const parsed = JSON.parse(jsonMatch[0])
      console.log('✅ 解析后的对象:', parsed)
      
      // 验证至少有一个配置类型
      const hasEvent = parsed.eventAnalysis && parsed.eventAnalysis.eventType && parsed.eventAnalysis.action && parsed.eventAnalysis.targetField
      const hasValidation = parsed.validationAnalysis?.hasValidation
      const hasComponentConfig = parsed.componentConfigAnalysis?.hasConfig
      
      if (!hasEvent && !hasValidation && !hasComponentConfig) {
        console.error('❌ 增强意图分析结果必须至少包含一种配置类型:', parsed)
        throw new Error('增强意图分析结果必须至少包含一种配置类型')
      }

      const result: EnhancedIntentAnalysis = {
        eventAnalysis: parsed.eventAnalysis ? {
          eventType: parsed.eventAnalysis.eventType,
          condition: parsed.eventAnalysis.condition,
          action: parsed.eventAnalysis.action,
          targetField: parsed.eventAnalysis.targetField,
          eventBindingField: parsed.eventAnalysis.eventBindingField, // 新增事件绑定字段
          sourceField: parsed.eventAnalysis.sourceField,
          description: parsed.eventAnalysis.description || '事件配置',
          recommendedTargetField: parsed.eventAnalysis.recommendedTargetField,
          recommendedEventBindingField: parsed.eventAnalysis.recommendedEventBindingField // 新增推荐事件绑定字段
        } : undefined,
        validationAnalysis: parsed.validationAnalysis?.hasValidation ? {
          hasValidation: parsed.validationAnalysis.hasValidation,
          rules: parsed.validationAnalysis.rules || [],
          description: parsed.validationAnalysis.description || '校验规则',
          recommendedTargetField: parsed.validationAnalysis.recommendedTargetField
        } : undefined,
        componentConfigAnalysis: parsed.componentConfigAnalysis?.hasConfig ? {
          hasConfig: parsed.componentConfigAnalysis.hasConfig,
          config: parsed.componentConfigAnalysis.config || {},
          description: parsed.componentConfigAnalysis.description || '组件配置',
          recommendedTargetField: parsed.componentConfigAnalysis.recommendedTargetField
        } : undefined
      }
      
      console.log('🎯 最终增强结果:', result)
      console.groupEnd()
      
      return result
    } catch (error) {
      console.error('❌ 解析失败:', error)
      console.groupEnd()
      throw new Error(`解析增强意图分析结果失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  /**
   * 解析意图分析结果（保持向后兼容）
   * @deprecated 使用 parseEnhancedIntentAnalysis 替代
   */
  // @ts-ignore - 忽略未使用警告，保持向后兼容
  private static parseIntentAnalysis(response: string): IntentAnalysis {
    console.group('🔍 解析意图分析结果')
    console.log('📄 原始响应:', response)
    
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ 响应中未找到有效的JSON')
        throw new Error('响应中未找到有效的JSON')
      }

      console.log('📋 提取的JSON:', jsonMatch[0])
      const parsed = JSON.parse(jsonMatch[0])
      console.log('✅ 解析后的对象:', parsed)
      
      // 验证必需字段
      if (!parsed.eventType || !parsed.action || !parsed.targetField) {
        console.error('❌ 意图分析结果缺少必需字段:', parsed)
        throw new Error('意图分析结果缺少必需字段')
      }

      const result = {
        eventType: parsed.eventType,
        condition: parsed.condition,
        action: parsed.action,
        targetField: parsed.targetField,
        sourceField: parsed.sourceField
      }
      
      console.log('🎯 最终结果:', result)
      console.groupEnd()
      
      return result
    } catch (error) {
      console.error('❌ 解析失败:', error)
      console.groupEnd()
      throw new Error(`解析意图分析结果失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析事件配置
   */
  private static parseEventConfig(response: string): FieldEvent {
    console.group('🔧 解析事件配置')
    console.log('📄 原始响应:', response)
    
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ 响应中未找到有效的JSON')
        throw new Error('响应中未找到有效的JSON')
      }

      console.log('📋 提取的JSON:', jsonMatch[0])
      const parsed = JSON.parse(jsonMatch[0])
      console.log('✅ 解析后的对象:', parsed)
      
      // 验证必需字段
      if (!parsed.type || !parsed.actions || !Array.isArray(parsed.actions)) {
        console.error('❌ 事件配置格式错误:', parsed)
        throw new Error('事件配置格式错误')
      }

      const result = {
        type: parsed.type,
        description: parsed.description,
        condition: parsed.condition,
        actions: parsed.actions
      }
      
      console.log('⚙️ 最终事件配置:', result)
      console.groupEnd()
      
      return result
    } catch (error) {
      console.error('❌ 解析失败:', error)
      console.groupEnd()
      throw new Error(`解析事件配置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 解析校验配置
   */
  private static parseValidationConfig(response: string): any {
    console.group('🔧 解析校验配置')
    console.log('📄 原始响应:', response)
    
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ 响应中未找到有效的JSON')
        throw new Error('响应中未找到有效的JSON')
      }

      console.log('📋 提取的JSON:', jsonMatch[0])
      const parsed = JSON.parse(jsonMatch[0])
      console.log('✅ 解析后的对象:', parsed)
      
      // 验证必需字段
      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        console.error('❌ 校验配置格式错误:', parsed)
        throw new Error('校验配置格式错误')
      }

      const result = {
        rules: parsed.rules
      }
      
      console.log('⚙️ 最终校验配置:', result)
      console.groupEnd()
      
      return result
    } catch (error) {
      console.error('❌ 解析失败:', error)
      console.groupEnd()
      throw new Error('校验配置解析失败')
    }
  }

  /**
   * 解析组件配置
   */
  private static parseComponentConfig(response: string): any {
    console.group('🔧 解析组件配置')
    console.log('📄 原始响应:', response)
    
    try {
      // 提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('❌ 响应中未找到有效的JSON')
        throw new Error('响应中未找到有效的JSON')
      }

      console.log('📋 提取的JSON:', jsonMatch[0])
      const parsed = JSON.parse(jsonMatch[0])
      console.log('✅ 解析后的对象:', parsed)
      
      // 组件配置可以是任意结构，只需要是有效的对象
      if (typeof parsed !== 'object' || parsed === null) {
        console.error('❌ 组件配置格式错误:', parsed)
        throw new Error('组件配置格式错误')
      }

      console.log('✅ 组件配置解析成功:', parsed)
      console.groupEnd()
      return parsed
    } catch (error) {
      console.error('❌ 解析组件配置失败:', error)
      console.groupEnd()
      throw error
    }
  }

  /**
   * 解析自然语言描述
   */
  private static parseNaturalDescription(response: string): string {
    console.group('📝 解析自然语言描述')
    console.log('📄 原始响应:', response)
    
    try {
      // 清理响应内容，去除多余的格式
      let description = response.trim()
      
      // 移除可能的引号包装
      if ((description.startsWith('"') && description.endsWith('"')) ||
          (description.startsWith("'") && description.endsWith("'"))) {
        description = description.slice(1, -1)
      }
      
      // 移除可能的markdown格式
      description = description.replace(/^```[\s\S]*?```$/g, '')
      description = description.replace(/^`(.*)`$/g, '$1')
      
      // 清理多余的空白字符
      description = description.replace(/\s+/g, ' ').trim()
      
      console.log('✅ 清理后的描述:', description)
      console.groupEnd()
      
      return description || '智能事件配置已生成'
    } catch (error) {
      console.error('❌ 解析失败:', error)
      console.groupEnd()
      return '智能事件配置已生成'
    }
  }

  /**
   * 生成备用描述（当AI生成失败时使用）
   */
  /**
   * 生成备用描述（当AI生成失败时使用）
   * @deprecated 此方法已过时，使用更智能的AI生成替代
   */
  private static generateFallbackDescription(event: FieldEvent): string {
    const eventTypeMap: Record<string, string> = {
      'blur': '失去焦点时',
      'change': '值改变时',
      'click': '点击时'
    }
    
    const actionTypeMap: Record<string, string> = {
      'setValue': '设置值',
      'calculate': '计算',
      'validate': '验证',
      'show': '显示',
      'hide': '隐藏'
    }
    
    const eventTypeName = eventTypeMap[event.type] || '触发时'
    const actionName = event.actions?.[0] ? actionTypeMap[event.actions[0].type] || '执行操作' : '执行操作'
    
    return `当字段${eventTypeName}，自动${actionName}`
  }
}