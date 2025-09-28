// 获取云枢接口数据
import result from "view-ui-plus/src/components/result/index.js";

let PhotoBaseUrl = "https://saas-zq.alink.link:47710/api/api/aliyun/download?refId=";

async function fetchToken() {
    try {
        const url = `https://saas-zq-mobile.alink.link:47710/mobile/api/v1/user/phone/token`;
        const data = {
            phone: '18682790358',
            corpId: 'dingbe2abe934d9fdd7c35c2f4657eb6378f'
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            throw new Error(`请求token失败: ${response.msg}`);
        }
        const result = await response.json();
        if (result.code !== 200) {
            throw new Error(`请求token失败: ${result.message}`);
        }
        const tokenMap = JSON.parse(result.data);
        const token = tokenMap.token;
        const expireTime = tokenMap.expireTime;
        if (token) {
            localStorage.setItem('ys-zq-token', token);
            localStorage.setItem('ys-zq-token-expireTime', expireTime);
        }
        return token;
    } catch (error) {
        console.error("获取token失败:", error);
    }
}


/**
 * 通用 YS 数据查询请求函数
 * @param {string} queryCode - 查询编码
 * @param {string} schemaCode - 模型编码
 * @param {number} size - 分页大小
 * @param {Object} [queryCondition] - 查询条件
 * @returns {Promise<{code: number, message: string, data: Array}>}
 */
export async function commonFetchYs(queryCode, schemaCode, size, queryCondition = {}) {
    const returnData = {
        code: 0,
        message: "",
        data: [],
        totalElements: 0
    };

    const url = "https://saas-zq.alink.link:47710/api/api/runtime/query/list"; // 修复多余空格
    let token = localStorage.getItem('ys-zq-token');
    const expireTimeStr = localStorage.getItem('ys-zq-token-expireTime');
    const expireTime = expireTimeStr ? parseInt(expireTimeStr, 10) * 1000 : 0;
    const currentTime = Date.now();
    // 判断 token 是否过期，过期则刷新
    if (!token || currentTime > expireTime) {
        try {
            token = await fetchToken(); // 假设 fetchToken 是有效异步函数
            if (!token) {
                returnData.code = 401;
                returnData.message = "无法获取有效认证令牌";
                return returnData;
            }
        } catch (err) {
            returnData.code = 401;
            returnData.message = `获取令牌失败: ${err.message || err}`;
            return returnData;
        }
    }
    const requestData = {
        filters: [],
        mobile: false,
        page: 0,
        queryCode,
        schemaCode,
        size,
        queryVersion: 1,
        queryCondition,
        showTotal: true
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            returnData.code = response.status;
            returnData.message = errorMsg;
            console.error('API 请求失败:', errorMsg);
            return returnData;
        }

        const result = await response.json();
        // 接口业务错误处理
        if (result.errcode !== 0) {
            returnData.code = result.errcode;
            returnData.message = result.errmsg || '未知错误';
            return returnData;
        }
        // 数据为空处理
        returnData.totalElements = result?.data?.totalElements;
        const content = result?.data?.content;
        if (!Array.isArray(content) || content.length === 0) {
            returnData.data = [];
            returnData.message = "暂无数据";
            return returnData;
        }
        returnData.data = content.map(item => item.data);
        return returnData;
    } catch (err) {
        const errorMsg = err.message || String(err);
        console.error('请求异常:', err);
        returnData.code = -1;
        returnData.message = `请求异常: ${errorMsg}`;
        return returnData;
    }
}

/**
 * 基地信息（以及对应的的经济产值）
 * @returns {Promise<*|*[]>}
 */
export async function basicInfoList() {
    try {
        const currentYear = new Date().getFullYear();
        const propertyValue = `${currentYear};${currentYear}`
        //获取基地信息，以及基地产值信息
        const [infoRes, ecoRes] = await Promise.all([
            commonFetchYs("bases", "bases", 1000, [[[]]]),
            commonFetchYs("base_output_values", "base_output_values", 1000, [
                [
                    [
                        {
                            "queryFilterType": "Between",
                            "propertyCode": "year",
                            "propertyType": 3,
                            "propertyValue": propertyValue
                        }
                    ]
                ]
            ])
        ]);
        if (infoRes.code !== 0 || infoRes.data.length === 0) return [];
        if (ecoRes.code !== 0 || ecoRes.data.length === 0) return infoRes.data;
        infoRes.data.forEach(item => {
            if (!item.economic) {
                item.economic = {};
            }
            if (item.type === "中心" || item.type === "基地" || item.type === "园区") {
                const ecoInfo = ecoRes.data.filter(f => f?.home_base?.[0]?.id === item?.home_base?.[0]?.id && f.official_name === item.official_name);
                if (ecoInfo.length === 1) {
                    item.economic = ecoInfo[0];
                }
            }
            if (item.type === "庭院") {
                const ecoInfo = ecoRes.data.filter(f => f?.township?.[0]?.id === item?.township?.[0]?.id && f.official_name === item.official_name);
                if (ecoInfo.length === 1) {
                    item.economic = ecoInfo[0];
                }
            }
        })
        return infoRes.data;
    } catch (err) {
        console.error("获取基地信息错误:", err);
        return [];
    }
}

