# 动态表单数据格式规范 v2.0

## 概述

本文档详细说明了动态表单系统的JSON配置格式，支持完全基于配置驱动的表单渲染，无需硬编码任何业务逻辑。

## 完整配置结构

```typescript
interface FormConfig {
  formName: string           // 表单名称
  formTitle?: string         // 表单标题（可选）
  formDescription?: string   // 表单描述（可选）
  fields: FieldConfig[]      // 字段配置数组
  layout?: LayoutConfig      // 布局配置（可选）
  validation?: ValidationConfig // 全局验证配置（可选）
}
```

## 字段配置 (FieldConfig)

### 基础属性

```typescript
interface FieldConfig {
  fieldName: string          // 字段名称（必填，作为数据key）
  fieldLabel: string         // 字段标签（必填，显示名称）
  fieldType: FieldType       // 字段类型（必填）
  required?: boolean         // 是否必填（默认false）
  disabled?: boolean         // 是否禁用（默认false）
  hidden?: boolean           // 是否隐藏（默认false）
  placeholder?: string       // 占位符文本
  defaultValue?: any         // 默认值
  description?: string       // 字段说明
  dataSource?: DataSource    // 数据源配置
  validation?: FieldValidation // 字段验证规则
  events?: FieldEvent[]      // 字段事件配置
  componentConfig?: ComponentConfig // 组件特定配置
}
```

### 支持的字段类型

```typescript
type FieldType = 
  | 'string'      // 单行文本输入
  | 'textarea'    // 多行文本输入
  | 'integer'     // 整数输入
  | 'float'       // 浮点数输入
  | 'date'        // 日期选择
  | 'select'      // 下拉选择
  | 'radio'       // 单选按钮组
  | 'checkbox'    // 多选框组
```

## 数据源配置 (DataSource)

### 静态数据源

```json
{
  "type": "static",
  "options": [
    {
      "value": "option1",
      "label": "选项1",
      "disabled": false,
      "customProperty": "自定义属性值"
    }
  ]
}
```

### API数据源

```json
{
  "type": "api",
  "url": "https://api.example.com/options",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer token"
  },
  "params": {
    "category": "type1"
  },
  "responseMapping": {
    "value": "id",
    "label": "name"
  }
}
```

### 计算数据源

```json
{
  "type": "computed",
  "dependsOn": ["field1", "field2"],
  "computeFunction": "computeOptions"
}
```

## 字段事件配置 (FieldEvent)

### 事件类型

```typescript
interface FieldEvent {
  type: 'change' | 'focus' | 'blur' | 'input'
  actions: EventAction[]
}

interface EventAction {
  type: 'setValue' | 'setOptions' | 'setVisibility' | 'setDisabled' | 'validate'
  targetField?: string        // 目标字段名
  sourceExpression?: string   // 源表达式
  value?: any                // 固定值
  condition?: string         // 执行条件
}
```

### 联动示例

```json
{
  "type": "change",
  "actions": [
    {
      "type": "setValue",
      "targetField": "productCode",
      "sourceExpression": "selectedOption.code"
    },
    {
      "type": "setValue",
      "targetField": "productName",
      "sourceExpression": "selectedOption.name"
    },
    {
      "type": "setVisibility",
      "targetField": "advancedOptions",
      "condition": "selectedOption.type === 'advanced'"
    }
  ]
}
```

## 组件特定配置 (ComponentConfig)

### 输入框配置

```json
{
  "clearable": true,
  "showPassword": false,
  "maxLength": 100,
  "minLength": 0
}
```

### 数字输入配置

```json
{
  "min": 0,
  "max": 999999,
  "precision": 2,
  "step": 1
}
```

### 日期选择配置

```json
{
  "format": "YYYY-MM-DD",
  "valueFormat": "x",
  "disabledDate": "function"
}
```

### 选择框配置

```json
{
  "clearable": true,
  "filterable": true,
  "multiple": false,
  "multipleLimit": 0
}
```

### 文本域配置

```json
{
  "rows": 3,
  "autosize": true,
  "resize": "vertical"
}
```

## 验证配置 (Validation)

### 字段验证

```json
{
  "rules": [
    {
      "type": "required",
      "message": "此字段为必填项"
    },
    {
      "type": "pattern",
      "pattern": "^[a-zA-Z0-9]+$",
      "message": "只能包含字母和数字"
    },
    {
      "type": "length",
      "min": 6,
      "max": 20,
      "message": "长度必须在6-20个字符之间"
    },
    {
      "type": "custom",
      "validator": "customValidatorFunction",
      "message": "自定义验证失败"
    }
  ]
}
```

## 布局配置 (LayoutConfig)

```json
{
  "columns": 2,
  "labelWidth": "120px",
  "labelPosition": "right",
  "size": "default",
  "disabled": false
}
```

## 完整示例

### 产品管理表单

