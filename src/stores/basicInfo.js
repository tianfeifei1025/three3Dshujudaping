import {defineStore} from 'pinia'
import {basicInfoList} from '@/api/api.js'

export const useBasicInfoStore = defineStore('basicInfo', {
    state: () => ({
        basicInfos: [],
        loading: false,
        error: null,
        lastFetchTime: null,
        cacheExpiry: 5 * 60 * 1000
    }),

    getters: {
        isDataValid: (state) => {
            if (!state.lastFetchTime || state.basicInfos.length === 0) {
                return false
            }
            return Date.now() - state.lastFetchTime < state.cacheExpiry
        },
        //获取基本信息列表
        getBasicInfos: (state) => state.basicInfos,
        //获取每个乡镇得庭院数量，户均金额
        getBasicInfoByTown(state) {
            if (!Array.isArray(state.basicInfos) || state.basicInfos.length === 0) {
                return []
            }

            // 筛选出庭院类型的数据
            const courtyardData = state.basicInfos.filter(item => item.type === "庭院")
            
            // 按乡镇分组
            const groupedByTown = courtyardData.reduce((acc, item) => {
                const townshipId = item?.township?.[0]?.id
                const townshipName = item?.township?.[0]?.name
                
                if (!townshipId || !townshipName) {
                    return acc
                }

                if (!acc[townshipId]) {
                    acc[townshipId] = {
                        townshipId,
                        townshipName,
                        courtyards: [],
                        totalCount: 0,
                        totalOutputValue: 0,
                        averageOutputValue: 0
                    }
                }

                acc[townshipId].courtyards.push(item)
                acc[townshipId].totalCount += 1
                
                // 计算产值
                const outputValue = parseFloat(item?.economic?.output_value) || 0
                acc[townshipId].totalOutputValue += outputValue
                
                return acc
            }, {})

            // 计算户均金额并转换为数组
            const result = Object.values(groupedByTown).map(town => ({
                ...town,
                averageOutputValue: town.totalCount > 0 ? (town.totalOutputValue / town.totalCount).toFixed(2) : 0
            }))

            console.log('getBasicInfoByTown result:', result)
            return result
        },

    },
    actions: {
        async fetchBasicInfos() {
            if (this.isDataValid) {
                // console.log('使用缓存的基本信息数据')
                return this.basicInfos
            }
            try {
                this.loading = true
                this.error = null

                // console.log('开始获取基本信息数据...')
                const res = await basicInfoList()

                this.basicInfos = res
                this.lastFetchTime = Date.now()
                this.loading = false;
                return res
            } catch (error) {
                this.error = error.message || '获取基本信息失败'
                this.loading = false
                console.error('获取基本信息失败:', error)
                throw error
            }
        },

        clearCache() {
            this.basicInfos = []
            this.lastFetchTime = null
            this.error = null
        },
        // 手动设置数据（用于测试或其他用途）
        setBasicInfos(data) {
            this.basicInfos = data
            this.lastFetchTime = Date.now()
        }
    }
})