/**
 * 采收标准
 * @returns {Promise<Object>} 按产品类型分类的标准对象，键为产品类型，值为该类型下的标准数组
 */
export async function harvestStandardList() {
    try {
        const standardRes = await commonFetchYs("edible_fungus_standards", "edible_fungus_standards", 300, [[[]]])
        if (standardRes?.code !== 0 || !Array.isArray(standardRes?.data)) return [];

        const standards = standardRes.data.map(item => {
            return {
                id: item.id,
                intro: item.unified_standard,
                url: PhotoBaseUrl + item?.image?.[0]?.refId || "",
                type: item.product_type,
                grade: item.product_grade,
            }
        })
        const groupedStandards = {};
        standards.forEach(standard => {
            const type = standard.type || '未分类';
            if (!groupedStandards[type]) {
                groupedStandards[type] = [];
            }
            groupedStandards[type].push(standard);
        });

        return groupedStandards;
    } catch (err) {
        console.error("获取产品标准列表错误:", err);
        return {};
    }
}

/**
 * 设施标准
 * @returns {Promise<*|*[]>}
 */
export async function facilityStandardList() {
    try {
        const response = await commonFetchYs("greenhouse_standard", "greenhouse_standard", 300, [[[]]]);
        if (response?.code !== 0 || !Array.isArray(response?.data)) {
            return [];
        }
        return response.data.map(item => ({
            id: item.id ?? '',
            name: item.ShortText1756011037570 ?? '',
            intro: item.intro ?? '',
            url: item?.image?.[0]?.refId ? `${PhotoBaseUrl}${item.image[0].refId}` : '',
        }));
    } catch (err) {
        console.error("获取设施标准列表错误:", err);
        return [];
    }
}

export async function managementStandardList() {
    try {
        const response = await commonFetchYs("edible_fungus_standards", "management_standards", 300, [[[]]]);
        if (response?.code !== 0 || !Array.isArray(response?.data)) {
            return [];
        }
        return response.data.map(item => ({
            id: item.id ?? '',
            name: item.product_type ?? '',
            intro: item.unified_standard ?? '',
            url: item?.image?.[0]?.refId ? `${PhotoBaseUrl}${item.image[0].refId}` : '',
        }));
    } catch (err) {
        console.error("获取管理标准列表错误:", err);
        return [];
    }
}

/**
 * 生产节点
 * @returns {Promise<*|*[]>}
 */
export async function produceNodeList() {
    try {
        const response = await commonFetchYs("production_node_monitor", "production_node_monitor", 300, [[[]]]);
        if (response?.code !== 0 || !Array.isArray(response?.data)) {
            return [];
        }
        return response.data.map(item => {
            return {
                id: item.id,
                base_name: item?.home_base?.[0].name || "",
                base_id: item?.home_base?.[0].id || "",
                node_type: item.node_type,
                position: item.monitor_position,
                stream_address: `https://source.alink.link:48888/video/stream-media/player.html?url=${item.stream_address}`,
                node_desc: item.node_desc,
                sort_id: item.sort,
            }
        })
    } catch (err) {
        console.error("获取生产节点列表错误:", err);
        return [];
    }

}

/**
 * 农业设备信息
 * @returns {Promise<*|*[]>}
 */
