import { defineStore } from 'pinia'
import { getRealTempData, getWarningData, tempDeviceList, getWarningDescCount } from '@/api/api.js'

export const useTempHumidityStore = defineStore('tempHumidity', {
  state: () => ({
    // 设备列表
    deviceList: [],
    // 当前显示的设备索引
    currentIndex: 0,
    // 当前设备实时数据
    currentDeviceData: {
      base_name: '加载中...',
      temperature: '--℃',
      humidity: '--%'
    },
    // 所有设备的预警数据
    allAlarmData: [],
    // 表格列配置
    columns: [
      { title: '所属基地', key: 'deviceName' },
      { title: '设备类型', key: 'deviceType' },
      { title: '报警类型', key: 'alarmType' },
      { title: '报警等级', key: 'alarmLevel' },
      { title: '报警值', key: 'alarmValue' },
      { title: '时间', key: 'alarmTime' },
      { title: '短信', key: 'smsStatus' },
    ],
    // 定时器ID
    intervalId: null,
    // 自动切换间隔（毫秒）
    switchInterval: 10000, // 10秒
    // 过滤参数
    filterParams: {
      dateRange: '',
      base: null
    },
    // 图表数据
    chartData: {
      temHigh: 0,
      temLow: 0,
      humHigh: 0,
      humLow: 0
    },
    // 监控总数
    monitorTotal: 0,
    // 设备总数
    deviceTotal: 0
  }),

  getters: {
    // 是否有设备数据
    hasDevices: (state) => state.deviceList.length > 0,

    // 是否有报警数据
    hasAlarmData: (state) => state.allAlarmData.length > 0
  },

  actions: {
    // 获取设备列表
    async fetchDeviceList() {
      try {
        const list = await tempDeviceList()
        this.deviceList = list || []
        
        if (this.deviceList.length > 0) {
          // 重置当前索引
          this.currentIndex = 0
          // 立即更新第一个设备的实时数据
          await this.updateCurrentDeviceData()
          // 获取所有设备的预警数据
          await this.fetchAllAlarmData()
          // 更新设备总数
          this.updateDeviceTotal()
          // 获取图表数据
          await this.fetchChartData()
        } else {
          this.currentDeviceData.base_name = '暂无基地数据'
          this.currentDeviceData.temperature = '--℃'
          this.currentDeviceData.humidity = '--%'
          this.allAlarmData = []
          this.deviceTotal = 0
        }
        
        return this.deviceList
      } catch (error) {
        this.currentDeviceData.base_name = '加载失败'
        console.error('获取设备列表失败:', error)
        throw error
      }
    },

    // 更新当前设备实时数据
    async updateCurrentDeviceData() {
      if (this.deviceList.length === 0) return

      const currentDevice = this.deviceList[this.currentIndex]
      const { device_address, base_name } = currentDevice

      this.currentDeviceData.base_name = base_name || '未知基地'

      try {
        // 只获取温湿度数据
        const temp_data = await getRealTempData(device_address)
        if (temp_data && temp_data['温度1'] && temp_data['湿度1']) {
          this.currentDeviceData.temperature = `${temp_data['温度1'].data}${temp_data['温度1'].unit || '℃'}`
          this.currentDeviceData.humidity = `${temp_data['湿度1'].data}${temp_data['湿度1'].unit || '%'}`
        } else {
          this.currentDeviceData.temperature = '--℃'
          this.currentDeviceData.humidity = '--%'
        }
        
      } catch (error) {
        this.currentDeviceData.temperature = '--℃'
        this.currentDeviceData.humidity = '--%'
        console.error('更新设备实时数据失败:', error)
      }

      // 切换到下一个设备（循环）
      this.currentIndex = (this.currentIndex + 1) % this.deviceList.length
    },

    // 获取所有设备的预警数据
    async fetchAllAlarmData() {
      if (this.deviceList.length === 0) {
        this.allAlarmData = []
        return
      }

      try {
        // 使用过滤参数调用 getWarningData
        const alarmData = await getWarningData(this.filterParams)
        this.allAlarmData = Array.isArray(alarmData) ? alarmData : []
      } catch (error) {
        console.error('获取所有设备预警数据失败:', error)
        this.allAlarmData = []
      }
    },

    // 更新过滤参数
    updateFilterParams(params) {
      this.filterParams = { ...this.filterParams, ...params }
      // 当过滤参数改变时，重新获取预警数据和图表数据
      this.fetchAllAlarmData()
      this.fetchChartData()
    },

    // 获取图表数据
    async fetchChartData() {
      try {
        const data = await getWarningDescCount(this.filterParams)
        this.chartData = {
          temHigh: data.temHigh || 0,
          temLow: data.temLow || 0,
          humHigh: data.humHigh || 0,
          humLow: data.humLow || 0
        }
      } catch (error) {
        console.error('获取图表数据失败:', error)
        this.chartData = {
          temHigh: 0,
          temLow: 0,
          humHigh: 0,
          humLow: 0
        }
      }
    },

    // 获取监控总数
    async fetchMonitorTotal() {
      try {
        // 这里需要根据实际的监控数据API来获取
        // 暂时使用设备数量作为监控总数
        this.monitorTotal = this.deviceList.length
      } catch (error) {
        console.error('获取监控总数失败:', error)
        this.monitorTotal = 0
      }
    },

    // 更新设备总数
    updateDeviceTotal() {
      this.deviceTotal = this.deviceList.length
    },

    // 开始自动切换
    startAutoSwitch() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
      
      if (this.deviceList.length > 1) {
        this.intervalId = setInterval(() => {
          this.updateCurrentDeviceData()
        }, this.switchInterval)
      }
    },

    // 停止自动切换
    stopAutoSwitch() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    },

    // 初始化（组件挂载时调用）
    async init() {
      try {
        await this.fetchDeviceList()
        if (this.deviceList.length > 1) {
          this.startAutoSwitch()
        }
      } catch (error) {
        console.error('初始化温湿度数据失败:', error)
      }
    },

    // 销毁（组件卸载时调用）
    destroy() {
      this.stopAutoSwitch()
    },

    // 重置数据
    reset() {
      this.deviceList = []
      this.currentIndex = 0
      this.currentDeviceData = {
        base_name: '加载中...',
        temperature: '--℃',
        humidity: '--%'
      }
      this.allAlarmData = []
      this.filterParams = {
        dateRange: '',
        base: null
      }
      this.chartData = {
        temHigh: 0,
        temLow: 0,
        humHigh: 0,
        humLow: 0
      }
      this.monitorTotal = 0
      this.deviceTotal = 0
      this.stopAutoSwitch()
    }
  }
})
