// 动态表单配置示例数据

import type { FormConfig } from '../types/form-config'

// 示例1: 产品管理表单（包含下拉框联动）
export const productFormConfig: FormConfig = {
  fields: [
    {
      fieldName: 'productId',
      fieldType: 'select',
      fieldLabel: '产品',
      visible: true,
      editable: true,
      required: true,
      dataSource: {
        type: 'static',
        options: [
          { 
            value: 1, 
            label: '笔记本电脑', 
            drawcode: 'NB-001', 
            productName: '联想ThinkPad X1',
            price: 8999.00
          },
          { 
            value: 2, 
            label: '台式机', 
            drawcode: 'DT-002', 
            productName: '戴尔OptiPlex 7090',
            price: 5999.00
          },
          { 
            value: 3, 
            label: '显示器', 
            drawcode: 'MN-003', 
            productName: '三星27寸4K显示器',
            price: 2999.00
          }
        ],
        valueField: 'value',
        labelField: 'label'
      },
      events: [
        {
          type: 'change',
          actions: [
            {
              type: 'setValue',
              targetField: 'drawcode',
              sourceExpression: 'selectedOption.drawcode'
            },
            {
              type: 'setValue',
              targetField: 'productName',
              sourceExpression: 'selectedOption.productName'
            },
            {
              type: 'setValue',
              targetField: 'price',
              sourceExpression: 'selectedOption.price'
            }
          ]
        }
      ],
      componentConfig: {
        placeholder: '请选择产品',
        clearable: true,
        filterable: true
      }
    },
    {
      fieldName: 'drawcode',
      fieldType: 'string',
      fieldLabel: '产品图号',
      visible: true,
      editable: false,
      required: false,
      componentConfig: {
        placeholder: '将根据产品选择自动填充'
      }
    },
    {
      fieldName: 'productName',
      fieldType: 'string',
      fieldLabel: '产品名称',
      visible: true,
      editable: false,
      required: false,
      componentConfig: {
        placeholder: '将根据产品选择自动填充'
      }
    },
    {
      fieldName: 'price',
      fieldType: 'float',
      fieldLabel: '产品价格',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        min: 0,
        precision: 2,
        placeholder: '请输入价格'
      }
    },
    {
      fieldName: 'quantity',
      fieldType: 'integer',
      fieldLabel: '数量',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        min: 1,
        placeholder: '请输入数量'
      }
    },
    {
      fieldName: 'purchaseDate',
      fieldType: 'date',
      fieldLabel: '采购日期',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择采购日期'
      }
    },
    {
      fieldName: 'category',
      fieldType: 'radio',
      fieldLabel: '产品类别',
      visible: true,
      editable: true,
      required: true,
      dataSource: {
        type: 'static',
        options: [
          { value: 'hardware', label: '硬件设备' },
          { value: 'software', label: '软件产品' },
          { value: 'service', label: '服务类' }
        ],
        valueField: 'value',
        labelField: 'label'
      }
    },
    {
      fieldName: 'features',
      fieldType: 'checkbox',
      fieldLabel: '产品特性',
      visible: true,
      editable: true,
      required: false,
      dataSource: {
        type: 'static',
        options: [
          { value: 'warranty', label: '质保服务' },
          { value: 'support', label: '技术支持' },
          { value: 'training', label: '培训服务' },
          { value: 'maintenance', label: '维护服务' }
        ],
        valueField: 'value',
        labelField: 'label'
      }
    },
    {
      fieldName: 'description',
      fieldType: 'textarea',
      fieldLabel: '产品描述',
      visible: true,
      editable: true,
      required: false,
      componentConfig: {
        rows: 4,
        placeholder: '请输入产品详细描述'
      }
    }
  ],
  layout: {
    gutter: 20,
    labelWidth: '120px',
    labelPosition: 'right',
    size: 'default'
  }
}