export async function tempDeviceList() {
    try {
        const response = await commonFetchYs("shebeibangding", "shebeibangding", 100, [
            [
                [
                    {
                        "queryFilterType": "Eq",
                        "propertyCode": "affiliation",
                        "propertyType": 60,
                        "propertyValue": "[{\"id\":\"ff80808198b72e5e0198c64987477a2d\",\"unitType\":1,\"name\":\"壤塘县高原食用菌\"}]"
                    }
                ]
            ]
        ])
        if (response?.code !== 0 || !Array.isArray(response?.data)) return [];
        return response.data.map(item => {
            return {
                base_name: item?.homeBase?.[0].name || "-",
                base_id: item?.homeBase?.[0].id || "",
                device_address: item?.Device_address || "-"
            }
        })
    } catch (err) {
        console.error("获取温度设备列表错误:", err)
    }

}

/**
 * 预警信息列表
 * @returns {Promise<*|*[]>}
 */

function toFixedOrDefault(value, decimals = 2, defaultValue = "-") {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num.toFixed(decimals);
}

export async function getWarningData(params) {
    try {
        const response = await commonFetchYs("Agriculture_four_alert", "rt_Agriculture_four", 300, [
            [
                [
                    {
                        "queryFilterType": "Eq",
                        "propertyCode": "homeBase",
                        "propertyType": 60,
                        "propertyValue": params.base
                    },
                    {
                        "queryFilterType": "Between",
                        "propertyCode": "Warning_time",
                        "propertyType": 3,
                        "propertyValue": params.dateRange
                    }
                ]
            ]
        ]);

        if (response?.code !== 0 || !Array.isArray(response?.data)) return [];

        return response.data.map(item => ({
            deviceName: item?.deviceName || "",
            deviceType: item?.deviceType || "",
            alarmType: item?.alarmType || "",
            alarmValue: toFixedOrDefault(item?.alarmValue),
            alarmTime: item?.Warning_time || "",
            alarmLevel: item?.alarmMessage || "",
            smsStatus: item?.openid_lysq_yj_rtsyj?.[0]?.smsStatus || "未读",
        }));
    } catch (err) {
        console.error("获取温度设备列表错误:", err);
        return [];
    }
}

/**
 * 实时温湿度
 * @returns {Promise<*|*[]>}
 */
