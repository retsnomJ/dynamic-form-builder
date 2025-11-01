# 下拉框接口数据格式规范

## 概述

本文档定义了动态表单系统中下拉框组件所使用的API接口数据格式规范，确保所有下拉框接口返回统一、可预测的数据结构。

## 标准响应格式

### 基础响应结构

所有下拉框接口必须返回以下标准格式：

```json
{
  "success": boolean,
  "message": string,
  "count": number,
  "data": Array<OptionItem>
}
```

### 选项数据结构 (OptionItem)

每个选项**必须**包含 `value` 字段，其他字段可根据业务需要自定义：

```typescript
interface OptionItem {
  value: string | number;    // 必需：选项的唯一标识值（如ID、编码等）
  [key: string]: any;        // 可选：任意业务字段，通过responseMapping配置映射
}
```

**设计原则：**
- `value` 字段是唯一必需的，用作选项的标识值
- 显示标签通过 `responseMapping.label` 配置映射到任意字段
- 支持任意额外字段，提供最大的灵活性

## 数据路径配置

### 推荐配置

根据标准响应结构，统一使用以下配置：

1. **标准格式** (推荐)
   ```json
   {
     "success": true,
     "message": "获取成功",
     "count": 2,
     "data": [...]
   }
   ```
   配置：`dataPath: 'data'`

### 其他兼容格式

为了兼容现有接口，也支持以下格式：

2. **嵌套格式**
   ```json
   {
     "success": true,
     "data": {
       "options": [...]
     }
   }
   ```
   配置：`dataPath: 'data.options'`

3. **直接数组格式**
   ```json
   [...]
   ```
   配置：`dataPath: ''` 或不设置

## 接口类型分类

### 1. 静态选项接口

用于获取固定的选项列表，虽然数据相对固定，但建议仍然启用搜索功能以提升用户体验。

**特征：**
- `isSearchable: true` (推荐，即使是静态数据也支持搜索)
- 无需 `params` 配置
- 返回完整选项列表

**示例：**
```typescript
{
  id: 'customer-types',
  name: '客户类型选项接口',
  url: 'http://localhost:3005/api/options/customer-types',
  method: 'GET',
  responseMapping: {
    value: 'value',
    label: 'label'
  },
  dataPath: 'data',
  isSearchable: true
}
```

### 2. 搜索型接口

支持根据关键词搜索的动态选项接口。

**特征：**
- `isSearchable: true`
- 包含 `params` 配置，通常为 `{name: '{searchKeyword}'}`
- 支持实时搜索

**示例：**
```typescript
{
  id: 'products-search',
  name: '产品搜索接口',
  url: 'http://localhost:3005/api/products/search',
  method: 'GET',
  params: {
    name: '{searchKeyword}'
  },
  responseMapping: {
    value: 'partNumber',
    label: 'name'
  },
  dataPath: 'data',
  isSearchable: true
}
```

## 响应映射配置

### 灵活映射原则

`responseMapping` 配置允许将API返回的任意字段映射为选项的值和标签：

```typescript
responseMapping: {
  value: string,     // 必需：指向作为选项值的字段名（如'id', 'code', 'partNumber'等）
  label: string,     // 必需：指向作为显示标签的字段名（如'name', 'title', 'description'等）
  customData?: {     // 可选：映射额外的业务数据
    [key: string]: string
  }
}
```

### 映射示例

**示例1：用户接口**
```typescript
// API返回数据
{
  "data": [
    {"id": 1, "username": "张三", "email": "zhang@example.com", "department": "技术部"}
  ]
}

// 映射配置
responseMapping: {
  value: 'id',           // 使用用户ID作为选项值
  label: 'username'      // 使用用户名作为显示标签
}
```

**示例2：产品接口**
```typescript
// API返回数据
{
  "data": [
    {"partNumber": "P001", "productName": "iPhone 15", "category": "手机", "price": 5999}
  ]
}

// 映射配置
responseMapping: {
  value: 'partNumber',        // 使用零件号作为选项值
  label: 'productName',       // 使用产品名称作为显示标签
  customData: {               // 保存额外数据供后续使用
    category: 'category',
    price: 'price'
  }
}
```

