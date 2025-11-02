// 动态表单配置类型定义

// 数据源配置
export interface DataSource {
  type: 'api' | 'static' | 'computed';
  
  // API数据源
  url?: string;
  method?: 'GET' | 'POST';
  params?: Record<string, any>;
  headers?: Record<string, string>;
  dataPath?: string; // 响应数据路径
  responseMapping?: {
    value: string;
    label: string;
    customData?: Record<string, string>;
  };
  
  // 静态数据源
  options?: Array<{value: any, label: string, [key: string]: any}>;
  
  // 计算数据源
  expression?: string;
  
  // 通用配置
  valueField?: string;
  labelField?: string;
  cache?: boolean;
  cacheTime?: number;
}

// 事件动作配置
export interface EventAction {
  type: 'setValue' | 'callApi' | 'validate' | 'show' | 'hide' | 'enable' | 'disable';
  targetField?: string;
  sourceExpression?: string;
  value?: any;
  condition?: string; // 执行条件表达式
  apiConfig?: {
    url: string;
    method: string;
    params?: Record<string, any>;
  };
}

// 字段事件配置
export interface FieldEvent {
  type: 'change' | 'focus' | 'blur' | 'input';
  condition?: string; // 触发条件表达式
  actions: EventAction[];
  description?: string; // 事件描述，用于可视化展示和管理
}

// 意图分析结果接口 - 增强版本，支持分离的事件、校验和配置分析
export interface IntentAnalysis {
  eventType: string
  condition?: string
  action: string
  targetField: string
  sourceField?: string
}

// 增强的意图分析结果接口
export interface EnhancedIntentAnalysis {
  // 事件相关分析
  eventAnalysis?: {
    eventType: string;
    condition?: string;
    action: string;
    targetField: string;
    sourceField?: string;
    description: string;
    recommendedTargetField?: string; // AI推荐的目标字段
  };
  
  // 校验规则分析
  validationAnalysis?: {
    hasValidation: boolean;
    rules: Array<{
      type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
      value?: any;
      message?: string;
      trigger?: 'blur' | 'change';
    }>;
    description: string;
    recommendedTargetField?: string; // AI推荐的目标字段
  };
  
  // 组件配置分析
  componentConfigAnalysis?: {
    hasConfig: boolean;
    config: Record<string, any>;
    description: string;
    recommendedTargetField?: string; // AI推荐的目标字段
  };
}

// 字段配置
export interface FieldConfig {
  // 基础字段信息
  fieldName: string;
  fieldType: 'string' | 'integer' | 'float' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea';
  fieldLabel: string;
  
  // 控制属性
  visible?: boolean;
  editable?: boolean;
  required?: boolean;
  disabled?: boolean;
  
  // 数据源配置（用于select、radio、checkbox等）
  dataSource?: DataSource;
  
  // 事件配置
  events?: FieldEvent[];
  
  // 组件特定配置
  componentConfig?: {
    placeholder?: string;
    clearable?: boolean;
    filterable?: boolean;
    multiple?: boolean;
    min?: number;
    max?: number;
    precision?: number;
    format?: string;
    [key: string]: any;
  };
  
  // 验证规则
  validation?: {
    rules?: Array<{
      required?: boolean;
      message?: string;
      trigger?: string;
      min?: number;
      max?: number;
      pattern?: string;
      validator?: string; // 自定义验证函数名
    }>;
  };
  
  // 布局配置
  layout?: {
    span?: number;
    offset?: number;
    order?: number;
  };
}

// 表单配置
export interface FormConfig {
  fields: FieldConfig[];
  layout?: {
    gutter?: number;
    labelWidth?: string | number;
    labelPosition?: 'left' | 'right' | 'top';
    size?: 'large' | 'default' | 'small';
  };
  validation?: {
    validateOnRuleChange?: boolean;
    hideRequiredAsterisk?: boolean;
  };
}

// 表单数据类型
export type FormData = Record<string, any>;

// 选项数据类型
export interface OptionItem {
  value: any;
  label: string;
  disabled?: boolean;
  [key: string]: any; // 允许额外的属性用于联动
}