export async function getRealTempData(deviceId) {
    const url = `https://saas-zq-common.alink.link:47710/deweqweqwdsajdsajhkdsasvice/api/agriculture/device/real-time-data/${deviceId}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) {
            console.warn(`HTTP Error: ${response.status} ${response.statusText} for device ${deviceId}`);
            return null;
        }
        const result = await response.json();
        if (result.code !== 1000) {
            console.warn(`业务错误: code=${result.code}, message=${result.message || '无描述'} for device ${deviceId}`);
            return null;
        }
        const factorDataMap = result?.data?.[0]?.factorDataMap;
        return factorDataMap || null;

    } catch (err) {
        console.error(`获取设备 ${deviceId} 实时数据失败:`, err);
        return null;
    }
}


/**
 * 专家小院
 */
export async function expertYard() {
    try {
        const res = await commonFetchYs("expertPresentation", "rtx_expertPresentation", 500, []);

        if (res?.code !== 0 || !Array.isArray(res?.data)) {
            return {experts: [], techs: []};
        }

        const result = {
            experts: [],
            techs: [],
        };
        const mapData = res.data.map(item => {
            return {
                avatar: PhotoBaseUrl + item?.expertPhoto?.[0]?.refId,
                name: item.ShortText1755768690425,
                gender: item.gender,
                professional: item.title,
                email: item.email,
                phone: item.phone,
                education: item.work_unit,
                major: item.research_fields,
                achievements: item.achievements,
                serviceNum: item.rt_service_count,
                serviceCon: item.rt_service_content,
                type: item.type
            }
        });
        for (const item of mapData) {
            if (item?.type === "专家") {
                result.experts.push(item);
            } else if (item?.type === "技术人员") {
                result.techs.push(item);
            }
        }
        return result;

    } catch (error) {
        console.error("获取专家小院的接口数据错误:", error.message || error);
        return {experts: [], techs: []};
    }
}

/**
 * 专班信息
 */

export async function specialClasses() {
    try {
        const [teamRes, memberRes] = await Promise.all([
            commonFetchYs("special_teams", "special_teams", 300, [[[]]]),
            commonFetchYs("special_team_members", "special_team_members", 300, [[[]]])
        ]);
        if (teamRes?.code !== 0 || !Array.isArray(teamRes?.data)) return [];
        const teams = teamRes.data.map(item => {
            return {
                id: item.id || null,
                name: item.team_name || "未知名称",
                type: item.team_type || "",
                worker: item.main_duties || "",
                range: item.jurisdiction || "",
                time: item.establish_date || "",
                persons: []
            };
        });
        if (memberRes?.code !== 0 || !Array.isArray(memberRes?.data)) return teams;
        const members = memberRes.data.map(item => {
            return {
                id: item.id || null,
                name: item.member_name || "-",
                time: item.join_time || "",
                position: item.position || "",
                worker: item.responsible_item || "",
                teamId: item?.team_id?.items?.[0]?.id || null,
                sort: item.sort,
                responsibilities: item.responsibilities
            };
        });
        const membersByTeamId = new Map();
        members.forEach(member => {
            if (member.teamId) {
                if (!membersByTeamId.has(member.teamId)) {
                    membersByTeamId.set(member.teamId, []);
                }
                membersByTeamId.get(member.teamId).push(member);
            }
        });
        teams.forEach(team => {
            team.persons = membersByTeamId.get(team.id) || [];
            team.persons.sort((a, b) => a.sort - b.sort);
        });
        return teams;

    } catch (err) {
        console.error("获取专班信息错误:", err);
        return [];
    }
}

/**
 * 供应链
 * @returns {Promise<*|*[]>}
 */
export async function supplyChainList() {
    try {
        const response = await commonFetchYs("supply_chain_optimizatio", "supply_chain_optimizatio", 100, [[[]]]);
        if (response?.code !== 0 || !Array.isArray(response?.data)) return [];
        return response.data.map(item => {
            return {
                system_name: item?.system_name || "",
                product_name: item?.product_name || "",
                product_intro: item?.product_intro || "",
                channel_intro: item?.channel_intro || "",
                channel_type: item?.channel_type || "",
                url: PhotoBaseUrl + item?.image?.[0]?.refId || "",
            }
        })
    } catch (err) {
        console.error("获取供应链列表错误:", err);
        return [];
    }
}

/**
 *教学视频
 * @returns {Promise<*|*[]>}
 */
export async function fetchTeachVideoList() {
    try {
        const response = await commonFetchYs("teaching_video", "teaching_video", 100, [[[]]]);
        if (response?.code !== 0 || !Array.isArray(response?.data)) return [];
        return response.data.map(item => {
            return {
                videoUrl: PhotoBaseUrl + item?.thumbnail?.[0]?.refId,
                title: item.title,
                category: item.category,
                content: item.content_desc,
                producer: item.producer
            };
        });
    } catch (error) {
        console.error("获取教学视频失败:", error);
    }
}


/**
 * 视频监控列表
 * @returns {Promise<*|*[]>}
 */
export async function getMonitorData() {
    try {
        let token = localStorage.getItem('ys-zq-token');
        let expireTime = localStorage.getItem('ys-zq-token-expireTime') * 1000;
        const currentTime = new Date().getTime();
        if (!token || !expireTime || currentTime > expireTime) {
            token = await fetchToken();
        }
        const url = 'https://saas-zq-common.alink.link:47710/dhfsifd32423csy8h/api/mobile/gb/ff80808198b72e5e0198c64987477a2d/device/list';
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            console.error(`网络请求失败: ${response.msg}`);
            return [];
        }
        const data = await response.json();
        if (data.code !== 200) return [];
        const {onlineDeviceList, offlineDeviceList} = data.data
        const allDeviceList = offlineDeviceList.concat(onlineDeviceList);
        if (!allDeviceList || !Array.isArray(allDeviceList)) return [];
        return allDeviceList;

    } catch (error) {
        throw new Error(`获取监控数据失败: ${error.message}`);

    }
}


/**
 * 获取监控播放地址
 * @param corpId
 * @param deviceId
 * @param channelId
 * @returns {Promise<unknown>}
 */
export async function getMonitorPlayUrl(corpId, deviceId, channelId) {
    const url = `https://saas-zq-common.alink.link:47710/dhfsifd32423csy8h/api/mobile/gb/play/${corpId}/${deviceId}/${channelId}`;
    return new Promise((resolve, reject) => {
        fetch(url, {
            method: 'GET',
        }).then(response => {
            return response.json();
        })
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                reject(error);
            });
    });
};

/**
 * 获取实时天气数据
 */
export async function getWeatherData() {
    try {
        const url = 'https://restapi.amap.com/v3/weather/weatherInfo?key=29cf562befe7cf841e3496e0bca58eba&city=513230&extensions=base';
        const response = await fetch(url, {
            method: 'GET',
        });

        if (!response.ok) {
            console.error("获取实时天气数据失败，响应状态码:", response.status);
            return [];
        }
        return await response.json();
    } catch (error) {
        console.error("获取实时天气数据失败:", error);
        return [];
    }
}


