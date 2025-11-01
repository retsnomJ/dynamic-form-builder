// 事件生成服务
import type { FieldConfig, FieldEvent, EventAction } from '../../types/form-config'

// 关键信息接口
export interface EventKeyInfo {
  description: string
  availableFields: FieldSummary[]
  supportedEvents: string[]
  supportedActions: string[]
}

// 字段摘要信息
export interface FieldSummary {
  name: string
  label: string
  type: string
}

// LLM响应接口
export interface LLMResponse {
  success: boolean
  event?: FieldEvent
  error?: string
}

// 意图分析结果接口
export interface IntentAnalysis {
  eventType: string
  condition?: string
  action: string
  targetField: string
  sourceField?: string
}

// LLM API配置
const LLM_CONFIG = {
  apiKey: 'sk-ixauooosjextdttvjfhnzhlrowjuxuenohsrlblbtblaqwem',
  model: 'Qwen/Qwen3-Coder-480B-A35B-Instruct',
  baseURL: 'https://api.siliconflow.cn/v1/chat/completions'
}

export class EventGeneratorService {
  
  /**
   * 从表单配置中提取关键信息
   */
  static extractKeyInfo(fields: FieldConfig[], description: string): EventKeyInfo {
    const fieldSummaries: FieldSummary[] = fields.map(field => ({
      name: field.fieldName,
      label: field.fieldLabel,
      type: field.fieldType
    }))

    return {
      description: description.trim(),
      availableFields: fieldSummaries,
      supportedEvents: ['change', 'focus', 'blur', 'input'],
      supportedActions: ['setValue', 'show', 'hide', 'enable', 'disable', 'validate', 'callApi']
    }
  }

