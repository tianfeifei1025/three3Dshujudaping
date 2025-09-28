import {
    Fog,
    Group,
    MeshBasicMaterial,
    DirectionalLight,
    AmbientLight,
    Vector3,
    CylinderGeometry,
    MeshLambertMaterial,
    LineBasicMaterial,
    Color,
    MeshStandardMaterial,
    ShaderMaterial,
    PlaneGeometry,
    Mesh,
    DoubleSide,
    RepeatWrapping,
    SRGBColorSpace,
    AdditiveBlending,
    TubeGeometry,
    QuadraticBezierCurve3,
    Sprite,
    SpriteMaterial,
    EdgesGeometry,
    LineSegments,
    MathUtils,
} from "three";
import {
    Mini3d,
    ExtrudeMap,
    BaseMap,
    Line,
    Label3d,
    Label2d,
    Plane,
    Debug,
    RippleShader,
    GradientShader,
    Focus,
    HeatMap,
    emptyObject,
    InteractionManager,
    getBoundBox,
} from "@/mini3d";
import stats from "three/examples/jsm/libs/stats.module";
import {geoMercator} from "d3-geo";
import pointIcon from "@/assets/texture/point-icon.svg";
import cityData from "./map/cityData";
import barData from "./map/example/barData.js";
import parkData from "./map/parkData";
import scatterData from "./map/example/scatter.js";
import gsap from "gsap";
import emitter from "@/utils/emitter";
import {sleep} from "@/utils";
import {useToast} from "vue-toastification";

const showToast = useToast();

function sortByValue(data) {
    data.sort((a, b) => b.value - a.value);
    return data;
}

export class World extends Mini3d {
    constructor(canvas, assets, worldConfig) {
        super(canvas);
        this.sizes.pixelRatio = 1;
        this.renderer.resize();
        this.debug = new Debug(worldConfig.debug);
        // 中心坐标
        this.geoProjectionCenter = worldConfig.geoProjectionCenter || [
            120.109913, 29.181466,
        ];
        // 缩放比例
        this.geoProjectionScale = worldConfig.geoProjectionScale || 90;
        // 飞线中心
        this.flyLineCenter = worldConfig.flyLineCenter || [
            120.20341805, 30.23969507,
        ];
        // 地图拉伸高度
        this.depth = worldConfig.depth;
        // 雾
        // this.scene.fog = new Fog(0x000000, 1, 50);
        // 背景
        // this.scene.background = new Color(0x000000);
        this.renderer.instance.setClearColor(0x000000, 0);
        // 相机初始位置
        this.camera.instance.position.set(
            -13.767695123014105,
            12.990152163077308,
            39.28228164159694
        );
        this.camera.instance.near = 1;
        this.camera.instance.far = 10000;
        this.camera.controls.enabled = false;

        // 创建交互管理
        this.interactionManager = new InteractionManager(
            this.renderer.instance,
            this.camera.instance,
            this.canvas
        );

        this.assets = assets;
        // 选中状态管理
        this.selectedPoint = null;
        this.selectedPointLabel = null;
        this.selectedMapRegion = null;
        // 创建环境光
        this.initEnvironment();
        this.init();
    }

    init() {
        // 点位组
        this.pointGroup = new Group();
        this.pointGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.pointGroup);