/**
 * 获取各类报警数量
 * @returns {Promise<{temHigh: number, temLow: number, humHigh: number, humLow: number}>}
 */
export async function getWarningDescCount(params) {
    // 定义查询配置
    const queries = [
        {key: 'temHigh', value: '温度(高)'},
        {key: 'temLow', value: '温度(低)'},
        {key: 'humHigh', value: '湿度(高)'},
        {key: 'humLow', value: '湿度(低)'}
    ];

    // 构造 Promise 数组
    const promises = queries.map(({key, value}) =>
        commonFetchYs("Agriculture_four_alert", "rt_Agriculture_four", 1, [[[
            {
                queryFilterType: "Like",
                propertyCode: "alarmMessage",
                propertyType: 0,
                propertyValue: value
            }, {
                "queryFilterType": "Eq",
                "propertyCode": "homeBase",
                "propertyType": 60,
                "propertyValue": params.base
            }, {
                "queryFilterType": "Between",
                "propertyCode": "Warning_time",
                "propertyType": 3,
                "propertyValue": params.dateRange
            }
        ]]])
            .catch(err => {
                console.error(`[Warning] Failed to fetch ${key}:`, err);
                return {code: -1, totalElements: 0}; // 失败时返回默认值
            })
    );

    // 并行执行所有请求
    const results = await Promise.all(promises);

    // 构建结果对象
    const result = {};
    queries.forEach(({key}, index) => {
        const res = results[index];
        result[key] = res.code === 0 ? res.totalElements : 0;
    });

    return result;
}


export async function getDeviceChannelIdList(id, name) {
    try {
        const response = await commonFetchYs("videoSurveillance", "videoSurveillance4", 100, [
            [
                [
                    {
                        "queryFilterType": "Eq",
                        "propertyCode": "firm",
                        "propertyType": 60,
                        "propertyValue": JSON.stringify([{
                            id: id,
                            name: name,
                            unitType: 1,
                        }])
                    }
                ]
            ]
        ]);
        if (response?.code !== 0 || !Array.isArray(response?.data)) return []
        return response.data.map(item => {
            return {
                deviceId: item.gb_id,
                channelId: item.channelId,
            }
        });
    } catch (error) {
        console.error("获取设备通道ID列表失败:", error);
        return [];
    }
}


/**
 *统计每个乡镇的庭院、户均金额、集体经济
 */
export async function statTownshipSummary() {

    try {
        // 并发请求：庭院数据 和 集体经济数据
        const [baseRes, economyRes] = await Promise.all([
            commonFetchYs("bases", "bases", 1000, [
                [
                    [
                        {
                            "queryFilterType": "Eq",
                            "propertyCode": "township",
                            "propertyType": 60,
                            "propertyValue": null
                        },
                        {
                            "queryFilterType": "Eq",
                            "propertyCode": "type",
                            "propertyType": 14,
                            "propertyValue": "庭院"
                        },
                        {
                            "queryFilterType": "Eq",
                            "propertyCode": "status",
                            "propertyType": 14,
                            "propertyValue": "已建"
                        }
                    ]
                ]
            ]),
            commonFetchYs("collective_economy", "collective_economy", 100, [[]])
        ]);

        if (baseRes?.code !== 0 || !Array.isArray(baseRes.data)) {
            console.error("庭院数据获取失败:", baseRes);
            return [];
        }

        if (economyRes?.code !== 0 || !Array.isArray(economyRes.data)) {
            console.error("集体经济数据获取失败:", economyRes);
            return [];
        }
        // 1. 初始化结果 Map：key=乡镇ID，value=汇总信息
        const result = new Map();

        // 2. 处理庭院数据：统计每个乡镇的庭院数量 & 户均金额
        baseRes.data.forEach(item => {
            const townId = item?.township?.[0]?.id;
            const townName = item?.township?.[0]?.name;
            const perHousehold = item?.per_household || 0;
            if (!townId || !townName) return;
            if (!result.has(townId)) {
                result.set(townId, {
                    townshipId: townId,
                    townshipName: townName,
                    courtyardCount: 0,     // 庭院数量
                    perHousehold: 0, // 户均金额
                    collectiveIncome: 0    // 集体经济总额
                });
            }

            // 累加庭院数量（每条记录视为一个庭院）
            result.get(townId).courtyardCount += 1;
            // 累加户均金额
            result.get(townId).perHousehold += perHousehold;
        });

        // 3. 处理集体经济数据：累加每个乡镇的集体经济总额
        economyRes.data.forEach(item => {
            const townId = item?.township?.[0]?.id;
            const amount = item?.amount || 0;

            if (!townId) return;

            if (result.has(townId)) {
                result.get(townId).collectiveIncome += amount;
            } else {
                result.set(townId, {
                    townshipId: townId,
                    townshipName: item?.township?.[0]?.name || '未知乡镇',
                    courtyardCount: 0,
                    perHousehold: 0,
                    collectiveIncome: amount
                });
            }
        });

        return Array.from(result.values());

    } catch (error) {
        console.error("统计乡镇数据失败:", error);
        return [];
    }
}