// 示例2: 用户信息表单
export const userFormConfig: FormConfig = {
  fields: [
    {
      fieldName: 'name',
      fieldType: 'string',
      fieldLabel: '姓名',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        placeholder: '请输入姓名'
      },
      layout: {
        span: 12
      }
    },
    {
      fieldName: 'email',
      fieldType: 'string',
      fieldLabel: '邮箱',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        placeholder: '请输入邮箱地址'
      },
      validation: {
        rules: [
          {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            message: '请输入有效的邮箱地址',
            trigger: 'blur'
          }
        ]
      },
      layout: {
        span: 12
      }
    },
    {
      fieldName: 'age',
      fieldType: 'integer',
      fieldLabel: '年龄',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        min: 1,
        max: 120,
        placeholder: '请输入年龄'
      },
      layout: {
        span: 8
      }
    },
    {
      fieldName: 'gender',
      fieldType: 'select',
      fieldLabel: '性别',
      visible: true,
      editable: true,
      required: true,
      dataSource: {
        type: 'static',
        options: [
          { value: 'male', label: '男' },
          { value: 'female', label: '女' },
          { value: 'other', label: '其他' }
        ],
        valueField: 'value',
        labelField: 'label'
      },
      componentConfig: {
        placeholder: '请选择性别'
      },
      layout: {
        span: 8
      }
    },
    {
      fieldName: 'birthday',
      fieldType: 'date',
      fieldLabel: '生日',
      visible: true,
      editable: true,
      required: false,
      componentConfig: {
        format: 'YYYY-MM-DD',
        placeholder: '请选择生日'
      },
      layout: {
        span: 8
      }
    },
    {
      fieldName: 'address',
      fieldType: 'textarea',
      fieldLabel: '地址',
      visible: true,
      editable: true,
      required: false,
      componentConfig: {
        rows: 3,
        placeholder: '请输入详细地址'
      },
      layout: {
        span: 24
      }
    }
  ],
  layout: {
    gutter: 16,
    labelWidth: '80px',
    labelPosition: 'right',
    size: 'default'
  }
}

// 示例3: 订单表单（复杂联动示例）
export const orderFormConfig: FormConfig = {
  fields: [
    {
      fieldName: 'customerId',
      fieldType: 'select',
      fieldLabel: '客户',
      visible: true,
      editable: true,
      required: true,
      dataSource: {
        type: 'static',
        options: [
          { 
            value: 1, 
            label: '阿里巴巴集团',
            contactPerson: '张三',
            phone: '13800138000',
            address: '杭州市西湖区'
          },
          { 
            value: 2, 
            label: '腾讯科技',
            contactPerson: '李四',
            phone: '13900139000',
            address: '深圳市南山区'
          }
        ],
        valueField: 'value',
        labelField: 'label'
      },
      events: [
        {
          type: 'change',
          actions: [
            {
              type: 'setValue',
              targetField: 'contactPerson',
              sourceExpression: 'selectedOption.contactPerson'
            },
            {
              type: 'setValue',
              targetField: 'contactPhone',
              sourceExpression: 'selectedOption.phone'
            },
            {
              type: 'setValue',
              targetField: 'deliveryAddress',
              sourceExpression: 'selectedOption.address'
            }
          ]
        }
      ],
      componentConfig: {
        placeholder: '请选择客户',
        filterable: true
      }
    },
    {
      fieldName: 'contactPerson',
      fieldType: 'string',
      fieldLabel: '联系人',
      visible: true,
      editable: false,
      required: false
    },
    {
      fieldName: 'contactPhone',
      fieldType: 'string',
      fieldLabel: '联系电话',
      visible: true,
      editable: false,
      required: false
    },
    {
      fieldName: 'orderDate',
      fieldType: 'date',
      fieldLabel: '订单日期',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        format: 'YYYY-MM-DD'
      }
    },
    {
      fieldName: 'deliveryAddress',
      fieldType: 'textarea',
      fieldLabel: '送货地址',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        rows: 2
      }
    },
    {
      fieldName: 'orderAmount',
      fieldType: 'float',
      fieldLabel: '订单金额',
      visible: true,
      editable: true,
      required: true,
      componentConfig: {
        min: 0,
        precision: 2
      }
    }
  ],
  layout: {
    gutter: 20,
    labelWidth: '100px',
    labelPosition: 'right'
  }
}

// 导出所有示例配置
export const formExamples = {
  product: productFormConfig,
  user: userFormConfig,
  order: orderFormConfig
}