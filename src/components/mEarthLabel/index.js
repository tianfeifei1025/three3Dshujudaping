import {
  Group,
  Vector3,
  DoubleSide,
  FileLoader,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  SpriteMaterial,
  Sprite,
  SRGBColorSpace,
  Raycaster,
  PlaneGeometry,
  AdditiveBlending,
  Fog,
  Color,
} from "three";
import * as THREE from "three";

import { Mini3d, Label3d } from "@/mini3d";
import { geoSphereCoord, generateGrid } from "./utils";

import pointIconBg from "./icon-bg.png";
import { Assets } from "./assets";


export class App extends Mini3d {
  constructor(canvas, config) {
    super(canvas, config);
    this.sizes.pixelRatio = 1
    this.onComplete = config.onComplete || function(){}
    this.renderer.resize()
    // 自动旋转
    this.camera.controls.autoRotate = true;
    this.camera.controls.autoRotateSpeed = 2;
    this.camera.controls.enableZoom = false;
    this.camera.controls.enablePan = false;
    this.camera.controls.enableRotate = false;
    this.guiParams = {
      dyColor: 0x155dbc, //动态光颜色
      fogColor: 0x05234e, //雾背景颜色
      earthColor: 0x00ebc4, //0x9facc1,//地球颜色
      earthPointColor: 0x1c3b6d, //外层地球点颜色
    };
    this.camera.instance.position.set(
      -37.761130667160806,
      125.31600026791556,
      -389.90872591076163
    );

    this.scene.fog = new Fog(new Color(this.guiParams.fogColor), 1, 1500);
    this.renderer.instance.setClearColor(0x000000, 0);
    // 射线拾取
    this.raycaster = new Raycaster();
    this.initScene();
  }

