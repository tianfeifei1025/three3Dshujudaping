import {defineStore} from 'pinia'
import {getMonitorData, getMonitorPlayUrl} from '@/api/api.js'

export const useMonitorStore = defineStore('monitor', {
    state: () => ({
        allChannelList: [],
        offlineChannelList: [],
        onlineChannelList: [],
        data: [],
        filteredData: [],
        // 播放相关
        playUrl: '',
        currentMonitor: null,

        // 搜索相关
        searchKeyword: '',
        // 筛选相关
        filterType: 'all', // all, online, offline
        // 状态管理
        loading: false,
        error: null,
        lastFetchTime: null,
        cacheExpiry: 5 * 60 * 1000,
    }),

    getters: {
        isDataValid: (state) => {
            if (!state.lastFetchTime || state.data.length === 0) {
                return false
            }
            return Date.now() - state.lastFetchTime < state.cacheExpiry
        },

        // 计算统计数据 - 始终显示全部数据的统计，不受筛选影响
        monitorStats: (state) => {
            // 使用全部数据计算统计，不受筛选类型影响
            const total = state.data.length
            const online = state.data.filter(item => item.onLine === true).length
            const offline = state.data.filter(item => item.onLine === false).length
            return {
                total,
                online,
                offline
            }
        },

        // 获取当前显示的数据
        currentData: (state) => {
            let baseData = state.data

            // 先根据筛选类型过滤
            if (state.filterType === 'online') {
                baseData = state.data.filter(item => item.onLine === true)
            } else if (state.filterType === 'offline') {
                baseData = state.data.filter(item => item.onLine === false)
            }

            // 再根据搜索关键词过滤
            if (state.filteredData.length > 0) {
                return state.filteredData
            }

            return baseData
        },

        // 获取在线监控数量
        onlineCount: (state) => {
            return state.data.filter(item => item.onLine === true).length
        },

        // 获取离线监控数量
        offlineCount: (state) => {
            return state.data.filter(item => item.onLine === false).length
        }
    },

     actions: {
         // 公共方法：展开监控数据为通道列表
         expandMonitorDataToChannels(monitorData) {
             if (!monitorData || !Array.isArray(monitorData)) {
                 return {
                     allChannels: [],
                     onlineChannels: [],
                     offlineChannels: []
                 }
             }

             let allChannels = []
             let onlineChannels = []
             let offlineChannels = []

             monitorData.forEach(device => {
                 // 处理在线通道
                 if (device.onlineChannelList && Array.isArray(device.onlineChannelList)) {
                     const onlineChannelsWithDevice = device.onlineChannelList.map(channel => ({
                         ...channel,
                         deviceId: device.id,
                         deviceName: device.name,
                         deviceType: device.type,
                         onLine: true
                     }))
                     onlineChannels.push(...onlineChannelsWithDevice)
                 }

                 // 处理离线通道
                 if (device.offlineChannelList && Array.isArray(device.offlineChannelList)) {
                     const offlineChannelsWithDevice = device.offlineChannelList.map(channel => ({
                         ...channel,
                         deviceId: device.id,
                         deviceName: device.name,
                         deviceType: device.type,
                         onLine: false
                     }))
                     offlineChannels.push(...offlineChannelsWithDevice)
                 }
             })
             // 合并所有通道
             allChannels = [...onlineChannels, ...offlineChannels]
             return {
                 allChannels,
                 onlineChannels,
                 offlineChannels
             }
         },

         // 获取监控数据
         async fetchMonitorData() {
             if (this.isDataValid) {
                 return this.data
             }

             try {
                 this.loading = true
                 this.error = null
                 const monitorData = await getMonitorData()

                 // 使用公共方法展开通道数据
                 const { allChannels, onlineChannels, offlineChannels } = this.expandMonitorDataToChannels(monitorData)

                 this.allChannelList = allChannels
                 this.offlineChannelList = offlineChannels
                 this.onlineChannelList = onlineChannels
                 this.data = allChannels
                 this.filteredData = []
                 this.lastFetchTime = Date.now()
                 this.loading = false
                 return this.data
             } catch (error) {
                 this.error = error.message || '获取监控数据失败'
                 this.loading = false
                 console.error('获取监控数据失败:', error)
                 throw error
             }
         },
        // 获取视频播放URL
        async getVideoUrl(monitorItem) {
            try {
                const corpId = "ff80808198b72e5e0198c64987477a2d"
                const {deviceId, channelId, hasAudio} = monitorItem
                const result = await getMonitorPlayUrl(corpId, deviceId, channelId)

                if (!result || result.code !== 200) {
                    return 'https://source.alink.link:48888/error.html?msg=' + result.msg
                }

                let token = localStorage.getItem('ys-zq-token')
                let expireTime = localStorage.getItem('ys-zq-token-expireTime') * 1000
                const currentTime = new Date().getTime()

                if (!token || !expireTime || currentTime > expireTime) {
                    token = await this.fetchToken()
                }

                let showIntercom = false
                if (hasAudio) {
                    showIntercom = true
                }

                const params = {
                    "showIntercom": showIntercom,
                    "deptId": "ff80808198b72e5e0198c64987477a2d",
                    "deviceId": deviceId,
                    "channelId": channelId,
                    "showBtn": true,
                    "showPtzControl": true,
                    "ptzApiUrl": `https://192.168.84.4:3000`,
                    "account": "admin",
                    "password": encodeURI("Qaz158!%*".trim()),
                    "serverUrl": `https://saas-zq-common.alink.link:47710/dhfsifd32423csy8h/api/mobile/gb`,
                    "token": token
                }

                const queryString = Object.entries(params)
                    .map(([key, value]) => `${key}=${value}`)
                    .join('&')

                return `${result.data}&${queryString}`
            } catch (error) {
                console.error('获取视频URL失败:', error)
                throw error
            }
        },

        // 查看视频
        async viewVideo(monitorItem) {
            try {
                this.currentMonitor = monitorItem
                const url = await this.getVideoUrl(monitorItem)
                this.playUrl = url
                return url
            } catch (error) {
                console.error('查看视频失败:', error)
                throw error
            }
        },

        // 搜索功能
        handleSearch() {
            const keyword = this.searchKeyword.trim()
            if (!keyword) {
                // 如果搜索关键词为空，清空搜索过滤
                this.filteredData = []
            } else {
                // 根据当前筛选类型和监控名称进行模糊搜索
                let baseData = this.data

                // 先根据筛选类型过滤
                if (this.filterType === 'online') {
                    baseData = this.data.filter(item => item.onLine === true)
                } else if (this.filterType === 'offline') {
                    baseData = this.data.filter(item => item.onLine === false)
                }

                // 再根据监控名称进行模糊搜索
                this.filteredData = baseData.filter(item =>
                    item.name && item.name.toLowerCase().includes(keyword.toLowerCase())
                )
            }
        },

        // 清空搜索
        clearSearch() {
            this.searchKeyword = ''
            this.filteredData = []
        },

        // 设置筛选类型
        setFilterType(type) {
            this.filterType = type
            // 切换筛选类型时，如果有搜索关键词，需要重新应用搜索过滤
            if (this.searchKeyword.trim()) {
                this.handleSearch()
            } else {
                // 如果没有搜索关键词，清空搜索过滤
                this.filteredData = []
            }
        },

        // 设置搜索关键词
        setSearchKeyword(keyword) {
            this.searchKeyword = keyword
            this.handleSearch()
        },

        // 获取token（这里需要根据实际情况实现）
        async fetchToken() {
            // 这里需要根据实际的token获取逻辑来实现
            // 暂时返回一个占位符
            console.warn('fetchToken方法需要根据实际需求实现')
            return 'placeholder-token'
        },

        // 清空缓存
        clearCache() {
            this.allChannelList = []
            this.offlineChannelList = []
            this.onlineChannelList = []
            this.data = []
            this.filteredData = []
            this.playUrl = ''
            this.currentMonitor = null
            this.searchKeyword = ''
            this.filterType = 'all'
            this.lastFetchTime = null
            this.error = null
            this.loading = false
        },

        // 手动设置数据（用于测试或其他用途）
        setMonitorData(data) {
            this.data = data
            this.lastFetchTime = Date.now()
        },

        // 初始化第一个监控的播放URL
        async initFirstMonitor() {
            if (this.data.length > 0) {
                const firstItem = this.data[0]
                try {
                    const url = await this.getVideoUrl(firstItem)
                    this.playUrl = url
                    this.currentMonitor = firstItem
                } catch (error) {
                    console.error('初始化第一个监控失败:', error)
                }
            }
        },

         // 根据通道列表过滤监控数据
         async fetchMonitorDataByChannelList(channelList) {

             if (!channelList || channelList.length === 0) {
                 console.warn('通道列表为空，无法过滤监控数据')
                 this.data = []
                 this.filteredData = []
                 return []
             }

             try {
                 this.loading = true
                 this.error = null
                 const allMonitorData =await getMonitorData();
                 if (!allMonitorData || !Array.isArray(allMonitorData)) {
                     this.data = []
                     this.filteredData = []
                     this.loading = false
                     return []
                 }
                 const { allChannels } = this.expandMonitorDataToChannels(allMonitorData)
                 const channelMap = new Set()
                 channelList.forEach(channel => {
                     const key = `${channel.deviceId}-${channel.channelId}`
                     channelMap.add(key)
                 })
                 // 根据通道列表过滤
                 const filteredChannels = allChannels.filter(channel => {
                     const key = `${channel.deviceId}-${channel.channelId}`
                     const hasMatch = channelMap.has(key)
                     return hasMatch
                 })
                 // 重新分类过滤后的通道
                 const filteredOnlineChannels = filteredChannels.filter(channel => channel.onLine === true)
                 const filteredOfflineChannels = filteredChannels.filter(channel => channel.onLine === false)

                 this.allChannelList = filteredChannels
                 this.offlineChannelList = filteredOfflineChannels
                 this.onlineChannelList = filteredOnlineChannels
                 this.data = filteredChannels
                 this.filteredData = []
                 this.lastFetchTime = Date.now()

                 this.loading = false
                 return filteredChannels
             } catch (error) {
                 this.error = error.message || '根据通道列表获取监控数据失败'
                 this.loading = false
                 console.error('根据通道列表获取监控数据失败:', error)
                 throw error
             }
         }
    }
})
