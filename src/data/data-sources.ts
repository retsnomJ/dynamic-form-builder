// 预定义的数据源配置
export interface DataSourceOption {
  id: string;
  name: string;
  description: string;
  url: string;
  method?: string;
  params: Record<string, any>;  // 每个接口必须有参数配置
  responseMapping: {
    value: string;
    label: string;
    customData: Record<string, string>;  // 每个接口必须有customData配置
  };
  dataPath?: string;
  isSearchable?: boolean;
  fields: Array<{
    key: string;
    label: string;
    type: string;
  }>;
}

// 预定义的数据源列表
export const predefinedDataSources: DataSourceOption[] = [
  {
    id: 'products-search',
    name: '产品搜索接口',
    description: '根据名称搜索产品信息',
    url: 'http://localhost:3005/api/products/search',
    method: 'GET',
    params: {
      name: '{searchKeyword}'
    },
    responseMapping: {
      value: 'partNumber',
      label: 'name',
      customData: {
        name: 'name',
        partNumber: 'partNumber',
        spec: 'spec'
      }
    },
    dataPath: 'data',
    isSearchable: true,
    fields: [
      { key: 'name', label: '产品名称', type: 'string' },
      { key: 'partNumber', label: '零件号', type: 'string' },
      { key: 'spec', label: '规格', type: 'string' }
    ]
  },
  {
    id: 'customer-types',
    name: '客户类型选项接口',
    description: '获取客户类型选项列表',
    url: 'http://localhost:3005/api/options/customer-types',
    method: 'GET',
    params: {
      name: '{searchKeyword}'
    },
    responseMapping: {
      value: 'value',
      label: 'label',
      customData: {
        value: 'value',
        label: 'label'
      }
    },
    dataPath: 'data',
    isSearchable: true,
    fields: [
      { key: 'value', label: '客户类型', type: 'string' },
      { key: 'label', label: '类型值', type: 'string' }
    ]
  }
];

// 获取数据源选项（用于下拉框）
export const getDataSourceOptions = () => {
  return predefinedDataSources.map(ds => ({
    value: ds.id,
    label: ds.name
  }));
};

// 根据ID获取数据源详情
export const getDataSourceById = (id: string): DataSourceOption | undefined => {
  return predefinedDataSources.find(ds => ds.id === id);
};