```json
{
  "formName": "productForm",
  "formTitle": "产品信息管理",
  "formDescription": "用于管理产品基本信息和规格参数",
  "fields": [
    {
      "fieldName": "productCategory",
      "fieldLabel": "产品类别",
      "fieldType": "select",
      "required": true,
      "placeholder": "请选择产品类别",
      "dataSource": {
        "type": "static",
        "options": [
          {
            "value": "electronics",
            "label": "电子产品",
            "subcategories": ["laptop", "phone", "tablet"]
          },
          {
            "value": "clothing",
            "label": "服装",
            "subcategories": ["shirt", "pants", "shoes"]
          }
        ]
      },
      "events": [
        {
          "type": "change",
          "actions": [
            {
              "type": "setOptions",
              "targetField": "productSubcategory",
              "sourceExpression": "selectedOption.subcategories"
            },
            {
              "type": "setValue",
              "targetField": "productSubcategory",
              "value": null
            }
          ]
        }
      ]
    },
    {
      "fieldName": "productSubcategory",
      "fieldLabel": "产品子类别",
      "fieldType": "select",
      "required": true,
      "placeholder": "请先选择产品类别",
      "disabled": true,
      "dataSource": {
        "type": "computed",
        "dependsOn": ["productCategory"]
      }
    },
    {
      "fieldName": "productName",
      "fieldLabel": "产品名称",
      "fieldType": "string",
      "required": true,
      "placeholder": "请输入产品名称",
      "validation": {
        "rules": [
          {
            "type": "required",
            "message": "产品名称不能为空"
          },
          {
            "type": "length",
            "min": 2,
            "max": 50,
            "message": "产品名称长度必须在2-50个字符之间"
          }
        ]
      }
    },
    {
      "fieldName": "productCode",
      "fieldLabel": "产品编码",
      "fieldType": "string",
      "required": true,
      "placeholder": "自动生成或手动输入",
      "componentConfig": {
        "clearable": true,
        "maxLength": 20
      }
    },
    {
      "fieldName": "price",
      "fieldLabel": "价格",
      "fieldType": "float",
      "required": true,
      "placeholder": "请输入价格",
      "componentConfig": {
        "min": 0,
        "max": 999999,
        "precision": 2,
        "step": 0.01
      }
    },
    {
      "fieldName": "description",
      "fieldLabel": "产品描述",
      "fieldType": "textarea",
      "placeholder": "请输入产品详细描述",
      "componentConfig": {
        "rows": 4,
        "maxLength": 500
      }
    },
    {
      "fieldName": "status",
      "fieldLabel": "状态",
      "fieldType": "radio",
      "defaultValue": "active",
      "dataSource": {
        "type": "static",
        "options": [
          {"value": "active", "label": "启用"},
          {"value": "inactive", "label": "禁用"},
          {"value": "draft", "label": "草稿"}
        ]
      }
    },
    {
      "fieldName": "tags",
      "fieldLabel": "标签",
      "fieldType": "checkbox",
      "dataSource": {
        "type": "static",
        "options": [
          {"value": "hot", "label": "热销"},
          {"value": "new", "label": "新品"},
          {"value": "discount", "label": "促销"},
          {"value": "limited", "label": "限量"}
        ]
      }
    },
    {
      "fieldName": "launchDate",
      "fieldLabel": "上市日期",
      "fieldType": "date",
      "placeholder": "请选择上市日期",
      "componentConfig": {
        "format": "YYYY-MM-DD",
        "valueFormat": "x"
      }
    }
  ],
  "layout": {
    "columns": 2,
    "labelWidth": "120px",
    "labelPosition": "right"
  }
}
```

## 表达式语法

### 支持的表达式

1. **selectedOption.property** - 获取选中选项的属性
2. **formData.fieldName** - 获取表单字段值
3. **condition expressions** - 条件表达式（如 `value > 100`）

### 示例

```javascript
// 获取选中选项的自定义属性
"selectedOption.customCode"

// 根据其他字段值设置条件
"formData.category === 'premium'"

// 复合条件
"selectedOption.type === 'advanced' && formData.level > 5"
```

## 最佳实践

### 1. 字段命名规范
- 使用驼峰命名法：`productName`, `customerInfo`
- 避免使用保留字：`value`, `label`, `key`
- 保持语义化：字段名应能清楚表达其用途

### 2. 数据源设计
- 静态数据适用于固定选项（如状态、类型）
- API数据源适用于动态数据（如用户列表、产品目录）
- 合理使用缓存避免重复请求

### 3. 联动设计
- 保持联动逻辑简单明了
- 避免循环依赖
- 提供合理的默认值和占位符

### 4. 验证规则
- 前端验证主要用于用户体验
- 重要数据必须在后端再次验证
- 提供清晰的错误提示信息

### 5. 性能优化
- 大量选项时使用虚拟滚动
- 合理使用字段的显示/隐藏而非动态创建
- 避免在change事件中执行重计算操作

## 版本更新记录

### v2.0 (当前版本)
- 新增API数据源支持
- 增强字段联动功能
- 添加自定义验证器
- 支持复杂布局配置

### v1.0
- 基础字段类型支持
- 静态数据源
- 简单联动功能