/**
 * 获取人员组织架构信息
 */
export async function getPersonOrgInfo() {
    try {
        const response = await commonFetchYs("architecture", "architecture", 100, [[]]);
        if (response?.code !== 0 || !Array.isArray(response.data)) {
            console.warn("接口返回异常或无数据:", response);
            return [];
        }

        return response.data.map(item => ({
            id: item?.id || '',
            member_name: item?.member_name || '',
            team_type: item?.team_type || '',
            position: item?.position || '',
            main_duties: item?.main_duties || '',
            position_id: item?.position_id || ''
        }));
    } catch (error) {
        console.error("获取人员组织架构信息失败:", error);
        return [];
    }
}

/**
 * 获取职位组成人员列表
 */

export async function positionPersonList(id) {
    try {
        const response = await commonFetchYs("special_team_members", "special_team_members", 100, [
            [
                [
                    {
                        "queryFilterType": "Like",
                        "propertyCode": "architecture_id",
                        "propertyType": 11,
                        "propertyValue": id
                    }
                ]
            ]
        ]);
        if (response?.code !== 0 || !Array.isArray(response.data)) return [];
        return response.data.map(item => ({
            id: item?.id || '',
            name: item?.member_name || '',
            position: item?.responsibilities || '',
        }));
    } catch (error) {
        console.error("获取职位组成人员列表失败:", error);
        return [];
    }

}

/**
 * 统计每个乡镇已建待建庭院数量
 * 结合静态经纬度数据，返回与courtyardData.js相同格式的数据
 */
export async function getCourtyardCountByTownship() {
    try {
        // 导入静态经纬度数据
        const {default: staticCourtyardData} = await import("@/views/chinaMap/map/courtyardData.js");

        const response = await commonFetchYs("bases", "bases", 1000, [
            [
                [
                    {
                        "queryFilterType": "Eq",
                        "propertyCode": "type",
                        "propertyType": 14,
                        "propertyValue": "庭院"
                    }
                ]
            ]
        ])

        if (response?.code !== 0 || !Array.isArray(response.data)) {
            console.error("获取庭院数据失败:", response);
            // 如果API失败，返回静态数据
            return [];
        }

        // 按乡镇分组统计庭院数据
        const townshipMap = new Map();

        // 先初始化所有静态数据中的乡镇，确保经纬度信息完整
        staticCourtyardData.forEach(staticItem => {
            townshipMap.set(staticItem.town, {
                id: staticItem.id || "",
                town: staticItem.town,
                name: `庭院种植户0家`,
                value: 0, // 已建数量
                centroid: staticItem.centroid,
                value1: 0, // 待建/规划数量
                centroid1: staticItem.centroid1
            });
        });

        // 处理API数据，累加数量
        response.data.forEach(item => {
            const townshipName = item?.township?.[0]?.name;
            const status = item?.status; // 已建/待建状态

            if (!townshipName) return;
            if (!townshipMap.has(townshipName)) return;
            const townshipData = townshipMap.get(townshipName);
            // 根据状态累加数量
            if (status === "已建") {
                townshipData.value += 1;
            } else if (status === "待建" || status === "规划") {
                townshipData.value1 += 1;
            }
        });

        // 更新显示名称
        townshipMap.forEach(townshipData => {
            townshipData.name = `庭院种植户${townshipData.value}家`;
            if (townshipData.value1 > 0) {
                townshipData.name1 = `明年规划${townshipData.value1}家`;
            }
        });

        return Array.from(townshipMap.values());

    } catch (error) {
        console.error("获取庭院列表失败:", error);
        return []

    }
}
