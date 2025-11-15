<template>
  <div id="app">
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">动态表单系统</h1>
          <el-menu
            :default-active="activeMenu"
            class="header-menu"
            mode="horizontal"
            @select="handleMenuSelect"
          >
            <el-menu-item index="generator">JSON生成器</el-menu-item>
            <el-menu-item index="simulator">接口模拟器</el-menu-item>
            <el-menu-item index="converter">JSON转换器</el-menu-item>
          </el-menu>
        </div>
      </el-header>

      <!-- 主内容区域 -->
      <el-main class="app-main">
         <JsonGenerator v-show="activeMenu === 'generator'" />
         <ApiSimulator v-show="activeMenu === 'simulator'" />
         <JsonConverter v-show="activeMenu === 'converter'" />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import JsonGenerator from './views/JsonGenerator.vue'
import ApiSimulator from './views/ApiSimulator.vue'
import JsonConverter from './views/JsonConverter.vue'

// 当前激活的菜单
const activeMenu = ref('generator')

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  activeMenu.value = key
}
</script>

<style scoped>
.app-header {
  background: #fff;
  border-bottom: 1px solid #e6e8eb;
  padding: 0;
  height: 60px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.header-menu {
  border-bottom: none;
}

.header-menu :deep(.el-menu-item) {
  border-bottom: 2px solid transparent;
}

.header-menu :deep(.el-menu-item.is-active) {
  border-bottom-color: #409eff;
  color: #409eff;
}

.app-main {
  padding: 0;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* 全局样式重置 */
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
}

.el-container {
  height: 100vh;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 10px 20px;
  }
  
  .app-title {
    margin-bottom: 10px;
    font-size: 18px;
  }
  
  .header-menu {
    width: 100%;
    justify-content: center;
  }
  
  .app-header {
    height: auto;
  }
  
  .app-main {
    min-height: calc(100vh - 100px);
  }
}
</style>