  /**
   * 第一步：分析用户意图
   */
  static async analyzeIntent(description: string, selectedFields: FieldConfig[]): Promise<IntentAnalysis> {
    console.group('🧠 步骤1：意图分析')
    console.log('📝 用户描述:', description)
    console.log('🎯 选择的字段:', selectedFields.map(f => `${f.fieldLabel}(${f.fieldName})`))
    
    const prompt = this.generateIntentAnalysisPrompt(description, selectedFields)
    
    try {
      const response = await this.callLLMAPINew(prompt)
      const analysis = this.parseIntentAnalysis(response)
      
      console.log('✅ 意图分析结果:', analysis)
      console.groupEnd()
      
      return analysis
    } catch (error) {
      console.error('❌ 意图分析失败:', error)
      console.groupEnd()
      throw new Error(`意图分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 第二步：生成事件配置
   */
  static async generateEventConfig(intentAnalysis: IntentAnalysis, allFields: FieldConfig[]): Promise<FieldEvent> {
    console.group('⚙️ 步骤2：生成事件配置')
    console.log('🧠 意图分析结果:', intentAnalysis)
    console.log('📋 所有字段:', allFields.map(f => `${f.fieldLabel}(${f.fieldName})`))
    
    const prompt = this.generateConfigPrompt(intentAnalysis, allFields)
    
    try {
      const response = await this.callLLMAPINew(prompt)
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
   * 生成意图分析提示词
   */
  private static generateIntentAnalysisPrompt(description: string, selectedFields: FieldConfig[]): string {
    const fieldsInfo = selectedFields.map(field => 
      `- ${field.fieldName} (${field.fieldLabel}): ${field.fieldType}`
    ).join('\n')

    const eventTypes = ['input', 'blur', 'focus', 'change']

    return `你是一个表单事件配置专家。请分析用户的需求描述，理解用户想要实现的事件逻辑。

用户描述：${description}

相关字段：
${fieldsInfo}

可用事件类型：${eventTypes.join(', ')}

请分析用户的意图，并以JSON格式返回分析结果：
{
  "eventType": "事件类型(input/blur/focus/change)",
  "condition": "触发条件(可选)",
  "action": "执行动作的描述",
  "targetField": "目标字段名称",
  "sourceField": "源字段名称(如果有条件判断)"
}

要求：
1. 准确识别事件类型
2. 明确触发条件
3. 清晰描述执行动作
4. 正确识别目标字段和源字段

请只返回JSON，不要其他内容。`
  }

  /**
   * 生成配置提示词
   */
  private static generateConfigPrompt(intentAnalysis: IntentAnalysis, allFields: FieldConfig[]): string {
    const fieldsInfo = allFields.map(field => 
      `- ${field.fieldName} (${field.fieldLabel}): ${field.fieldType}`
    ).join('\n')

    return `你是一个表单事件配置代码生成专家。基于意图分析结果，生成具体的事件配置代码。

意图分析结果：
- 事件类型: ${intentAnalysis.eventType}
- 触发条件: ${intentAnalysis.condition || '无'}
- 执行动作: ${intentAnalysis.action}
- 目标字段: ${intentAnalysis.targetField}
- 源字段: ${intentAnalysis.sourceField || '无'}

所有字段信息：
${fieldsInfo}

请生成符合以下格式的事件配置JSON：
{
  "type": "事件类型",
  "condition": "条件表达式(可选)",
  "actions": [
    {
      "type": "动作类型",
      "targetField": "目标字段",
      "sourceExpression": "值或表达式",
      "value": "直接值(可选)"
    }
  ]
}

动作类型包括：setValue, show, hide, enable, disable, validate, callApi

条件表达式示例：
- "formData.product && formData.product.startsWith('bt')"
- "formData.price > 100"
- "formData.category === 'electronics'"

值表达式示例：
- "formData.price * 10"
- "'新值'"
- "formData.otherField + 100"

请只返回JSON配置，不要其他内容。`
  }

  /**
   * 调用LLM API（新版本，带详细日志）
   */
  private static async callLLMAPINew(prompt: string): Promise<string> {
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
   * 解析意图分析结果
   */
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
   * 生成LLM提示词
   */
  static generateLLMPrompt(keyInfo: EventKeyInfo): string {
    const fieldsDescription = keyInfo.availableFields
      .map(field => `- ${field.label}(${field.name}): ${field.type}类型`)
      .join('\n')

    return `你是一个专业的表单事件配置生成器。请根据用户的自然语言描述，生成准确的事件配置JSON。

## 用户需求描述
${keyInfo.description}

## 可用字段信息
${fieldsDescription}

## 支持的事件类型
${keyInfo.supportedEvents.join(', ')}

## 支持的动作类型
${keyInfo.supportedActions.join(', ')}

## 配置规则
1. **字段值访问**: 使用 formData.fieldName 格式
2. **字符串操作**: 
   - 以某值开头: formData.fieldName.startsWith("value")
   - 以某值结尾: formData.fieldName.endsWith("value")
   - 包含某值: formData.fieldName.includes("value")
3. **数值计算**: 直接使用数学运算符 (+, -, *, /, %)
4. **条件判断**: 使用JavaScript表达式语法
5. **目标字段**: 动作中的targetField必须是可用字段之一

## 输出格式
请严格按照以下JSON格式输出，不要包含任何其他文字：

{
  "type": "事件类型",
  "condition": "触发条件表达式(可选)",
  "actions": [
    {
      "type": "动作类型",
      "targetField": "目标字段名",
      "sourceExpression": "源表达式或计算公式",
      "value": "直接设置的值(可选)",
      "condition": "执行条件表达式(可选)"
    }
  ]
}

## 示例
用户描述: "当产品名称以bt开头时，单价在失去焦点时乘以10"
生成配置:
{
  "type": "blur",
  "actions": [
    {
      "type": "setValue",
      "targetField": "price",
      "sourceExpression": "formData.price * 10",
      "condition": "formData.product && formData.product.startsWith('bt')"
    }
  ]
}

请为当前用户需求生成配置：`
  }

  /**
   * 解析用户描述，识别关键元素
   */
  static parseDescription(description: string, fields: FieldConfig[]) {
    const fieldNames = fields.map(f => f.fieldName)
    const fieldLabels = fields.map(f => f.fieldLabel)
    
    // 识别触发事件类型
    const eventKeywords = {
      'change': ['改变', '选择', '变化'],
      'blur': ['失去焦点', '离开', '失焦'],
      'focus': ['获得焦点', '聚焦', '点击'],
      'input': ['输入', '键入']
    }
    
    // 识别动作类型
    const actionKeywords = {
      'setValue': ['设置', '赋值', '等于', '乘以', '加上', '减去', '除以'],
      'show': ['显示', '展示'],
      'hide': ['隐藏', '不显示'],
      'enable': ['启用', '可用'],
      'disable': ['禁用', '不可用']
    }
    
    // 识别条件关键词
    const conditionKeywords = {
      'startsWith': ['以...开头', '开头是'],
      'endsWith': ['以...结尾', '结尾是'],
      'includes': ['包含', '含有'],
      'equals': ['等于', '是']
    }

    return {
      eventType: this.findKeywordMatch(description, eventKeywords),
      actionType: this.findKeywordMatch(description, actionKeywords),
      conditionType: this.findKeywordMatch(description, conditionKeywords),
      mentionedFields: this.findMentionedFields(description, fieldNames, fieldLabels)
    }
  }

  /**
   * 查找关键词匹配
   */
  private static findKeywordMatch(text: string, keywords: Record<string, string[]>): string | null {
    for (const [key, values] of Object.entries(keywords)) {
      if (values.some(keyword => text.includes(keyword))) {
        return key
      }
    }
    return null
  }

  /**
   * 查找提到的字段
   */
  private static findMentionedFields(text: string, fieldNames: string[], fieldLabels: string[]): string[] {
    const mentioned: string[] = []
    
    // 检查字段名
    fieldNames.forEach(name => {
      if (text.includes(name)) {
        mentioned.push(name)
      }
    })
    
    // 检查字段标签
    fieldLabels.forEach((label, index) => {
      if (text.includes(label)) {
        const fieldName = fieldNames[index]
        if (!mentioned.includes(fieldName)) {
          mentioned.push(fieldName)
        }
      }
    })
    
    return mentioned
  }

  /**
   * 模拟LLM API调用
   * 实际项目中应该替换为真实的LLM API调用
   */
  static async callLLMAPI(prompt: string): Promise<LLMResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    
    try {
      // 这里应该调用真实的LLM API
      // const response = await fetch('/api/llm/generate', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt })
      // })
      
      // 模拟LLM响应
      const mockResponse = this.generateMockResponse(prompt)
      
      return {
        success: true,
        event: mockResponse
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成失败'
      }
    }
  }

  /**
   * 生成模拟响应（用于演示）
   */
  private static generateMockResponse(prompt: string): FieldEvent {
    // 简单的模式匹配来生成合理的响应
    const promptLower = prompt.toLowerCase()
    
    if (promptLower.includes('bt') && promptLower.includes('10') && promptLower.includes('price')) {
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
    
    if (promptLower.includes('hide') || promptLower.includes('隐藏')) {
      return {
        type: 'change',
        actions: [
          {
            type: 'hide',
            targetField: 'targetField',
            condition: 'formData.sourceField === "someValue"'
          }
        ]
      }
    }
    
    // 默认响应
    return {
      type: 'change',
      actions: [
        {
          type: 'setValue',
          targetField: 'field1',
          sourceExpression: 'formData.field2'
        }
      ]
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
    const validEventTypes = ['change', 'focus', 'blur', 'input']
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

  /**
   * 生成事件配置的自然语言描述
   */
  static async generateNaturalDescription(event: FieldEvent, targetField: string, allFields: FieldConfig[]): Promise<string> {
    console.group('🗣️ 生成自然语言描述')
    console.log('📝 事件配置:', event)
    console.log('🎯 目标字段:', targetField)
    
    try {
      const prompt = this.generateDescriptionPrompt(event, targetField, allFields)
      console.log('💬 提示词:', prompt)
      
      const response = await this.callLLMAPINew(prompt)
      console.log('🤖 AI响应:', response)
      
      // 解析响应，提取自然语言描述
      const description = this.parseNaturalDescription(response)
      console.log('✅ 生成的描述:', description)
      
      return description
    } catch (error) {
      console.error('❌ 生成描述失败:', error)
      // 返回默认描述
      return this.generateFallbackDescription(event, targetField)
    } finally {
      console.groupEnd()
    }
  }

  /**
   * 生成自然语言描述的提示词
   */
  private static generateDescriptionPrompt(event: FieldEvent, targetField: string, allFields: FieldConfig[]): string {
    const targetFieldInfo = allFields.find(f => f.fieldName === targetField)
    const targetFieldLabel = targetFieldInfo?.fieldLabel || targetField

    return `请将以下技术配置转换为普通用户能理解的自然语言描述：

目标字段：${targetFieldLabel}（${targetField}）
事件配置：
${JSON.stringify(event, null, 2)}

要求：
1. 使用简单易懂的语言，避免技术术语
2. 描述应该清楚说明什么时候触发、做什么操作
3. 长度控制在50字以内
4. 语言要亲切友好，符合中文表达习惯

示例格式：
- "当产品名称输入完成后，自动计算并填入单价"
- "当用户选择不同类别时，自动更新相关选项"

请直接返回描述文字，不要包含其他内容：`
  }

  /**
   * 解析自然语言描述响应
   */
  private static parseNaturalDescription(response: string): string {
    // 清理响应文本
    let description = response.trim()
    
    // 移除可能的引号
    if (description.startsWith('"') && description.endsWith('"')) {
      description = description.slice(1, -1)
    }
    
    // 移除可能的前缀
    description = description.replace(/^(描述：|自然语言描述：|说明：)/, '')
    
    // 限制长度
    if (description.length > 80) {
      description = description.substring(0, 77) + '...'
    }
    
    return description || '智能事件配置已生成'
  }

  /**
   * 生成备用描述（当AI生成失败时使用）
   */
  private static generateFallbackDescription(event: FieldEvent, targetField: string): string {
    const eventTypeMap: Record<string, string> = {
      'blur': '失去焦点时',
      'change': '值改变时',
      'focus': '获得焦点时',
      'input': '输入时',
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