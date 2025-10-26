<!-- ERP 产品的新增/修改 -->
<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="auto"
      v-loading="formLoading"
    >
      <el-row :gutter="20">
        <el-col
          :span="12"
          v-for="{ fieldName, fieldLabel, fieldType } in customFormFields"
          :key="fieldName"
        >
          <el-form-item :label="fieldLabel" :prop="fieldName">
            <el-input
              v-if="fieldType === 'string'"
              v-model="formData[fieldName]"
              :placeholder="`请输入${fieldLabel}`"
            />

            <el-input-number
              v-else-if="fieldType === 'integer'"
              v-model="formData[fieldName]"
              :placeholder="`请输入${fieldLabel}`"
              :min="0"
              :precision="2"
              class="!w-1/1"
            />

            <el-date-picker
              v-else-if="fieldType === 'date'"
              v-model="formData[fieldName]"
              type="date"
              value-format="x"
              class="!w-1/1"
              :placeholder="`请选择${fieldLabel}`"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ProductApi, ProductVO } from '@/api/erp/product/product'

/** ERP 产品 表单 */
defineOptions({ name: 'ProductForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref({
  id: undefined
})
const formRules = reactive({})
const formRef = ref() // 表单 Ref

const customFormFields = ref<any[]>([])
async function initFormFields() {
  customFormFields.value = []
  const columns = await ProductApi.getTableColumns()
  columns['productors.main'].forEach((item: any) => {
    const { editable, required, fieldName, fieldLabel, fieldType } = item
    if (editable) {
      customFormFields.value.push({
        fieldName,
        fieldLabel,
        fieldType
      })
      formData.value[fieldName] = undefined
    }
    if (required) {
      formRules[fieldName] = [{ required: true, message: '缺少必填项', trigger: 'change' }]
    }
  })
}

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  await initFormFields()
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await ProductApi.getProduct(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as unknown as ProductVO
    if (formType.value === 'create') {
      await ProductApi.createProduct(data)
      message.success(t('common.createSuccess'))
    } else {
      await ProductApi.updateProduct(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value.id = undefined
  formRef.value?.resetFields()
}
</script>
