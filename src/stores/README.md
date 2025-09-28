# Pinia Store 使用说明

## 基本信息 Store (basicInfo)

### 功能特性
- 数据缓存：自动缓存数据，避免重复请求
- 缓存过期：默认 5 分钟缓存过期时间
- 状态管理：包含加载状态、错误状态等
- 响应式数据：使用 Vue 3 的响应式系统

### 使用方法

#### 1. 在组件中使用
```vue
<script setup>
import { computed, onMounted } from 'vue'
import { useBasicInfoStore } from '@/stores/basicInfo.js'

const basicInfoStore = useBasicInfoStore()

// 获取数据（响应式）
const basicInfos = computed(() => basicInfoStore.getBasicInfos)
const loading = computed(() => basicInfoStore.loading)
const error = computed(() => basicInfoStore.error)

onMounted(async () => {
  // 获取数据，会自动处理缓存
  await basicInfoStore.fetchBasicInfos()
})
</script>
```

#### 2. 手动清除缓存
```javascript
// 清除缓存数据
basicInfoStore.clearCache()

// 手动设置数据
basicInfoStore.setBasicInfos(newData)
```

#### 3. 获取特定基地信息
```javascript
// 根据名称获取特定基地信息
const specificInfo = basicInfoStore.getBasicInfoByName('基地名称')
```

### Store 状态
- `basicInfos`: 基本信息数组
- `loading`: 加载状态
- `error`: 错误信息
- `lastFetchTime`: 最后获取时间
- `cacheExpiry`: 缓存过期时间（5分钟）

### 缓存机制
1. 首次访问时，从 API 获取数据并缓存
2. 再次访问时，检查缓存是否过期
3. 如果缓存有效，直接使用缓存数据
4. 如果缓存过期，重新获取数据并更新缓存

### 注意事项
- 缓存时间可以通过修改 `cacheExpiry` 来调整
- 组件卸载时可以选择是否清除缓存
- 错误重试功能已内置，用户可点击重试按钮
