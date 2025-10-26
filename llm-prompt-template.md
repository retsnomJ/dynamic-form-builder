# LLM动态表单JSON生成提示词模板

## 系统提示词 (System Prompt)

```
你是一个专业的动态表单JSON配置生成器。你的任务是根据用户提供的表单需求，生成符合动态表单数据格式规范v2.0的完整JSON配置。

## 核心要求：
1. 严格遵循动态表单数据格式规范v2.0
2. 生成的JSON必须格式正确且可解析
3. 所有字段名使用驼峰命名法
4. 提供完整的字段配置，包括验证规则和组件配置
5. 联动逻辑要清晰且无循环依赖
6. 表达式语法要正确

## 支持的字段类型：
- string: 单行文本输入
- textarea: 多行文本输入  
- integer: 整数输入
- float: 浮点数输入
- date: 日期选择
- select: 下拉选择
- radio: 单选按钮组
- checkbox: 多选框组

## 数据源类型：
- static: 静态选项数据
- api: API接口数据
  - **重要**: API接口参数中的动态搜索关键词必须使用 `{searchKeyword}` 占位符，不能使用 `{query}`
  - 示例: `"params": {"name": "{searchKeyword}"}`
- computed: 计算生成数据

## 事件类型：
- change: 值改变时触发
- focus: 获得焦点时触发
- blur: 失去焦点时触发
- input: 输入时触发

## 动作类型：
- setValue: 设置字段值
- setOptions: 设置字段选项
- setVisibility: 设置字段显示/隐藏
- setDisabled: 设置字段启用/禁用
- validate: 触发字段验证

请根据用户提供的表单需求，生成完整的JSON配置。
```

## 用户输入模板 (User Input Template)

```
请生成动态表单JSON配置，具体需求如下：

## 表单基础信息
- 表单名称: {formName}
- 表单标题: {formTitle}
- 表单描述: {formDescription}
- 布局列数: {columns}
- 标签宽度: {labelWidth}
- 标签位置: {labelPosition}

## 字段配置

### 字段1: {fieldName1}
- 字段标签: {fieldLabel1}
- 字段类型: {fieldType1}
- 是否必填: {required1}
- 占位符: {placeholder1}
- 默认值: {defaultValue1}
- 数据来源: {dataSourceType1}
  [如果是静态选项，列出所有选项]
  [如果是API接口，提供接口信息]
- 验证规则: {validationRules1}
- 联动配置: {eventConfig1}
- 组件配置: {componentConfig1}

### 字段2: {fieldName2}
[重复上述结构]

...

## 特殊要求
[任何特殊的业务逻辑或联动需求]
```

## 标准化输出格式

LLM应该按照以下格式输出：

```json
{
  "formName": "表单名称",
  "formTitle": "表单标题",
  "formDescription": "表单描述",
  "fields": [
    {
      "fieldName": "字段名称",
      "fieldLabel": "字段标签",
      "fieldType": "字段类型",
      "required": true/false,
      "placeholder": "占位符",
      "defaultValue": "默认值",
      "dataSource": {
        "type": "数据源类型",
        // 根据类型提供相应配置
      },
      "validation": {
        "rules": [
          // 验证规则数组
        ]
      },
      "events": [
        {
          "type": "事件类型",
          "actions": [
            // 动作配置数组
          ]
        }
      ],
      "componentConfig": {
        // 组件特定配置
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

## 质量检查提示词

```
生成JSON后，请检查以下项目：

1. ✅ JSON格式正确，所有括号和引号匹配
2. ✅ 字段名使用驼峰命名法（如userName, productCode）
3. ✅ 所有必填属性都已提供
4. ✅ 字段类型在支持列表中
5. ✅ 数据源配置完整且格式正确
6. ✅ 验证规则合理且语法正确
7. ✅ 联动逻辑清晰，无循环依赖
8. ✅ 表达式语法正确（selectedOption.xxx, formData.xxx）
9. ✅ 组件配置符合字段类型要求
10. ✅ 布局配置合理

