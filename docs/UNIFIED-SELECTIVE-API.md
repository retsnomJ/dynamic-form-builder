# 统一选择性意图分析API使用指南

## 概述

我们已经重构了事件生成服务，现在使用统一的 `analyzeSelectiveIntent` 方法来处理所有意图分析需求。这个API支持选择性分析和完整分析，取代了之前的 `analyzeEnhancedIntent` 方法。

## API变更

### 旧用法（已删除）
```typescript
// ❌ 已删除的方法
const analysis = await EventGeneratorService.analyzeEnhancedIntent(description, fields)
```

### 新用法（统一接口）
```typescript
// ✅ 新的统一接口
const analysis = await EventGeneratorService.analyzeSelectiveIntent(description, fields)

// ✅ 选择性分析 - 只分析事件逻辑
const eventAnalysis = await EventGeneratorService.analyzeSelectiveIntent(
  description, 
  fields, 
  ['event']
)

// ✅ 选择性分析 - 只分析校验规则
const validationAnalysis = await EventGeneratorService.analyzeSelectiveIntent(
  description, 
  fields, 
  ['validation']
)

// ✅ 组合分析 - 分析事件和校验
const combinedAnalysis = await EventGeneratorService.analyzeSelectiveIntent(
  description, 
  fields, 
  ['event', 'validation']
)
```

## 使用场景

### 1. 完整分析（默认行为）
当需要分析所有配置类型时，不需要指定 `selectedTypes` 参数：

```typescript
const analysis = await EventGeneratorService.analyzeSelectiveIntent(
  '当产品名称以bt开头时，价格自动乘以10；价格必须大于0；产品字段显示占位符',
  fields
)
// 分析结果包含：eventAnalysis, validationAnalysis, componentConfigAnalysis
```

### 2. 选择性分析
当只需要特定类型的配置时，指定相应的类型：

```typescript
// 只分析事件逻辑
const eventResult = await EventGeneratorService.analyzeSelectiveIntent(
  '当产品名称以bt开头时，价格自动乘以10',
  fields,
  ['event']
)

// 只分析校验规则
const validationResult = await EventGeneratorService.analyzeSelectiveIntent(
  '价格必须大于0且小于10000',
  fields,
  ['validation']
)

// 只分析组件配置
const configResult = await EventGeneratorService.analyzeSelectiveIntent(
  '产品字段显示"请输入产品名称"占位符',
  fields,
  ['componentConfig']
)
```

### 3. 组合分析
可以组合多个类型进行分析：

```typescript
const result = await EventGeneratorService.analyzeSelectiveIntent(
  '当产品名称以bt开头时，价格自动乘以10；价格必须大于0',
  fields,
  ['event', 'validation'] // 只分析事件和校验，不分析组件配置
)
```

## 新的事件绑定字段支持

新的统一API支持我们之前添加的 `eventBindingField` 功能，可以更好地区分：

- **目标字段 (targetField)**：事件作用的目标字段（被修改的字段）
- **事件绑定字段 (eventBindingField)**：触发事件的字段（事件监听器绑定的字段）

### 示例
```typescript
const result = await EventGeneratorService.analyzeSelectiveIntent(
  '当用户选择产品类别时，自动更新产品列表',
  fields,
  ['event']
)

// 结果可能包含：
// eventAnalysis: {
//   eventType: 'change',
//   action: '更新产品列表',
//   targetField: 'product',        // 被修改的字段
//   eventBindingField: 'category',  // 触发事件的字段
//   ...
// }
```

## 向后兼容

所有现有的调用 `analyzeEnhancedIntent` 的地方都需要更新为使用 `analyzeSelectiveIntent`。这个变更保持了相同的返回类型和接口约定，只是方法名和调用方式发生了变化。

## 优势

1. **统一的API**：一个方法处理所有意图分析需求
2. **灵活性**：可以选择性分析特定类型的配置
3. **性能优化**：只分析需要的配置类型，减少不必要的处理
4. **清晰性**：明确的意图分离，避免混淆不同配置类型
5. **新功能支持**：完全支持新的事件绑定字段功能