        // 路径组
        this.trackGroup = new Group();
        this.trackGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.trackGroup);

        // 路径点标签组
        this.pathLabelGroup = new Group();
        this.pathLabelGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.pathLabelGroup);

        // 区域名称标签组
        this.labelGroup = new Group();
        this.labelGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.labelGroup);

        // bar 标签组
        this.barLabelGroup = new Group();
        this.barLabelGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.barLabelGroup);
        // 热力图
        this.hotmapGroup = new Group();
        this.scene.add(this.hotmapGroup);
        //
        this.label3d = new Label3d(this);
        this.label2d = new Label2d(this);
        // 飞线焦点光圈组
        this.flyLineFocusGroup = new Group();
        this.flyLineFocusGroup.visible = true;
        this.flyLineFocusGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.flyLineFocusGroup);
        // 区域事件元素
        this.eventElement = [];
        // 鼠标移上移除的材质
        this.defaultMaterial = null; // 默认材质
        this.defaultLightMaterial = null; // 高亮材质

        // 柱状图数据（分类型）
        this.barGroups = {};
        this.barStore = {};
        this.allGuangquan = [];
        this.allPointLabel = [];
        // 飞线纹理
        this.flylineTexture = this.assets.instance.getResource("mapFlyline");
        // 创建底部背景
        this.createBottomBg();
        // 旋转圆环
        // this.createRotateBorder();
        // 创建标签
        this.createLabel();
        // 创建地图
        this.createMap();
        // 创建面发光贴图
        this.createFaceGlow();
        // 创建10段线
        // this.create10LineSegments();
        // 创建扩散
        // this.createDiffuse();
        // 创建飞线焦点
        // this.createFocus();
        // 创建散点图
        this.createScatter();
        // 创建轮廓
        this.createStorke();
        // 创建上升粒子
        this.createPark();
        // 创建事件
        this.createEvent();
        // this.time.on("tick", () => {
        //   console.log(this.camera.instance.position);
        // });
        // 创建动画时间线
        let tl = gsap.timeline({
            onComplete: () => {
            },
        });
        tl.pause();
        this.animateTl = tl;
        tl.addLabel("focusMap", 1.5);
        tl.addLabel("focusMapOpacity", 2);
        tl.addLabel("bar", 3);
        tl.to(this.camera.instance.position, {
            duration: 2,
            x: 2.0398,
            y: 15.1629,
            z: 16.3394,
            ease: "circ.out",
            onComplete: () => {
                emitter.$emit("mapPlayComplete");
                this.limitCamera();
            },
        });
    }

    // 限制相机范围
    limitCamera() {
        this.camera.controls.enabled = true;
        this.camera.controls.maxPolarAngle = Math.PI / 2.2;
        this.camera.controls.minDistance = 1;
        this.camera.controls.maxDistance = 50;
    }

    initEnvironment() {
        let sun = new AmbientLight(0xffffff, 5);
        this.scene.add(sun);
        let directionalLight = new DirectionalLight(0xffffff, 5);
        directionalLight.position.set(-30, 6, -8);
        directionalLight.castShadow = true;
        directionalLight.shadow.radius = 20;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }

    // 创建地图
    createMap() {
        let mapGroup = new Group();
        let focusMapGroup = new Group();
        this.focusMapGroup = focusMapGroup;
        let {map, mapTop, mapLine, mapLineBlack} = this.createProvince();

        map.setParent(focusMapGroup);
        mapTop.setParent(focusMapGroup);
        mapLine.setParent(focusMapGroup);
        this.mapLine = mapLine;
        // focusMapGroup.add(mapLineBlack);
        // console.log(getBoundBox(map.mapGroup));

        mapGroup.add(focusMapGroup);
        mapGroup.rotation.x = -Math.PI / 2;
        mapGroup.position.set(0, 0.05, 0);
        this.scene.add(mapGroup);
    }

    createProvince() {
        let mapJsonData = this.assets.instance.getResource("mapJson");
        // 贴图的比例，必须跟地图的大小保持一致
        let faceTexture = this.assets.instance.getResource("face");
        faceTexture.colorSpace = SRGBColorSpace;
        faceTexture.wrapS = RepeatWrapping;
        faceTexture.wrapT = RepeatWrapping;
        let params = {scale: 1, x: 0, y: 0};
        faceTexture.repeat.set(params.scale, params.scale);
        faceTexture.offset.set(params.x, params.y);
        if (this.debug.active) {
            const folder = this.debug.instance.addFolder("face");
            folder.add(params, "scale", 0, 1, 0.001).onChange((v) => {
                let val = Number(v);
                faceTexture.repeat.set(val, val);
            });
            folder.add(faceTexture.offset, "x", 0, 2, 0.001);
            folder.add(faceTexture.offset, "y", 0, 2, 0.001);
        }
        let [topMaterial, sideMaterial] = this.createProvinceMaterial();
        this.focusMapTopMaterial = topMaterial;
        this.focusMapSideMaterial = sideMaterial;
        let map = new ExtrudeMap(this, {
            geoProjectionCenter: this.geoProjectionCenter,
            geoProjectionScale: this.geoProjectionScale,
            position: new Vector3(0, 0, 0.11),
            data: mapJsonData,
            depth: this.depth,
            topFaceMaterial: topMaterial,
            sideMaterial: sideMaterial,
            renderOrder: 9,
        });
        let faceMaterial = new MeshBasicMaterial({
            color: 0xffffff,
            map: faceTexture,
            transparent: true,
            opacity: 1,
            fog: false,
        });

        this.defaultMaterial = faceMaterial;
        this.defaultLightMaterial = this.defaultMaterial.clone();
        this.defaultLightMaterial.opacity = 0.75;

        let mapTop = new BaseMap(this, {
            geoProjectionCenter: this.geoProjectionCenter,
            geoProjectionScale: this.geoProjectionScale,
            position: new Vector3(0, 0, this.depth + 0.22),
            data: mapJsonData,
            material: faceMaterial,
            renderOrder: 2,
        });
        let {boxSize, box3} = getBoundBox(mapTop.mapGroup);
        // console.log(getBoundBox(mapTop.mapGroup));

        mapTop.mapGroup.children.map((group) => {
            group.children.map((mesh) => {
                // 添加事件元素
                this.eventElement.push(mesh);
                this.calcUv(
                    mesh.geometry,
                    boxSize.x,
                    boxSize.y,
                    box3.min.x,
                    box3.min.y
                );
            });
        });
        this.mapLineMaterial = new LineBasicMaterial({
            color: 0x0695e7,
            opacity: 1,
            transparent: true,
            fog: false,
        });

        let mapLine = new Line(this, {
            geoProjectionCenter: this.geoProjectionCenter,
            geoProjectionScale: this.geoProjectionScale,
            data: mapJsonData,
            material: this.mapLineMaterial,
            type: "Line3",
            tubeRadius: 0.02,
            renderOrder: 3,
        });
        mapLine.lineGroup.position.z += this.depth + 0.23;

        // 创建黑色线
        // let mapLineBlack = mapLine.lineGroup.clone();
        // mapLineBlack.scale.set(1, 1, 0.1);
        // mapLineBlack.position.x += 0.01;
        // mapLineBlack.position.y -= -0.01;
        // mapLineBlack.traverse((obj) => {
        //   if (obj.isMesh) {
        //     obj.material = obj.material.clone();
        //     obj.material.color = new Color(0x000000);
        //     obj.material.opacity = 1;
        //   }
        // });
        return {
            map,
            mapTop,
            mapLine,
            // mapLineBlack,
        };
    }

    /**
     * 重新计算每块的UV
     */
    calcUv(geometry, width, height, minX, minY) {
        const positionAttribute = geometry.attributes.position;
        const uvAttribute = geometry.attributes.uv;

        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);

            const u = (x - minX) / width;
            const v = (y - minY) / height;

            uvAttribute.setXY(i, u, v);
        }
        uvAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    createProvinceMaterial() {
        let topMaterial = new MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            fog: false,
            side: DoubleSide,
        });

        let sideMap = this.assets.instance.getResource("side");
        sideMap.flipY = false;
        sideMap.colorSpace = SRGBColorSpace;
        sideMap.wrapS = RepeatWrapping;
        sideMap.wrapT = RepeatWrapping;
        sideMap.repeat.set(1, 1.8);
        let sideMaterial = new MeshBasicMaterial({
            // color: 0x3ce0ff,
            map: sideMap,
            fog: false,
            opacity: 1,
            side: DoubleSide,
        });

        return [topMaterial, sideMaterial];
    }

    createFaceGlow() {
        let faceGlow = this.assets.instance.getResource("faceGlow");
        faceGlow.colorSpace = SRGBColorSpace;
        faceGlow.wrapS = faceGlow.wrapT = RepeatWrapping;
        let geometry = new PlaneGeometry(386, 557);
        let material = new MeshBasicMaterial({
            map: faceGlow,
            transparent: true,
            side: DoubleSide,
            depthWrite: false,
            depthTest: false,
            fog: false,
        });
        let mesh = new Mesh(geometry, material);
        mesh.renderOrder = 30;
        this.focusMapGroup.add(mesh);

        let params = {
            x: -1.38,
            y: 3.56,
            z: 0,
            scale: 0.028,
        };
        mesh.position.set(params.x, params.y, params.z);
        mesh.scale.setScalar(params.scale);
        if (this.debug.active) {
            const folder = this.debug.instance.addFolder("faceGlow");

            folder.add(params, "x", -100, 100, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.position.x = val;
            });
            folder.add(params, "y", -100, 100, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.position.y = val;
            });
            folder.add(params, "z", -100, 100, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.position.z = val;
            });
            folder.add(params, "scale", 0, 1, 0.001).onChange((v) => {
                let val = Number(v);
                mesh.scale.setScalar(val);
            });
        }
    }

    // 创建10段线
    create10LineSegments() {
        let tenLine = this.assets.instance.getResource("tenLine");
        tenLine.colorSpace = SRGBColorSpace;
        tenLine.anisotropy = 8;
        let geometry = new PlaneGeometry(1, 1.2927);
        let material = new MeshBasicMaterial({
            map: tenLine,
            transparent: true,
            side: DoubleSide,
            depthWrite: false,
            depthTest: false,
            fog: false,
        });
        let mesh = new Mesh(geometry, material);
        mesh.scale.setScalar(1.5);
        mesh.renderOrder = 30;
        let [x, y] = this.geoProjection([127.82418253, 21.63434992]);
        mesh.position.set(x, -y, 0.2);
        mesh.rotation.z = MathUtils.degToRad(5);
        this.focusMapGroup.add(mesh);
    }

    /**
     * 创建庭院双柱状图（当前已建 + 明年规划）
     * @param {*} _data 传入的数据
     */
    createCourtyardDualBar(_data) {
        let self = this;
        let data = _data || [];
        
        // 过滤出有数据的项（value > 0 或 value1 > 0）
        let currentData = data.filter(item => item.value > 0).map(item => ({
            ...item,
            name: item.name || `庭院种植户${item.value}家`,
            value: item.value,
            centroid: item.centroid
        }));
        
        let nextYearData = data.filter(item => item.value1 > 0).map(item => ({
            ...item,
            name: item.name1 || `明年规划${item.value1}家`,
            value: item.value1,
            centroid: item.centroid1 || item.centroid
        }));
        
        // 按value排序
        currentData = sortByValue(currentData);
        nextYearData = sortByValue(nextYearData);
        
        // 创建当前已建柱状图（正常颜色）
        if (currentData.length > 0) {
            const currentColorConfig = {
                color1: 0x50bbfe,
                color2: 0xfffef4,
                isGray: false
            };
            this.createBar(currentData, 'courtyard-current', currentColorConfig);
        }
        
        // 创建明年规划柱状图（灰色）
        if (nextYearData.length > 0) {
            const nextYearColorConfig = {
                color1: 0x666666,
                color2: 0x999999,
                isGray: true
            };
            this.createBar(nextYearData, 'courtyard-next', nextYearColorConfig);
        }
    }

    /**
     * 创建柱状图
     * @param {*} _data 传入的数据
     * @param {*} type 类型
     * @param {*} colorConfig 颜色配置
     */
    createBar(_data, type = 'park', colorConfig = null) {
        let self = this;
        let data = sortByValue(parkData);
        if (_data) {
            data = sortByValue(_data);
        }
        const barGroup = this._getOrCreateBarGroup(type);
        const factor = 0.7;
        const height = 3.0 * factor;
        const max = data[0].value;

        // 本次新建元素集合，用于动画
        const newBars = [];
        const newMaterials = [];
        const newLabels = [];
        const newGuangquans = [];

        // 确保类型存储存在
        if (!this.barStore[type]) {
            this.barStore[type] = {bars: [], materials: [], labels: [], guangquans: []};
        }

        data.map((item, index) => {
            let geoHeight = height * (item.value / max);
            let material = new MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0,
                depthTest: false,
                fog: false,
            });
            
            // 根据类型和颜色配置设置颜色
            let color1, color2;
            if (colorConfig) {
                color1 = colorConfig.color1;
                color2 = colorConfig.color2;
            } else {
                color1 = index > 0 ? 0x50bbfe : 0xfbdf88;
                color2 = 0xfffef4;
            }
            
            new GradientShader(material, {
                uColor1: color1,
                uColor2: color2,
                size: geoHeight,
                dir: "z",
            });
            let radius = 0.08 * factor;

            const geo = new CylinderGeometry(radius, radius, geoHeight);
            geo.translate(0, geoHeight / 2, 0);
            const mesh = new Mesh(geo, material);
            mesh.castShadow = true;
            mesh.rotation.x = Math.PI / 2;
            mesh.renderOrder = 5;
            mesh.name = item.name + "-bar";
            let areaBar = mesh;
            let [x, y] = this.geoProjection(item.centroid);
            areaBar.position.set(x, -y, this.depth + 0.45);
            areaBar.scale.set(1, 0, 1);

            // 为柱体添加用户数据，用于点击事件
            areaBar.userData = item;
            // 保存原始透明度，用于鼠标悬停效果
            areaBar.userData.originalOpacity = 1.0; // 动画完成后会是1

            // 创建圈
            let guangquan = new RippleShader(this, {
                size: 1.5,
                color: colorConfig ? colorConfig.color1 : (index > 0 ? 0x50bbfe : 0xfbdf88),
            });
            guangquan.renderOrder = 50;
            guangquan.position.set(x, -y, this.depth + 0.45);
            guangquan.traverse((obj) => {
                obj.renderOrder = 51;
                obj.rotation.x = Math.PI / 2;
            });
            barGroup.add(guangquan);
            barGroup.add(areaBar);
            let barLabel = labelStyle04(
                item,
                index,
                new Vector3(x, -y, this.depth + 0.8 + geoHeight),
                colorConfig
            );
            newBars.push(areaBar);
            newMaterials.push(material);
            newLabels.push(barLabel);
            newGuangquans.push(guangquan);
            this.allGuangquan.push(guangquan);
            // 存入类型存储
            this.barStore[type].bars.push(areaBar);
            this.barStore[type].materials.push(material);
            this.barStore[type].labels.push(barLabel);
            this.barStore[type].guangquans.push(guangquan);

            // 为柱体添加交互管理器和事件监听器
            this.interactionManager.add(areaBar);

            // 添加点击事件
            areaBar.addEventListener("click", (event) => {
                event.stopPropagation();
                // showToast(`${item.name}: ${item.value}`);
                // 传递正确的id字段，优先使用id，如果没有则使用adcode
                const id = item.id || item.adcode;
                emitter.$emit("barSelected", {id: id, name: item.name, data: item});
                // 这里可以添加其他点击后的逻辑，比如高亮显示、显示详细信息等
            });

            // 添加鼠标悬停事件
            areaBar.addEventListener("mouseover", (event) => {
                event.stopPropagation();
                document.body.style.cursor = "pointer";
                // 悬停时稍微增加透明度
                material.opacity = Math.min(material.opacity + 0.1, 1.0);
            });

            // 添加鼠标离开事件
            areaBar.addEventListener("mouseout", (event) => {
                event.stopPropagation();
                document.body.style.cursor = "default";
                // 恢复到原始透明度
                material.opacity = areaBar.userData.originalOpacity;
            });
        });

        function labelStyle04(data, index, position, colorConfig = null) {
            let label = self.label2d.create("", "bar-label", false);
            label.name = data.name + "-barLabel";
            
            // 根据颜色配置决定标签样式
            let labelClass = "";
            if (colorConfig) {
                labelClass = colorConfig.isGray ? "gray" : "";
            } else {
                labelClass = index === 0 ? "cyan" : "";
            }
            
            label.init(
                `<div class="bar-label-wrap ${labelClass}" >
        <div class="bar-label-icon"><img src="${pointIcon}"></div>
          <div class="bar-label-number">
            ${data.name}
          </div>
        </div>`,
                position
            );
            label.setParent(self.labelGroup);
            return label;
        }

        this._animateNewBars(newBars, newMaterials, newLabels);
    }

    // 删除柱状图数据（按类型）
    clearBar(type) {
        // 未传类型时清空所有
        if (!type) {
            Object.keys(this.barStore).forEach((key) => this.clearBar(key));
            return;
        }

        // 特殊处理庭院类型，清理双柱状图
        if (type === 'courtyard') {
            this.clearBar('courtyard-current');
            this.clearBar('courtyard-next');
            return;
        }

        const store = this.barStore[type];
        const group = this.barGroups[type];
        if (!store || !group) return;

        // 清理标签
        store.labels.forEach((label) => {
            if (label && label.parent) {
                label.parent.remove(label);
            }
        });

        // 清理柱体事件监听器
        store.bars.forEach((bar) => {
            if (bar && this.interactionManager) {
                this.interactionManager.remove(bar);
            }
        });

        // 从全局光圈列表中移除本类型
        if (this.allGuangquan && store.guangquans) {
            this.allGuangquan = this.allGuangquan.filter((q) => !store.guangquans.includes(q));
        }

        // 清空组
        emptyObject(group);

        // 重置存储
        this.barStore[type] = {bars: [], materials: [], labels: [], guangquans: []};
    }

    async _animateNewBars(bars, materials, labels) {
        await sleep(500);
        bars.forEach((item, index) => {
            gsap.to(item.scale, {
                duration: 1,
                delay: 0.1 * index,
                x: 1,
                y: 1,
                z: 1,
                ease: "circ.out",
            });
        });
        materials.forEach((item, index) => {
            gsap.to(item, {
                duration: 1,
                delay: 0.1 * index,
                opacity: 1,
                ease: "circ.out",
                onComplete: () => {
                    // 动画完成后，更新原始透明度
                    if (newBars[index] && newBars[index].userData) {
                        newBars[index].userData.originalOpacity = 1.0;
                    }
                }
            });
        });

        labels.forEach((item, index) => {
            let element = item.element.querySelector(".bar-label-wrap");

            gsap.to(element, {
                duration: 1,
                delay: 0.2 * index,
                translateY: 0,
                opacity: 1,
                ease: "circ.out",
            });
        });
    }

    _getOrCreateBarGroup(type) {
        if (this.barGroups[type]) return this.barGroups[type];
        const group = new Group();
        group.rotation.x = -Math.PI / 2;
        this.scene.add(group);
        this.barGroups[type] = group;
        if (!this.barStore[type]) {
            this.barStore[type] = {bars: [], materials: [], labels: [], guangquans: []};
        }
        return group;
    }

    createEvent() {
        let objectsHover = [];
        let selectedObject = null;

        const reset = (mesh) => {
            mesh.traverse((obj) => {
                if (obj.isMesh) {
                    obj.material = this.defaultMaterial;
                }
            });
        };
        const move = (mesh) => {
            mesh.traverse((obj) => {
                if (obj.isMesh) {
                    obj.material = this.defaultLightMaterial;
                }
            });
        };

        this.eventElement.map((mesh) => {
            this.interactionManager.add(mesh);
            mesh.addEventListener("click", (event) => {
                event.stopPropagation();
                // 如果点击的是已选中的对象，则取消选中
                if (selectedObject === event.target.parent) {
                    reset(event.target.parent);
                    selectedObject = null;
                } else {
                    // 取消之前选中的对象
                    if (selectedObject) {
                        reset(selectedObject);
                    }
                    // 选中当前点击的对象
                    move(event.target.parent);
                    selectedObject = event.target.parent;
                }
            });

            // mesh.addEventListener("mouseover", (event) => {
            //   // 如果当前对象不是选中状态，才应用悬停效果
            //   if (selectedObject !== event.target.parent) {
            //     if (!objectsHover.includes(event.target.parent)) {
            //       objectsHover.push(event.target.parent);
            //     }
            //     document.body.style.cursor = "pointer";
            //     move(event.target.parent);
            //   }
            // });
            //
            // mesh.addEventListener("mouseout", (event) => {
            //   // 如果当前对象不是选中状态，才移除悬停效果
            //   if (selectedObject !== event.target.parent) {
            //     objectsHover = objectsHover.filter(
            //       (n) => n.userData.name !== event.target.parent.userData.name
            //     );
            //     if (objectsHover.length > 0) {
            //       const mesh = objectsHover[objectsHover.length - 1];
            //     }
            //     reset(event.target.parent);
            //     document.body.style.cursor = "default";
            //   }
            // });
        });
    }

    // 创建扩散
    createDiffuse() {
        let texture = this.assets.instance.getResource("diffuse");
        texture.colorSpace = SRGBColorSpace;
        texture.wrapS = texture.wrapT = RepeatWrapping;

        let geometry = new PlaneGeometry(15, 15);
        let material = new MeshBasicMaterial({
            color: 0x002d40,
            map: texture,
            transparent: true,
            opacity: 1,
            fog: true,
            blending: AdditiveBlending,
        });

        let mesh = new Mesh(geometry, material);
        mesh.renderOrder = 3;
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.set(0, 0, 0);
        mesh.position.set(0, 0.21, 0);
        this.scene.add(mesh);
        let params = {scale: 0};
        mesh._s = 0;
        this.time.on("tick", (delta, elapsedTime) => {
            // 缩放值增加
            mesh._s += 0.01;
            mesh.scale.setScalar(mesh._s);
            // 缩放至大于1的时候，透明度逐渐变为0
            if (mesh._s >= 1) {
                mesh.material.opacity = 1 - (mesh._s - 1);
            } else {
                mesh.material.opacity = 1;
            }
            // 缩放至大于等于2的时候，缩放至归0
            if (mesh._s >= 5) {
                mesh._s = 0;
            }
        });
    }

    createBottomBg() {
        let geometry = new PlaneGeometry(16, 7.66);
        const texture = this.assets.instance.getResource("bg");
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 8;
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.repeat.set(1, 1);
        let material = new MeshBasicMaterial({
            map: texture,
            opacity: 1,
            fog: false,
        });
        let mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        let params = {scale: 2.85, x: -1.76, y: -0.01, z: 0.65};
        mesh.position.set(params.x, params.y, params.z);
        mesh.scale.setScalar(params.scale);
        this.scene.add(mesh);
        if (this.debug.active) {
            const folder = this.debug.instance.addFolder("bg");
            folder.add(params, "x", -10, 10, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.position.x = val;
            });
            folder.add(params, "y", -10, 10, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.position.y = val;
            });
            folder.add(params, "z", -10, 10, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.position.z = val;
            });
            folder.add(params, "scale", 1, 10, 0.01).onChange((v) => {
                let val = Number(v);
                mesh.scale.setScalar(val);
            });
        }
    }

    createLabel() {
        let self = this;
        let labelGroup = this.labelGroup;
        let label3d = this.label3d;
        cityData.map((province) => {
            let label = labelStyle01(province, label3d, labelGroup);
        });

        function labelStyle01(province, label3d, labelGroup) {
            let label = label3d.create("", "province-label", false);
            label.name = province.name + "-provinceLabel";
            const [x, y] = self.geoProjection(province.center);
            label.init(
                `<div class="name">${province.name}</div>`,
                new Vector3(x, -y, self.depth * 2 + 0.1)
            );
            label3d.setLabelStyle(label, 0.01, "x", MathUtils.degToRad(0));
            label.setParent(labelGroup);
            return label;
        }
    }

    createCircleQuan({
                         width,
                         speed,
                         material,
                         renderOrder,
                         position = new Vector3(0, -0.005, 0),
                     }) {
        let plane = new Plane(this, {
            width: width,
            needRotate: true,
            rotateSpeed: speed,
            material: material,
            position: position,
        });
        plane.instance.rotation.x = -Math.PI / 2;
        plane.instance.renderOrder = renderOrder;
        plane.instance.scale.set(1, 1, 1);
        plane.setParent(this.scene);
        return plane.instance;
    }

    createRotateBorder() {
        let quan1Texture = this.assets.instance.getResource("quan1");
        let quan2Texture = this.assets.instance.getResource("quan2");
        let quan3Texture = this.assets.instance.getResource("quan3");
        quan1Texture.colorSpace =
            quan2Texture.colorSpace =
                quan3Texture.colorSpace =
                    SRGBColorSpace;
        let material1 = new MeshBasicMaterial({
            map: quan1Texture,
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
            fog: false,
            blending: AdditiveBlending,
        });
        let material2 = new MeshBasicMaterial({
            map: quan2Texture,
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            fog: false,
            blending: AdditiveBlending,
        });
        let material3 = new MeshBasicMaterial({
            color: 0x00d4ff,
            map: quan3Texture,
            transparent: true,
            depthWrite: false,
            opacity: 0.1,
            fog: false,
            blending: AdditiveBlending,
        });

        let quan1 = this.createCircleQuan({
            width: 13,
            speed: -0.002,
            material: material1,
            renderOrder: 2,
        });
        let quan2 = this.createCircleQuan({
            width: 13,
            speed: 0.002,
            material: material2,
            renderOrder: 2,
        });
        let quan3 = this.createCircleQuan({
            width: 13,
            speed: 0.02,
            material: material3,
            renderOrder: 2,
        });

        this.rotateBorder1 = quan1;
        this.rotateBorder2 = quan2;
    }

    // 创建飞线
    createFlyLine(startData, endData) {
        this.flyLineGroup = new Group();
        this.scene.add(this.flyLineGroup);
        const texture = this.flylineTexture;
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.colorSpace = SRGBColorSpace;
        texture.repeat.set(0.5, 2);
        const tubeRadius = 0.02;
        const tubeSegments = 32;
        const tubeRadialSegments = 8;
        const closed = false;
        let [centerX, centerY] = this.geoProjection(startData.centroid);
        let centerPoint = new Vector3(centerX, -centerY, 0);
        const material = new MeshStandardMaterial({
            map: texture,
            transparent: true,
            fog: false,
            opacity: 1,
            depthTest: false,
            emissiveIntensity: 2,
            blending: AdditiveBlending,
        });
        const material2 = new MeshBasicMaterial({
            color: 0x00f7f5,
            transparent: true,
            fog: false,
            opacity: 0.05,
            depthTest: false,
            blending: AdditiveBlending,
        });

        endData.map((city, index) => {
            let [x, y] = this.geoProjection(city.centroid);
            let point = new Vector3(x, -y, 0);
            const center = new Vector3();
            center.addVectors(centerPoint, point).multiplyScalar(0.5);
            center.setZ(1.5);
            const curve = new QuadraticBezierCurve3(centerPoint, center, point);
            const tubeGeometry = new TubeGeometry(
                curve,
                tubeSegments,
                0.08,
                2,
                closed
            );
            const tubeGeometry2 = new TubeGeometry(
                curve,
                tubeSegments,
                tubeRadius,
                tubeRadialSegments,
                closed
            );
            const mesh = new Mesh(tubeGeometry, material);
            const mesh2 = new Mesh(tubeGeometry2, material2);
            mesh.name = "flylineMesh1-" + index;
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(0, this.depth + 0.44, 0);
            mesh.renderOrder = 21;
            if (index % 2 === 0) {
                mesh.material = mesh.material.clone();
                mesh.material.color = new Color(0xff0000);
            }
            mesh2.name = "flylineMesh2-" + index;
            mesh2.rotation.x = -Math.PI / 2;
            mesh2.position.set(0, this.depth + 0.44, 0);
            mesh2.renderOrder = 20;
            this.flyLineGroup.add(mesh, mesh2);
        });
    }

    // 清空飞线
    clearFlyLine() {
        emptyObject(this.flyLineGroup);
    }

    // 创建焦点
    createFocus() {
        let focusObj = new Focus(this, {color1: 0xbdfdfd, color2: 0xbdfdfd});
        let [x, y] = this.geoProjection(this.flyLineCenter);
        focusObj.position.set(x, -y, this.depth + 0.44);
        focusObj.scale.set(1, 1, 1);
        this.flyLineFocusGroup.add(focusObj);
    }

    // 销毁飞线 焦点
    destroyFlyFocus() {
        emptyObject(this.flyLineGroup);
        emptyObject(this.flyLineFocusGroup);
    }

    // 创建散点
    createScatter() {
        this.scatterGroup = new Group();
        this.scatterGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.scatterGroup);
        const texture = this.assets.instance.getResource("arrow");
        const material = new SpriteMaterial({
            map: texture,
            color: 0xfffef4,
            fog: false,
            transparent: true,
            depthTest: false,
        });
        let scatterAllData = sortByValue(scatterData);
        let max = scatterAllData[0].value;
        scatterAllData.map((data) => {
            const sprite = new Sprite(material);
            sprite.renderOrder = 23;
            let scale = 0.2 + (data.value / max) * 0.2;
            sprite.scale.set(scale, scale, scale);
            let [x, y] = this.geoProjection(data.centroid);
            sprite.position.set(x, -y, this.depth + 0.45);
            sprite.userData.position = [x, -y, this.depth + 0.45];
            this.scatterGroup.add(sprite);
        });
    }

    createStorke() {
        const mapStroke = this.assets.instance.getResource("mapStroke");
        const texture = this.assets.instance.getResource("pathLine3");
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(2, 1);

        let pathLine = new Line(this, {
            geoProjectionCenter: this.geoProjectionCenter,
            geoProjectionScale: this.geoProjectionScale,
            position: new Vector3(0, 0, this.depth + 0.24), //this.depth + 0.24
            data: mapStroke,
            material: new MeshBasicMaterial({
                color: 0x2bc4dc,
                // map: texture,
                // alphaMap: texture,
                fog: false,
                transparent: true,
                opacity: 1,
                blending: AdditiveBlending,
            }),
            type: "Line3",
            renderOrder: 22,
            tubeRadius: 0.03,
        });
        // 设置父级
        this.focusMapGroup.add(pathLine.lineGroup);
        // this.time.on("tick", () => {
        //   texture.offset.x += 0.005;
        // });
    }

    createPark() {
        let geometry = new PlaneGeometry(0.05, 3);
        const material = new ShaderMaterial({
            vertexShader: `

        varying vec2 vUv;

        void main(void) {
            vUv = uv;
            vec3 pos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }`,
            fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor1; 
        uniform vec3 uColor2; 
        void main(void) {
              
            vec3 color = mix(uColor2,uColor1,vUv.y*0.5);
            
            gl_FragColor = vec4(color,vUv.y);
        }`,
            side: DoubleSide,
            // wireframe:true,
            uniforms: {
                //随时间变化
                uTime: {value: 0.0},
                //飞线颜色
                uColor1: {value: new Color("#00ffff")},
                uColor2: {value: new Color("#ffffff")},
            },
            //开启透明度
            transparent: true,
            depthTest: false,
            // blending:AdditiveBlending
        });
        let lines = [];
        for (let i = 0; i < 15; i++) {
            let x = MathUtils.randFloat(-15, 15);
            let y = MathUtils.randFloat(-10, 10);
            let z = MathUtils.randFloat(-15, 15);
            const line = new Mesh(geometry, material);
            line.renderOrder = 50;
            line.userData.y = y;
            line.position.set(x, y, z);
            this.scene.add(line);
            lines.push(line);
        }

        this.time.on("tick", (delta, elapsedTime) => {
            // material.uniforms.uTime.value = elapsedTime
            lines.forEach((line) => {
                line.position.y += 0.1;
                if (line.position.y > 20) {
                    line.position.y = -Math.abs(line.userData.y);
                }
            });
        });
    }


    // 创建路径
    createPath(data) {
        // 路径
        const texture = this.assets.instance.getResource("pathLine").clone();
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.repeat.set(6, 1);
        // 组合路径数据
        const coordinates = JSON.stringify(data.coordinates);
        let pathData = `{
      "features": [
        {
            "properties": { "_draw_type": "line" },
            "geometry": {
              "type": "LineString",
              "coordinates": ${coordinates}
            }
        }
      ]
    }`;

        let pathLine = new Line(this, {
            geoProjectionCenter: this.geoProjectionCenter,
            geoProjectionScale: this.geoProjectionScale,
            position: new Vector3(0, 0, this.depth * 2 + 0.1),
            data: pathData,
            material: new MeshBasicMaterial({
                map: texture,
                fog: false,
                transparent: true,
                opacity: 1,
                depthTest: false,
                blending: AdditiveBlending,
            }),
            type: "Line3",
            renderOrder: 99,
            tubeRadius: 0.03,
        });
        pathLine.lineGroup.scale.set(1, 1, 1);
        // 左右两点
        // let start = this.geoProjection(data.startPoint.position);
        // let end = this.geoProjection(data.endPoint.position);

        this.trackGroup.add(pathLine.lineGroup);
        this.time.on("tick", () => {
            texture.offset.x -= 0.05;
        });

        this.createPathPointEvent(data.startPoint);
        this.createPathPointEvent(data.endPoint);
    }

    // 创建路径点的事件
    createPathPointEvent(pointInfo) {
        let [x, y] = this.geoProjection(pointInfo.position);
        let label = this.label2d.create("", "path-point-label");
        let typeClass =
            pointInfo.type === "start"
                ? "path-point-label-icon-start"
                : "path-point-label-icon-end";
        label.init(
            `
      <div class="path-point-label-wrap">
        <div class="path-point-label-icon ${typeClass}"></div>
        <div class="path-point-label-info">
          <div class="name">${pointInfo.name}</div>
          <div class="thumb">
          <img src="./assets/${pointInfo.thumb}.jpg" />
          </div>
          <div class="info">
            <div class="info-item">载重：${pointInfo.weight} 吨</div>
            <div class="info-item">车厢：${pointInfo.trainCarriageNum} 节</div>
            <div class="info-item">人员：${pointInfo.staffNum}人</div>
            <div class="info-item">货物：${pointInfo.goods}</div>
            <div class="info-item">承运：${pointInfo.carrierCompany}</div>
          </div>
        </div>
      </div>
      `,
            new Vector3(x, -y, this.depth * 2 + 0.2)
        );
        label.setParent(this.pathLabelGroup);
        label.element
            .querySelector(".path-point-label-icon")
            .addEventListener("click", () => {
                label.element
                    .querySelector(".path-point-label-info")
                    .classList.toggle("show");
                document.querySelectorAll(".path-point-label-info").forEach((item) => {
                    if (item !== label.element.querySelector(".path-point-label-info")) {
                        item.classList.remove("show");
                    }
                });
            }, {passive: true});
    }

    // 销毁路径
    destroyPath() {
        emptyObject(this.trackGroup);
        emptyObject(this.pathLabelGroup);
    }

    // 创建热力图
    createHeatmap() {
        // 获取热力点位数据
        const hotmapData = this.assets.instance.getResource("hotmapData");
        let pointData = JSON.parse(hotmapData);

        let {boxSize} = getBoundBox(this.focusMapGroup);
        let heatMapPlane = new HeatMap(this, {
            data: pointData,
            width: boxSize.x,
            height: boxSize.z,
            z: this.depth * 2,
        });
        this.hotmapGroup.add(heatMapPlane);
    }

    // 销毁热力图
    destroyHeatmap() {
        emptyObject(this.hotmapGroup);
    }

    /**
     * 创建庭院标签
     */
    createCourtyardLabel(data, options = {}) {
        if (!data || data.length === 0) return;
        
        // 创建庭院标签组
        this.courtyardLabelGroup = new Group();
        this.courtyardLabelGroup.rotation.x = -Math.PI / 2;
        this.scene.add(this.courtyardLabelGroup);
        
        // 存储标签引用，用于后续销毁
        this.courtyardLabels = [];
        
        data.forEach((item, index) => {
            const [x, y] = this.geoProjection(item.centroid);
            const label = this.createCourtyardLabelItem(item, new Vector3(x, -y, this.depth + 0.3), options);
            this.courtyardLabels.push(label);
        });
    }
    
    /**
     * 创建单个庭院标签项
     */
    createCourtyardLabelItem(item, position, options = {}) {
        const label = this.label2d.create("", "courtyard-label", false);
        label.name = `${item.name}-courtyardLabel`;
        
        // 默认配置
        const defaultOptions = {
            width: 350,
            height:120,
            fontSize: 25,
            iconSize: 24,
            padding: '8px 12px'
        };
        
        // 合并配置
        const config = { ...defaultOptions, ...options };
        
        // 创建标签HTML内容
        const labelHtml = `
            <div class="courtyard-label-wrap" style="width: ${config.width}px; height: ${config.height}px; padding: ${config.padding};">
                <div class="courtyard-label-icon" style="width: ${config.iconSize}px; height: ${config.iconSize}px;">
                    <img src="${pointIcon}" alt="庭院图标" />
                </div>
                <div class="courtyard-label-content">
                    <div class="courtyard-label-name" style="font-size: ${config.fontSize}px;">${item.data}</div> 
                </div>
            </div>
        `;
        
        label.init(labelHtml, position);
        label.setParent(this.courtyardLabelGroup);
        
        return label;
    }
    
    /**
     * 销毁庭院标签
     */
    destroyCourtyardLabel() {
        if (this.courtyardLabels && this.courtyardLabels.length > 0) {
            // 清理所有标签
            this.courtyardLabels.forEach((label) => {
                if (label && label.parent) {
                    label.parent.remove(label);
                }
            });
            this.courtyardLabels = [];
        }
        
        // 清理标签组
        if (this.courtyardLabelGroup) {
            emptyObject(this.courtyardLabelGroup);
            this.scene.remove(this.courtyardLabelGroup);
            this.courtyardLabelGroup = null;
        }
    }

    /**
     * 创建标记点
     * @param data
     * @param type
     */

    createPoint(data = [], type) {
        let pointGroup = this.pointGroup;
        const pointModel = this.assets.instance
            .getResource("pointModel")
            .scene.clone();
        const pointModelTexture2 =
            this.assets.instance.getResource("pointModelTexture2");
        pointModelTexture2.wrapS = pointModelTexture2.wrapT = RepeatWrapping;
        pointModelTexture2.colorSpace = SRGBColorSpace;
        pointModelTexture2.flipY = false;

        // 定义不同类型和状态的颜色配置
        const colorConfig = {
            park: {
                built: {plane: 0x3df2ff, cone: 0x3df2ff, edges: 0xffffff}, // 园区 - #3df2ff
                pending: {plane: 0x666666, cone: 0x666666, edges: 0x999999} // 园区 - 灰色
            },
            center: {
                built: {plane: 0x2abd97, cone: 0x2abd97, edges: 0xffffff}, // 中心 - #2abd97
                pending: {plane: 0x666666, cone: 0x666666, edges: 0x999999} // 中心 - 灰色
            },
            base: {
                built: {plane: 0xffa409, cone: 0xffa409, edges: 0xffffff}, // 基地 - #ffa409
                pending: {plane: 0x666666, cone: 0x666666, edges: 0x999999} // 基地 - 灰色
            },
            courtyard: {
                built: {plane: 0x4a99f8, cone: 0x4a99f8, edges: 0xffffff}, // 庭院 - #4a99f8
                pending: {plane: 0x666666, cone: 0x666666, edges: 0x999999} // 庭院 - 灰色
            },
            kiloton: {
                built: {plane: 0xff4949, cone: 0xff4949, edges: 0xffffff}, // 千吨加工 - #ff4949
                pending: {plane: 0x666666, cone: 0x666666, edges: 0x999999} // 千吨加工 - 灰色
            }
        };

        // 获取颜色配置
        const getColorConfig = (type, level) => {
            const typeConfig = colorConfig[type] || colorConfig.park; // 默认使用园区配置
            return level === "已建" ? typeConfig.built : typeConfig.pending;
        };

        pointModel.traverse((obj) => {
            if (obj.isMesh) {
                if (obj.name.includes("平面")) {
                    obj.material.depthTest = false;
                    obj.material.color = new Color(0xfeaaf8); // 默认颜色，后续会被覆盖
                    obj.material.blending = AdditiveBlending;
                    obj.renderOrder = 70;
                }
                if (obj.name.includes("锥体")) {
                    obj.material.transparent = true;
                    obj.material.depthWrite = false;
                    obj.renderOrder = 71;
                    // 设置模型边线
                    const edges = new EdgesGeometry(obj.geometry, 1);
                    const edgesMaterial = new LineBasicMaterial({
                        color: new Color(0xffffff),
                        transparent: true,
                        fog: false,
                        blending: AdditiveBlending,
                    });
                    const line = new LineSegments(edges, edgesMaterial);
                    obj.add(line);
                }
            }
        });

        data.map((item) => {
            const [x, y] = this.geoProjection(item.centroid);
            let point = pointModel.clone();
            point.rotation.x = Math.PI / 2;
            point.scale.set(0.26, 0.26, 0.26);
            point.position.set(x, -y, this.depth + 0.4);
            pointGroup.add(point);

            // 获取当前项的颜色配置
            const colors = getColorConfig(type, item.level);
            // 创建点位名称标签
            let pointLabel = this.label2d.create("", "point-name-label", false);
            pointLabel.name = `${type}-${item.name}-pointLabel`;
            pointLabel.init(
                `<div class="point-name-label-wrap ${type} ${item.level}">
          <div class="point-name-label-icon">
            <img src="${pointIcon}" alt="点位图标" />
          </div>
          <div class="point-name-label-content">
            <div class="point-name-label-text">${item.name}</div>
          </div>
        </div>`,
                new Vector3(x, -y, this.depth + 1.5)
            );
            pointLabel.setParent(this.labelGroup);
            this.allPointLabel.push(pointLabel);

            // 为标签添加点击事件
            if (pointLabel.element) {
                // 启用标签的鼠标事件
                pointLabel.element.style.pointerEvents = 'auto';
                
                const labelWrap = pointLabel.element.querySelector('.point-name-label-wrap');
                if (labelWrap) {
                    labelWrap.style.cursor = 'pointer';
                    labelWrap.addEventListener('click', (event) => {
                        event.stopPropagation();
                        console.log('标签点击事件');
                        
                        // 找到对应的3D对象
                        let correspondingObj = null;
                        point.traverse((obj) => {
                            if (obj.isMesh && obj.name === "锥体" && obj.userData && obj.userData.name === item.name) {
                                correspondingObj = obj;
                            }
                        });
                        this.handlePointClick(correspondingObj, pointLabel, item, type);
                        
                    }, { passive: true });
                }
            }

            point.traverse((obj) => {
                if (obj.isMesh) {
                    if (obj.name.includes("平面")) {
                        // 设置平面颜色
                        obj.material = obj.material.clone();
                        obj.material.color = new Color(colors.plane);

                        gsap.to(obj.rotation, {
                            y: -2 * Math.PI,
                            duration: 5,
                            repeat: -1,
                            ease: "none",
                        });
                    }
                    if (obj.name === "锥体") {
                        // 设置锥体颜色
                        obj.material = obj.material.clone();
                        obj.material.color = new Color(colors.cone);

                        // 如果是待建状态，使用灰色纹理
                        if (item.level === "待建") {
                            obj.material.map = pointModelTexture2;
                        }

                        // 更新边线颜色
                        const lineSegments = obj.children.find(child => child.isLineSegments);
                        if (lineSegments) {
                            lineSegments.material = lineSegments.material.clone();
                            lineSegments.material.color = new Color(colors.edges);
                        }

                        gsap.to(obj.rotation, {
                            y: 2 * Math.PI,
                            duration: 3,
                            repeat: -1,
                            ease: "none",
                        });
                        this.interactionManager.add(obj);
                        obj.userData = {...item, type}; // 添加类型信息到userData
                        // 添加事件
                        obj.addEventListener("click", (event) => {
                            event.stopPropagation();
                            this.handlePointClick(obj, pointLabel, item, type);
                        }, {passive: true});
                        // obj.addEventListener("mouseover", (event) => {
                        //   event.stopPropagation();
                        //   document.body.style.cursor = "pointer";
                        //   // 如果当前点位不是选中状态，应用悬停高亮效果
                        //   if (this.selectedPoint !== obj) {
                        //     this.setPointHoverEffect(obj);
                        //     this.setLabelHoverColor(pointLabel);
                        //   }
                        // }, { passive: true });
                        // obj.addEventListener("mouseout", (event) => {
                        //   document.body.style.cursor = "default";
                        //   // 如果当前点位不是选中状态，移除悬停高亮效果
                        //   if (this.selectedPoint !== obj) {
                        //     this.restorePointHoverEffect(obj);
                        //     this.restoreLabelOriginalColor(pointLabel);
                        //   }
                        // }, { passive: true });
                    }
                }
            });
        });
    }

    //销毁点位
    destroyPoint(type) {
        // 清除选中状态
        this.clearPointSelection();

        // 如果没有指定类型，销毁所有点位
        if (!type) {
            // 移除事件
            this.pointGroup.traverse((obj) => {
                if (obj.isMesh && obj.name === "锥体") {
                    this.interactionManager.remove(obj);
                }
            });

            // 清理点位名称标签 - 使用数组来安全地清理
            if (this.allPointLabel && this.allPointLabel.length > 0) {
                this.allPointLabel.forEach((label) => {
                    if (label && label.parent) {
                        label.parent.remove(label);
                    }
                });
            }

            emptyObject(this.pointGroup);
            this.allPointLabel = [];
            return;
        }

        // 按类型销毁点位
        const childrenToRemove = [];
        const labelsToRemove = [];

        this.pointGroup.traverse((obj) => {
            if (obj.isMesh && obj.name === "锥体" && obj.userData && obj.userData.type === type) {
                this.interactionManager.remove(obj);
                childrenToRemove.push(obj.parent); // 添加父级对象到删除列表
            }
        });

        // 清理对应类型的标签
        if (this.allPointLabel && this.allPointLabel.length > 0) {
            this.allPointLabel.forEach((label) => {
                if (label && label.name && label.name.includes(type)) {
                    labelsToRemove.push(label);
                }
            });
        }

        // 移除点位对象
        childrenToRemove.forEach((child) => {
            if (child && child.parent) {
                child.parent.remove(child);
            }
        });

        // 移除标签
        labelsToRemove.forEach((label) => {
            if (label && label.parent) {
                label.parent.remove(label);
                // 从数组中移除
                const index = this.allPointLabel.indexOf(label);
                if (index > -1) {
                    this.allPointLabel.splice(index, 1);
                }
            }
        });
    }

    // 处理点位点击事件
    handlePointClick(obj, pointLabel, item, type) {
        console.log('handlePointClick 被调用:', { obj: !!obj, pointLabel: !!pointLabel, item, type });
        if (this.selectedPoint === obj || this.selectedPointLabel === pointLabel) {
            console.log('清除选中状态');
            this.clearPointSelection();
            return;
        }
        this.clearPointSelection();
        this.selectPoint(obj, pointLabel, item, type);
        //实现行政区域高亮的效果
        this.highlightMapRegion(item);
        //实现弹窗，用于展示监控列表
        this.showMonitorPopup(item);
    }

    // 显示监控弹窗
    showMonitorPopup(item) {
        console.log("showMonitorPopup", item);
        // 发送事件到主页面显示监控弹窗
        emitter.$emit("showMonitorPopup", {
            visible: true,
            pointData: item
        });
    }

    // 选中点位
    selectPoint(obj, pointLabel, item, type) {
        console.log('selectPoint 被调用:', { obj: !!obj, pointLabel: !!pointLabel, item, type });
        this.selectedPoint = obj;
        this.selectedPointLabel = pointLabel;
        // 改变选中点位的效果（使用简单高亮）
        if (obj) {
            console.log('设置3D对象高亮效果');
            this.setPointSelectedEffect(obj);
        } else {
            console.log('没有3D对象，跳过3D高亮效果');
        }

        // 改变标签颜色
        console.log('设置标签高亮颜色');
        this.setLabelSelectedColor(pointLabel);

        // 发送选中事件
        const pointName = obj && obj.userData ? obj.userData.name : item.name;
        console.log('发送pointSelected事件:', {id: item.id, name: pointName, data: item, type: type});
        emitter.$emit("pointSelected", {id: item.id, name: pointName, data: item, type: type});
    }

    // 清除点位选中状态
    clearPointSelection() {
        if (this.selectedPoint) {
            // 恢复原色（使用简单恢复）
            this.restorePointHoverEffect(this.selectedPoint);
            this.selectedPoint = null;
        }

        if (this.selectedPointLabel) {
            // 恢复标签原色
            this.restoreLabelOriginalColor(this.selectedPointLabel);
            this.selectedPointLabel = null;
        }

        // 清除地图区域高亮
        this.clearMapRegionHighlight();
    }

    // 设置点位选中效果（类似createEvent的简单高亮）
    setPointSelectedEffect(obj) {
        obj.traverse((child) => {
            if (child.isMesh) {
                // 保存原始材质
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material;
                }
                // 创建选中材质（更明显的高亮）
                const selectedMaterial = child.material.clone();
                selectedMaterial.opacity = Math.min(child.material.opacity + 0.5, 1.0);
                child.material = selectedMaterial;
            }
        });
    }

    // 恢复点位悬停效果
    restorePointHoverEffect(obj) {
        obj.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
            }
        });
    }

    // 设置标签选中颜色
    setLabelSelectedColor(pointLabel) {
        console.log('setLabelSelectedColor 被调用:', { pointLabel: !!pointLabel, element: !!(pointLabel && pointLabel.element) });
        if (pointLabel && pointLabel.element) {
            const wrapElement = pointLabel.element.querySelector('.point-name-label-wrap');
            console.log('找到wrapElement:', !!wrapElement);
            if (wrapElement) {
                wrapElement.style.filter = 'brightness(1.5) saturate(1.5)';
                console.log('标签高亮效果已应用');
            }
        }
    }

    // 恢复标签原始颜色
    restoreLabelOriginalColor(pointLabel) {
        if (pointLabel && pointLabel.element) {
            const wrapElement = pointLabel.element.querySelector('.point-name-label-wrap');
            if (wrapElement) {
                wrapElement.style.filter = '';
            }
        }
    }

    // 高亮地图区域
    highlightMapRegion(item) {
        this.clearMapRegionHighlight();
        // 根据点位数据查找对应的地图区域
        const targetRegion = this.findMapRegionByPointData(item);
        if (targetRegion) {
            console.log('找到匹配的地图区域:', targetRegion.userData.name);
            this.selectedMapRegion = targetRegion;
            this.highlightMapRegionMesh(targetRegion);
        } else {
            console.log('未找到匹配的地图区域，点位数据:', item);
        }
    }

    // 根据点位数据查找对应的地图区域
    findMapRegionByPointData(item) {
        // 优先使用 town 字段匹配
        if (item.town) {
            return this.findMapRegionByName(item.town);
        }

        // 如果没有 town 字段，尝试使用 name 字段
        if (item.name) {
            return this.findMapRegionByName(item.name);
        }

        // 如果都没有，尝试使用 county 字段
        if (item.county) {
            return this.findMapRegionByName(item.county);
        }

        return null;
    }

    // 根据名称查找地图区域
    findMapRegionByName(name) {
        // 遍历所有地图区域，查找匹配的区域
        for (let i = 0; i < this.eventElement.length; i++) {
            const mesh = this.eventElement[i];
            if (mesh.userData && mesh.userData.name) {
                if (mesh.userData.name === name) {
                    console.log('找到匹配的区域!');
                    return mesh;
                }
            }
        }
        return null;
    }

    // 高亮指定的地图区域网格
    highlightMapRegionMesh(mesh) {
        if (!mesh || !this.defaultLightMaterial) return;
        mesh.traverse((obj) => {
            if (obj.isMesh) {
                // 保存原始材质
                if (!obj.userData.originalMapMaterial) {
                    obj.userData.originalMapMaterial = obj.material;
                }
                // 应用高亮材质
                obj.material = this.defaultLightMaterial;
            }
        });
        
        // 高亮选中区域的地图线颜色
        // this.highlightRegionLines(mesh);
    }
    
    // 高亮选中区域的地图线
    highlightRegionLines(mesh) {
        if (!this.mapLine || !this.mapLine.lineGroup) return;
        
        // 获取选中区域的几何顶点
        const regionVertices = this.getRegionVertices(mesh);
        if (!regionVertices || regionVertices.length === 0) {
            console.log('无法获取区域顶点');
            return;
        }
        
        console.log(`区域顶点数量: ${regionVertices.length}`);
        console.log('区域顶点示例:', regionVertices.slice(0, 3)); // 显示前3个顶点作为示例
        let highlightedCount = 0;
        
        // 遍历地图线组，找到真正属于选中区域的线条
        let totalLines = 0;
        this.mapLine.lineGroup.traverse((obj) => {
            if (obj.isGroup && obj.name && obj.name.startsWith('meshLineGroup')) {
                obj.traverse((lineObj) => {
                    if (lineObj.isMesh) {
                        totalLines++;
                        // 检查线条是否真正属于选中区域
                        const belongsToRegion = this.isLineBelongsToRegion(lineObj, regionVertices);
                        
                        // 如果几何匹配失败，尝试边界框匹配作为备用
                        let shouldHighlight = belongsToRegion;
                        if (!belongsToRegion) {
                            const regionBox = this.getRegionBoundingBox(mesh);
                            if (regionBox) {
                                shouldHighlight = this.isLineInRegion(lineObj, regionBox);
                                if (shouldHighlight) {
                                    console.log('使用边界框匹配作为备用');
                                }
                            }
                        }
                        
                        if (shouldHighlight) {
                            console.log('找到属于区域的线条，开始高亮');
                            // 保存原始材质
                            if (!lineObj.userData.originalLineMaterial) {
                                lineObj.userData.originalLineMaterial = lineObj.material;
                            }
                            // 创建高亮材质
                            const highlightMaterial = lineObj.material.clone();
                            highlightMaterial.color.setHex(0x31fdfd);
                            lineObj.material = highlightMaterial;
                            highlightedCount++;
                        }
                    }
                });
            }
        });
        
        console.log(`总共检查了 ${totalLines} 条地图线`);
        console.log(`高亮了 ${highlightedCount} 条地图线`);
    }
    
    // 获取区域的几何顶点
    getRegionVertices(mesh) {
        if (!mesh || !mesh.geometry) return null;
        
        const geometry = mesh.geometry;
        const position = geometry.attributes.position;
        
        if (!position) return null;
        
        const vertices = [];
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            vertices.push({ x, y });
        }
        
        return vertices;
    }
    
    // 获取区域的边界框
    getRegionBoundingBox(mesh) {
        if (!mesh || !mesh.geometry) return null;
        
        const geometry = mesh.geometry;
        const position = geometry.attributes.position;
        
        if (!position) return null;
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
        
        return { minX, maxX, minY, maxY };
    }
    
    // 检查线条是否真正属于区域
    isLineBelongsToRegion(lineObj, regionVertices) {
        if (!lineObj.geometry || !lineObj.geometry.attributes.position) {
            console.log('线条没有几何数据或位置属性');
            return false;
        }
        
        const geometry = lineObj.geometry;
        const position = geometry.attributes.position;
        
        // 获取线条的所有顶点
        const lineVertices = [];
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            lineVertices.push({ x, y });
        }
        
        console.log(`检查线条，顶点数量: ${lineVertices.length}`);
        
        // 检查线条的每个顶点是否在区域内
        let verticesInRegion = 0;
        for (const lineVertex of lineVertices) {
            if (this.isPointInPolygon(lineVertex, regionVertices)) {
                verticesInRegion++;
            }
        }
        
        // 如果线条的大部分顶点都在区域内，则认为属于该区域
        const ratio = verticesInRegion / lineVertices.length;
        const belongsToRegion = ratio > 0.3; // 30%以上的顶点在区域内（降低阈值）
        
        console.log(`线条匹配结果: ${verticesInRegion}/${lineVertices.length} 顶点在区域内 (${(ratio * 100).toFixed(1)}%) - ${belongsToRegion ? '匹配' : '不匹配'}`);
        
        return belongsToRegion;
    }
    
    // 点在多边形内的判断（射线法）
    isPointInPolygon(point, polygon) {
        const x = point.x;
        const y = point.y;
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;
            
            if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        
        return inside;
    }
    
    // 检查线条是否在区域内（旧方法，保留作为备用）
    isLineInRegion(lineObj, regionBox) {
        if (!lineObj.geometry || !lineObj.geometry.attributes.position) return false;
        
        const geometry = lineObj.geometry;
        const position = geometry.attributes.position;
        
        // 计算线条的边界框
        let lineMinX = Infinity, lineMaxX = -Infinity;
        let lineMinY = Infinity, lineMaxY = -Infinity;
        
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const y = position.getY(i);
            
            lineMinX = Math.min(lineMinX, x);
            lineMaxX = Math.max(lineMaxX, x);
            lineMinY = Math.min(lineMinY, y);
            lineMaxY = Math.max(lineMaxY, y);
        }
        
        // 检查线条边界框是否与区域边界框有重叠
        const hasOverlap = !(lineMaxX < regionBox.minX || lineMinX > regionBox.maxX || 
                           lineMaxY < regionBox.minY || lineMinY > regionBox.maxY);
        
        if (!hasOverlap) return false;
        
        // 计算重叠区域
        const overlapX = Math.max(0, Math.min(lineMaxX, regionBox.maxX) - Math.max(lineMinX, regionBox.minX));
        const overlapY = Math.max(0, Math.min(lineMaxY, regionBox.maxY) - Math.max(lineMinY, regionBox.minY));
        const overlapArea = overlapX * overlapY;
        
        const lineArea = (lineMaxX - lineMinX) * (lineMaxY - lineMinY);
        const regionArea = (regionBox.maxX - regionBox.minX) * (regionBox.maxY - regionBox.minY);
        
        // 更严格的匹配条件：
        // 1. 线条的重叠面积必须占线条面积的50%以上
        // 2. 或者线条的重叠面积必须占区域面积的20%以上
        const lineOverlapRatio = lineArea > 0 ? overlapArea / lineArea : 0;
        const regionOverlapRatio = regionArea > 0 ? overlapArea / regionArea : 0;
        
        // 同时检查线条中心点是否在区域内
        const lineCenterX = (lineMinX + lineMaxX) / 2;
        const lineCenterY = (lineMinY + lineMaxY) / 2;
        const centerInRegion = lineCenterX >= regionBox.minX && lineCenterX <= regionBox.maxX && 
                              lineCenterY >= regionBox.minY && lineCenterY <= regionBox.maxY;
        
        // 只有满足以下条件之一才匹配：
        // 1. 线条中心在区域内且重叠比例足够高
        // 2. 线条与区域有很高的重叠比例
        const isMatch = (centerInRegion && (lineOverlapRatio > 0.3 || regionOverlapRatio > 0.15)) ||
                       (lineOverlapRatio > 0.6 || regionOverlapRatio > 0.3);
        
        if (isMatch) {
            console.log(`线条匹配: 中心在区域内=${centerInRegion}, 线条重叠比例=${lineOverlapRatio.toFixed(3)}, 区域重叠比例=${regionOverlapRatio.toFixed(3)}`);
        }
        
        return isMatch;
    }

    // 清除地图区域高亮
    clearMapRegionHighlight() {
        if (this.selectedMapRegion) {
            this.restoreMapRegionMesh(this.selectedMapRegion);
            this.selectedMapRegion = null;
        }
    }

    // 恢复地图区域网格原始材质
    restoreMapRegionMesh(mesh) {
        if (!mesh) return;

        mesh.traverse((obj) => {
            if (obj.isMesh && obj.userData.originalMapMaterial) {
                obj.material = obj.userData.originalMapMaterial;
            }
        });
        
        // 恢复选中区域的地图线原始颜色
        this.restoreRegionLines(mesh);
    }
    
    // 恢复选中区域的地图线原始颜色
    restoreRegionLines(mesh) {
        if (!this.mapLine || !this.mapLine.lineGroup) return;
        
        // 获取选中区域的几何顶点
        const regionVertices = this.getRegionVertices(mesh);
        if (!regionVertices || regionVertices.length === 0) return;
        
        // 遍历地图线组，恢复真正属于选中区域的线条
        this.mapLine.lineGroup.traverse((obj) => {
            if (obj.isGroup && obj.name && obj.name.startsWith('meshLineGroup')) {
                obj.traverse((lineObj) => {
                    if (lineObj.isMesh) {
                        // 检查线条是否真正属于选中区域
                        if (this.isLineBelongsToRegion(lineObj, regionVertices)) {
                            // 恢复原始材质
                            if (lineObj.userData.originalLineMaterial) {
                                lineObj.material = lineObj.userData.originalLineMaterial;
                            }
                        }
                    }
                });
            }
        });
    }

    geoProjection(args) {
        return geoMercator()
            .center(this.geoProjectionCenter)
            .scale(this.geoProjectionScale)
            .translate([0, 0])(args);
    }

    update(delta) {
        super.update(delta);
        this.interactionManager && this.interactionManager.update();
        if (this.allGuangquan.length) {
            this.allGuangquan.map((quan) => {
                quan.update(delta);
            });
        }
        if (this.flylineTexture) {
            this.flylineTexture.offset.x += 0.006;
        }
    }

    destroy() {
        super.destroy();
        this.label3d && this.label3d.destroy();
    }
}
