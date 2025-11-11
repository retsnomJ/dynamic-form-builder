// 字典服务 - 用于获取字典类型和字典数据

export interface DictType {
  name: string
  type: string
  labels: string
}

export interface DictData {
  label: string
  value: string
}

export interface DictTypeResponse {
  code: number
  data: DictType[]
}

export interface DictDataResponse {
  code: number
  data: DictData[]
}

// 获取字典类型列表
export async function fetchDictTypes(keyword: string = 'i'): Promise<DictType[]> {
  try {
    const response = await fetch(`http://localhost:48125/admin-api/basedata/basequery/common/listDictTypeInfo?keyword=${keyword}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'tenant-id': '1'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: DictTypeResponse = await response.json()
    
    if (result.code !== 0) {
      throw new Error(`API error! code: ${result.code}`)
    }

    return result.data || []
  } catch (error) {
    console.error('获取字典类型失败:', error)
    throw error
  }
}

// 获取字典数据
export async function fetchDictData(keyword: string): Promise<DictData[]> {
  try {
    const response = await fetch(`http://localhost:48125/admin-api/basedata/basequery/common/listDictData?keyword=${keyword}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'tenant-id': '1'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: DictDataResponse = await response.json()
    
    if (result.code !== 0) {
      throw new Error(`API error! code: ${result.code}`)
    }

    return result.data || []
  } catch (error) {
    console.error('获取字典数据失败:', error)
    throw error
  }
}

// 生成字典API调用代码
export function generateDictApiCode(dictType: string): string {
  return `// 获取${dictType}字典数据
async function fetch${dictType.charAt(0).toUpperCase() + dictType.slice(1)}DictData() {
  try {
    const response = await fetch('http://localhost:48125/admin-api/basedata/basequery/common/listDictData?keyword=${dictType}', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'tenant-id': '1'
      }
    })

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }

    const result = await response.json()
    
    if (result.code !== 0) {
      throw new Error(\`API error! code: \${result.code}\`)
    }

    // 返回格式化的字典数据
    return result.data.map(item => ({
      label: item.label,
      value: item.value
    })) || []
  } catch (error) {
    console.error('获取字典数据失败:', error)
    // 返回默认数据或空数组
    return []
  }
}`
}

// 生成字典数据源配置
export function generateDictDataSource(dictType: string, dictName: string) {
  return {
    type: 'api' as const,
    id: `dict-${dictType}`,
    name: `${dictName}字典`,
    description: `获取${dictName}的字典数据`,
    url: 'http://localhost:48125/admin-api/basedata/basequery/common/listDictData',
    method: 'GET' as const,
    headers: {
      'Accept': 'application/json',
      'tenant-id': '1'
    },
    params: {
      keyword: dictType
    },
    responseMapping: {
      value: 'value',
      label: 'label',
      customData: {
        label: 'label',
        value: 'value'
      }
    },
    dataPath: 'data',
    isSearchable: false,
    fields: [
      { key: 'label', label: '标签', type: 'string' },
      { key: 'value', label: '值', type: 'string' }
    ]
  }
}