// 预定义的数据源配置
export interface DataSourceOption {
  id: string;
  name: string;
  description: string;
  url: string;
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
    url: 'http://localhost:3000/api/products/search',
    fields: [
      { key: 'name', label: '产品名称', type: 'string' },
      { key: 'partNumber', label: '零件号', type: 'string' },
      { key: 'spec', label: '规格', type: 'string' }
    ]
  },
  {
    id: 'users-list',
    name: '用户列表接口',
    description: '获取用户列表',
    url: 'http://localhost:3000/api/users',
    fields: [
      { key: 'id', label: '用户ID', type: 'number' },
      { key: 'name', label: '用户名', type: 'string' },
      { key: 'email', label: '邮箱', type: 'string' },
      { key: 'role', label: '角色', type: 'string' }
    ]
  },
  {
    id: 'categories-list',
    name: '分类列表接口',
    description: '获取产品分类列表',
    url: 'http://localhost:3000/api/categories',
    fields: [
      { key: 'id', label: '分类ID', type: 'number' },
      { key: 'name', label: '分类名称', type: 'string' },
      { key: 'code', label: '分类代码', type: 'string' },
      { key: 'parentId', label: '父分类ID', type: 'number' }
    ]
  },
  {
    id: 'departments-list',
    name: '部门列表接口',
    description: '获取部门列表',
    url: 'http://localhost:3000/api/departments',
    fields: [
      { key: 'id', label: '部门ID', type: 'number' },
      { key: 'name', label: '部门名称', type: 'string' },
      { key: 'code', label: '部门代码', type: 'string' },
      { key: 'manager', label: '部门经理', type: 'string' }
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