如果发现问题，请修正后重新输出完整的JSON配置。
```

## 实际使用示例

### 示例1：简单用户信息表单

**用户输入：**
```
请生成动态表单JSON配置，具体需求如下：

## 表单基础信息
- 表单名称: userInfoForm
- 表单标题: 用户信息
- 表单描述: 用户基本信息填写
- 布局列数: 2
- 标签宽度: 100px
- 标签位置: right

## 字段配置

### 字段1: userName
- 字段标签: 用户名
- 字段类型: string
- 是否必填: 是
- 占位符: 请输入用户名
- 数据来源: 手填
- 验证规则: 必填，长度3-20，只能包含字母数字下划线

### 字段2: email
- 字段标签: 邮箱
- 字段类型: string
- 是否必填: 是
- 占位符: 请输入邮箱地址
- 数据来源: 手填
- 验证规则: 必填，邮箱格式

### 字段3: userType
- 字段标签: 用户类型
- 字段类型: select
- 是否必填: 是
- 占位符: 请选择用户类型
- 数据来源: 静态选项
  - personal: 个人用户
  - enterprise: 企业用户
- 联动配置: 当选择企业用户时，显示公司名称字段

### 字段4: companyName
- 字段标签: 公司名称
- 字段类型: string
- 是否必填: 是
- 是否隐藏: 是（默认隐藏，通过联动显示）
- 占位符: 请输入公司名称
- 数据来源: 手填
- 验证规则: 必填
```

### 示例2：复杂产品配置表单

**用户输入：**
```
请生成动态表单JSON配置，具体需求如下：

## 表单基础信息
- 表单名称: productConfigForm
- 表单标题: 产品配置
- 表单描述: 产品信息配置和价格计算
- 布局列数: 2

## 字段配置

### 字段1: productCategory
- 字段标签: 产品类别
- 字段类型: select
- 是否必填: 是
- 数据来源: API接口
  - 接口地址: /api/categories
  - 请求方法: GET
  - 响应映射: value=id, label=name
- 联动配置: 改变时清空产品型号字段，并重新加载产品型号选项

### 字段2: productModel
- 字段标签: 产品型号
- 字段类型: select
- 是否必填: 是
- 是否禁用: 是（默认禁用，选择类别后启用）
- 数据来源: API接口
  - 接口地址: /api/models
  - 请求方法: GET
  - 请求参数: categoryId来自productCategory字段
- 联动配置: 改变时设置基础价格和产品编码

### 字段3: basePrice
- 字段标签: 基础价格
- 字段类型: float
- 是否必填: 是
- 是否禁用: 是（通过联动设置）
- 组件配置: 精度2位小数，最小值0

### 字段4: quantity
- 字段标签: 数量
- 字段类型: integer
- 是否必填: 是
- 默认值: 1
- 组件配置: 最小值1，最大值999
- 联动配置: 改变时重新计算总价

### 字段5: totalPrice
- 字段标签: 总价
- 字段类型: float
- 是否禁用: 是
- 组件配置: 精度2位小数
- 联动配置: 通过quantity * basePrice计算得出

## 特殊要求
- 产品型号的选项需要根据产品类别动态加载
- 总价需要实时计算：数量 × 基础价格
- 所有价格字段保留2位小数
```

## 使用建议

1. **准备阶段**：
   - 明确表单的业务需求
   - 整理字段列表和数据来源
   - 确定字段间的联动关系

2. **输入阶段**：
   - 按照模板逐项填写信息
   - 详细描述联动逻辑
   - 明确验证规则要求

3. **生成阶段**：
   - 使用系统提示词设置LLM上下文
   - 提供完整的用户输入
   - 要求LLM进行质量检查

4. **验证阶段**：
   - 检查生成的JSON格式
   - 验证字段配置完整性
   - 测试联动逻辑正确性

5. **优化阶段**：
   - 根据实际使用情况调整配置
   - 优化用户体验
   - 完善错误处理