  async initScene() {
    this.initAssets(async () => {
      // 创建组
      this.sceneGroup = new Group();
      this.scene.add(this.sceneGroup);
      // 标签组
      this.labelGroup = new Group();
      this.sceneGroup.add(this.labelGroup);
      this.initEarth();
      await this.initEarthPoint();
      this.initRing();
      this.initGoguang();
      this.initGoguang2();
      // this.initLabel();
      // 射线检测
      this.checkIntersect();
      if(this.onComplete){
        this.onComplete()
      }
    });
  }
  initEarth() {
    let geometry = new SphereGeometry(100, 32, 32);
    let map = this.assets.getResource("earthBlue");
    map.colorSpace = SRGBColorSpace;
    let material = new MeshBasicMaterial({
      color: this.guiParams.earthColor,
      map: map,
      fog: false,
      transparent: true,
    });
    this.earthMaterial = material;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
            varying vec3 vPosition;
            void main() {
            vPosition = position;
            `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
            varying vec3 vPosition;
            void main() {
            `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        /* glsl */ `
              // 几何体的高度
              float geometryHeight = 200.0; 
              // 一半的位置
              float middleY = geometryHeight / 2.0;
              diffuseColor.a = 1.0;
              // 计算透明度
              // if (vPosition.y < middleY) {
              //     // 计算从中间到底部的透明度变化
              //     diffuseColor.a = mix(1.0, 0.0, (middleY - vPosition.y) / middleY);
              // }
              diffuseColor.a = mix(1.0, 0.0, 1.0-vPosition.y/ 100.0);
              gl_FragColor = vec4( outgoingLight,diffuseColor.a  );
              `
      );
    };
    let mesh = new Mesh(geometry, material);
    mesh.name = "earth";
    this.sceneGroup.add(mesh);
    this.time.on("tick", (delta, elapsedTime) => {
      mesh.rotation.y += delta * 0.05;
    });
  }
  initGoguang() {
    const highLight = this.assets.getResource("gaoguang");
    highLight.colorSpace = SRGBColorSpace;
    let material = new SpriteMaterial({
      color: 0x396ee0,
      map: highLight,
      transparent: true,
      fog: false,
      alphaMap: highLight,
      depthTest: false,
      blending: AdditiveBlending,
      opacity: 1,
    });

    let gaoguang = new Sprite(material);
    gaoguang.position.set(0, 0, 0);
    gaoguang.scale.set(100 * 2.5, 100 * 2.5, 0);
    gaoguang.renderOrder = 2;
    this.sceneGroup.add(gaoguang);
  }
  initGoguang2() {
    let material = new SpriteMaterial({
      color: 0x396ee0,
      transparent: true,
      fog: false,
      depthTest: false,
      blending: AdditiveBlending,
      opacity: 1,
    });
    // 通过shader调整透明度

    material.onBeforeCompile = (shader) => {
      material.__shader = shader;
      shader.uniforms = {
        ...shader.uniforms,
        uTime: {
          value: 0,
        },
        uColor: {
          value: new Color(this.guiParams.dyColor),
        },
      };
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
                varying vec2 vUv;
                void main() {
                   vUv = uv;
              `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
                #define TAU 6.2831852
                #define MOD3 vec3(.1031,.11369,.13787)

                uniform float uTime;
                uniform vec3 uColor;
                varying vec2 vUv;

                vec3 hash33(vec3 p3)
                {
                    p3 = fract(p3 * MOD3);
                    p3 += dot(p3, p3.yxz+19.19);
                    return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
                }

                float simplex_noise(vec3 p)
                {
                    const float K1 = 0.333333333;
                    const float K2 = 0.166666667;
                    
                    vec3 i = floor(p + (p.x + p.y + p.z) * K1);
                    vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
                        
                    vec3 e = step(vec3(0.0), d0 - d0.yzx);
                    vec3 i1 = e * (1.0 - e.zxy);
                    vec3 i2 = 1.0 - e.zxy * (1.0 - e);
                    
                    vec3 d1 = d0 - (i1 - 1.0 * K2);
                    vec3 d2 = d0 - (i2 - 2.0 * K2);
                    vec3 d3 = d0 - (1.0 - 3.0 * K2);
                    
                    vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
                    vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
                    
                    return dot(vec4(31.316), n);
                }
                void main() {
              `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        /* glsl */ `
              // 将 UV 坐标从 [0, 1] 范围转换到 [-1, 1] 范围，并根据平面的宽高比进行调整，以避免图形变形
              vec2 uv = vUv * 2.0 - vec2(1.0); 
              
              // 定义圆形的中心，位于平面中心
              vec2 center = vec2(0.0);

              // 计算当前点到圆形中心的距离
              float distToCenter = distance(uv, center);

              // 定义圆形的半径和边缘宽度
              float radius = 0.3;
              float edgeWidth = 0.3;

              // 判断是否在圆环范围内
              if (abs(distToCenter - radius) > edgeWidth) {
                  // 如果不在圆环范围内，设置颜色为透明
                  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
              } else {
                  // 计算当前点相对于圆心的角度
                  float angle = atan(uv.y - center.y, uv.x - center.x);

                  // 定义一个阈值，用于划分圆环的一半
                  float angleThreshold = 0.0;

                  // 判断是否在指定的半圆范围内
                  if (angle < angleThreshold) {
                      // 如果不在指定的半圆范围内，设置颜色为透明
                      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                  } else {
                      float a = sin(atan(uv.y, uv.x));
                      float am = abs(a - 0.5) / 4.0;
                      float l = length(uv);

                      float m1 = clamp(0.1 / smoothstep(0.0, 1.75, l), 0.0, 1.0);
                      float m2 = clamp(0.1 / smoothstep(0.42, 0.0, l), 0.0, 1.0);
                      float s1 = (simplex_noise(vec3(uv * 2.0, 1.0 + uTime * 0.525)) * (max(1.0 - l * 1.75, 0.0)) + 0.9);
                      float s2 = (simplex_noise(vec3(uv * 1.0, 15.0 + uTime * 0.525)) * (max(0.0 + l * 1.0, 0.025)) + 1.25);
                      float s3 = (simplex_noise(vec3(vec2(am, am * 100.0 + uTime * 1.0) * 0.15, 30.0 + uTime * 0.525)) * (max(0.0 + l * 1.0, 0.025)) + 1.25);
                      s3 *= smoothstep(0.0, 0.3345, l);

                      float sh = smoothstep(0.15, 0.35, l);
                      float sh2 = smoothstep(0.75, 0.3, l);

                      float m = m1 * m2 * ((s1 * s2 * s3) * (1.0 - l)) * sh * sh2;
                      m = m * m;
                      vec3 color = vec3(m);
                      color = color * uColor;

                      // 计算透明度因子，从中间到底部透明度逐渐变为 0
                      float alphaFactor = smoothstep(0.5, 1.0, vUv.y)*3.0;

                      // 设置最终的片段颜色，包含透明度
                      gl_FragColor = vec4(color, m * alphaFactor);
                  }
              }
              `
      );
    };

    this.time.on("tick", (delta, elapsedTime) => {
      if (material.__shader.uniforms.uTime) {
        material.__shader.uniforms.uTime.value = elapsedTime;
      }
    });
    let gaoguang = new Sprite(material);
    gaoguang.position.set(0, 0, 0);
    gaoguang.scale.set(100 * 6, 100 * 6, 0);
    gaoguang.renderOrder = 2;
    this.sceneGroup.add(gaoguang);
  }
  initRing() {
    this.ringGroup = new Group();
    this.sceneGroup.add(this.ringGroup);

    let geometry = new PlaneGeometry(480, 480);
    // 圆环1
    let ring01 = this.assets.getResource("ring01");
    let ring01Material = new MeshBasicMaterial({
      color: 0x12457a,
      side: DoubleSide,
      map: ring01,
      fog: true,
      transparent: true,
      opacity: 0.5,
    });
    let ring01Mesh = new Mesh(geometry, ring01Material);
    ring01Mesh.rotation.x = -Math.PI / 2;
    this.ringGroup.add(ring01Mesh);

    // 圆环2
    let ring02 = this.assets.getResource("ring02");
    let ring02Material = new MeshBasicMaterial({
      color: 0x0b4974,
      side: DoubleSide,
      map: ring02,
      fog: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.3,
    });
    let ring02Mesh = new Mesh(geometry, ring02Material);
    ring02Mesh.position.y += 0.1;
    ring02Mesh.rotation.x = -Math.PI / 2;
    this.ringGroup.add(ring02Mesh);

    // 圆环3
    let ring03 = this.assets.getResource("ring03");
    let ring03Material = new MeshBasicMaterial({
      color: 0x12457a,
      side: DoubleSide,
      map: ring03,
      fog: true,
      transparent: true,
      depthWrite: false,
      opacity: 1,
    });
    let ring03Mesh = new Mesh(geometry, ring03Material);
    ring03Mesh.position.y += 0.2;
    ring03Mesh.rotation.x = -Math.PI / 2;
    this.ringGroup.add(ring03Mesh);

    // 圆环4
    let ring04 = this.assets.getResource("ring04");
    let ring04Material = new MeshBasicMaterial({
      map: ring04,
      fog: true,
      transparent: true,
      depthWrite: false,
      opacity: 1,
    });
    let ring04Mesh = new Mesh(geometry, ring04Material);
    ring04Mesh.position.y += 0.2;
    ring04Mesh.scale.set(1.15,1.15,1.15)
    ring04Mesh.rotation.x = -Math.PI / 2;
    this.ringGroup.add(ring04Mesh);
    

    this.time.on("tick", (delta, elapsedTime) => {
      ring01Mesh.rotation.z += delta * 0.1;
      ring03Mesh.rotation.z -= delta;
      ring04Mesh.rotation.z += delta;
    });
  }

  initLabel(labelArr=[]) {
    const radius = 200; // 半径200
    
    const count = labelArr.length; // 统计数量
    this.label3d = new Label3d(this);
    labelArr.forEach((data, i) => {
      // 计算每个立方体的角度
      const angle = (i / count) * 2 * Math.PI;
      // 计算 x 和 z 坐标
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      let label = this.label3d.create("", "earth-point", true);
      label.init(
        `
      
          <div class="earth-point-wrap">
            <div class="earth-point-text">
              <span class="label">${data.name}</span>
              <span class="value">${data.value}</span>
              <span class="unit">${data.unit}</span>
            </div>
            <img class="earth-point-icon" src="${data.icon}" />
            <img class="earth-point-icon-bg" src="${pointIconBg}" />
          </div>
      
        `,
        new Vector3(x, -10, z)
      );
      label.setParent(this.labelGroup);
    });
  }
  // 射线检测
  checkIntersect() {
    this.time.on("tick", (delta) => {
      // this.labelGroup.rotation.y += delta;
      if (!this.labelGroup.children.length) return false;
      this.labelGroup.children.forEach((point) => {
        // 获取点坐标
        const screenPoint = point.position.clone();
        // 将此向量(坐标)从世界空间投影到相机的标准化设备坐标 (NDC) 空间
        screenPoint.project(this.camera.instance);

        // 射线拾取，判断相交隐藏显示点位
        this.raycaster.setFromCamera(screenPoint, this.camera.instance);
        // 跟this.collisionGroup进行碰撞比较
        let checkObj = this.sceneGroup.getObjectByName("earth");
        const intersects = this.raycaster.intersectObject(checkObj);

        if (intersects.length === 0) {
          point.element
            .querySelector(".earth-point-wrap")
            .classList.add("visible");
        } else {
          // 相交距离
          const intersectDistance = intersects[0].distance;
          // 点到相机的距离
          const distance = point.position.distanceTo(
            this.camera.instance.position
          );
          // 如果相交的距离小于点到相机的距离   就隐藏
          if (intersectDistance < distance) {
            point.element
              .querySelector(".earth-point-wrap")
              .classList.remove("visible");
          } else {
            point.element
              .querySelector(".earth-point-wrap")
              .classList.add("visible");
          }
        }
      });
    });
  }
  async initEarthPoint() {
    // 获取json文件
    let geoJson = await this.requestData(import.meta.env.BASE_URL+"/assets/json/world.json");
    // 转换数据
    let worldData = this.transfromGeoJSON(geoJson);
    // 生成地球点
    let points = this.earthPoints(worldData);
    this.sceneGroup.add(points);
    this.time.on("tick", (delta, elapsedTime) => {
      points.rotation.y += delta * 0.05;
    });
  }
  // 请求文件
  async requestData(url) {
    try {
      // 文件加载器
      const loader = new FileLoader();
      // 请求数据
      let data = await loader.loadAsync(url, (event) => {
        let { loaded, total } = event;
        let progress = ((loaded / total) * 100).toFixed(0);
        // console.log("file progress", progress);
      });
      // 数据转换-字符转为json
      data = JSON.parse(data);

      return data;
    } catch (error) {
      console.log(error);
    }
  }
  // 转换数据
  transfromGeoJSON(worldData) {
    let features = worldData.features;
    for (let i = 0; i < features.length; i++) {
      const element = features[i];
      // 将Polygon处理跟MultiPolygon一样的数据结构
      if (element.geometry.type === "Polygon") {
        element.geometry.coordinates = [element.geometry.coordinates];
      }
    }
    return worldData;
  }
  // 网格点
  earthPoints(worldData) {
    let features = worldData.features;
    let allPoints = [];
    let pointsArr = [];
    for (let i = 0; i < features.length; i++) {
      // 坐标
      let coordinates = features[i].geometry.coordinates;
      coordinates.forEach((item) => {
        // 获取集合体的索引和坐标
        let countryCoords = [];
        let coordinates = item[0];
        for (let i = 0; i < coordinates.length; i++) {
          countryCoords.push(
            new THREE.Vector3(coordinates[i][0], coordinates[i][1], 0)
          );
        }
        // 生成内部的网格点
        let { scopeInsidePoint } = generateGrid(countryCoords, 1);
        allPoints.push(...scopeInsidePoint);
      });
    }

    allPoints.forEach((item) => {
      let { x, y, z } = geoSphereCoord(130, item.x, item.y);
      pointsArr.push(new THREE.Vector3(x, y, z));
    });
    let geo = new THREE.BufferGeometry().setFromPoints(pointsArr);
    // 点大小和颜色
    let material = new THREE.PointsMaterial({
      size: 1,
      color: 0x1c3b6d,
      fog: false,
      transparent: true,
    });
    this.earthPointsMaterial = material;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "void main() {",
        `
            varying vec3 vPosition;
            void main() {
            vPosition = position;
            `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `
            varying vec3 vPosition;
            void main() {
            `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        /* glsl */ `
              
              diffuseColor.a = 1.0;
              // 计算透明度
             
              diffuseColor.a = mix(1.0, 0.0, 1.0-vPosition.y/ 130.0);
              gl_FragColor = vec4( outgoingLight,diffuseColor.a  );
              `
      );
    };
    let point = new THREE.Points(geo, material);
    return point;
  }
  // 资源
  initAssets(onLoadCallback) {
    this.assets = new Assets(onLoadCallback).instance;
  }

  update(delta, elapsedTime) {
    super.update(delta, elapsedTime);
    // console.log(this.camera.instance.position);
  }
}