**示例3：部门接口**
```typescript
// API返回数据
{
  "data": {
    "departments": [
      {"deptCode": "TECH", "deptName": "技术部", "manager": "李经理"}
    ]
  }
}

// 映射配置
responseMapping: {
  value: 'deptCode',     // 使用部门代码作为选项值
  label: 'deptName'      // 使用部门名称作为显示标签
}
```

## 标准API响应示例

### 客户类型接口（固定字段结构）

**请求：** `GET /api/options/customer-types`

**响应：**
```json
{
  "success": true,
  "message": "客户类型选项获取成功",
  "count": 2,
  "data": [
    {
      "value": "normal",
      "label": "普通客户"
    },
    {
      "value": "vip", 
      "label": "VIP客户"
    }
  ]
}
```

**配置：**
```typescript
{
  responseMapping: {
    value: 'value',
    label: 'label'
  },
  dataPath: 'data'
}
```

### 用户接口（灵活字段映射）

**请求：** `GET /api/users`

**响应：**
```json
{
  "success": true,
  "message": "用户列表获取成功",
  "count": 2,
  "data": [
    {
      "userId": 1001,
      "fullName": "张三",
      "email": "zhang@company.com",
      "department": "技术部",
      "position": "高级工程师"
    },
    {
      "userId": 1002,
      "fullName": "李四",
      "email": "li@company.com", 
      "department": "产品部",
      "position": "产品经理"
    }
  ]
}
```

**配置：**
```typescript
{
  responseMapping: {
    value: 'userId',      // 使用userId作为选项值
    label: 'fullName',    // 使用fullName作为显示标签
    customData: {
      email: 'email',
      department: 'department',
      position: 'position'
    }
  },
  dataPath: 'data'
}
```

### 产品搜索接口（业务字段映射）

**请求：** `GET /api/products/search?name=手机`

**响应：**
```json
{
  "success": true,
  "message": "产品搜索成功",
  "count": 2,
  "data": [
    {
      "productId": "PRD001",
      "partNumber": "P001",
      "productName": "iPhone 15",
      "specification": "128GB 蓝色",
      "category": "智能手机",
      "price": 5999,
      "stock": 50
    },
    {
      "productId": "PRD002",
      "partNumber": "P002", 
      "productName": "华为Mate60",
      "specification": "256GB 黑色",
      "category": "智能手机",
      "price": 6999,
      "stock": 30
    }
  ]
}
```

**配置：**
```typescript
{
  responseMapping: {
    value: 'productId',        // 使用productId作为选项值
    label: 'productName',      // 使用productName作为显示标签
    customData: {
      partNumber: 'partNumber',
      specification: 'specification',
      category: 'category',
      price: 'price',
      stock: 'stock'
    }
  },
  dataPath: 'data'
}
```

## 错误处理

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述信息",
  "data": null
}
```

### 常见错误场景

1. **网络错误**：接口无法访问
2. **参数错误**：搜索参数格式不正确
3. **数据为空**：查询结果为空
4. **服务器错误**：内部服务异常

## 最佳实践

### 1. 灵活性设计
- **只要求 `value` 字段**：作为选项的唯一标识，可以是ID、编码、序号等任意值
- **自定义显示字段**：通过 `responseMapping.label` 映射任意字段作为显示标签
- **业务数据保留**：通过 `customData` 保存所需的业务字段，供后续使用
- **适应现有API**：无需修改现有接口结构，只需配置正确的字段映射

### 2. 数据一致性
- 确保 `value` 字段在同一接口中唯一且稳定
- 显示标签字段应该用户友好且易理解
- 保持同一项目内响应格式的一致性

### 3. 性能优化
- 静态选项接口应支持缓存
- 搜索接口应实现防抖机制
- 大数据量时考虑分页
- 合理设置接口超时时间

### 4. 用户体验
- 提供有意义的错误信息
- 支持空状态提示
- 考虑加载状态显示

### 4. 安全性
- 验证输入参数
- 防止SQL注入
- 限制查询频率

## 配置检查清单

在添加新的下拉框接口时，请确认：

- [ ] 响应格式符合标准规范
- [ ] `dataPath` 配置正确
- [ ] `responseMapping` 字段映射准确
- [ ] `isSearchable` 标志设置正确
- [ ] 错误处理机制完善
- [ ] 接口性能满足要求

## 版本历史

- v1.0.0 - 初始版本，定义基础规范
- v1.1.0 - 添加搜索型接口规范
- v1.2.0 - 完善错误处理和最佳实践