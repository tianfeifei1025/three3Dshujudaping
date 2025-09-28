import {
  Group,
  RepeatWrapping,
  Vector3,
  DoubleSide,
  TextureLoader,
  Mesh,
  Shape,
  ExtrudeGeometry,
  MeshLambertMaterial,
  DirectionalLight,
  AmbientLight,
  MeshBasicMaterial,
  PlaneGeometry,
  Color,
} from "three";
import * as THREE from "three";

import { Mini3d } from "@/mini3d";
import gsap from "gsap";
import ring1 from "./texture/pie-ring1.png";
import ring2 from "./texture/pie-ring2.png";
import ring3 from "./texture/pie-ring3.png";
import ring4 from "./texture/pie-ring4.png";
const defaultOpt = {
  opacity: 1,
  delay: 5000,
  colors: ["#17E6C3", "#40CFFF", "#1979FF", "#FFC472"],
};

export class App extends Mini3d {
  constructor(canvas, config = defaultOpt) {
    super(canvas, config);
    this.sizes.pixelRatio = 1
    this.renderer.resize()
    this.initLight();
    // 禁用控制器
    this.camera.controls.enableZoom = false;
    this.camera.controls.enablePan = false;
    this.camera.controls.enableRotate = false;
    
    this.renderer.instance.setClearColor(0x000000, 0);
    this.camera.controls.target.set(0, -0.5, 0);
    this.camera.instance.position.set(
      3.6066795409421153,
      2.897014206873088,
      3.6590447102049475
    );
    this.opacity = this.config.opacity || defaultOpt.opacity;
    this.delay = this.config.delay || defaultOpt.delay;
    this.colors = this.config.colors || defaultOpt.colors;

    this.pieGroup = new Group();
    this.scene.add(this.pieGroup);
    this.count = 0;
    this.timer = null;
    this.activeIndex = 0;
  }
  createPie(_data) {
    let data = _data;
    this.data = data;
    let startAngle = 0;
    let endAngle = 0;
    this.count = data
      .map((item) => item.value)
      .reduce((prev, current) => prev + current, 0);
    for (var i = 0; i < data.length; i++) {
      let percent = data[i].value / this.count;
      if (i == 0) {
        startAngle = 0;
      } else {
        startAngle = endAngle + 0.0001;
      }
      endAngle = endAngle + 2 * Math.PI * percent - 0.0001;

      let ring = this.addRing({
        startAngle: startAngle,
        endAngle: endAngle,
        color: new Color(this.colors[i % this.colors.length]),
      });
      ring.name = "ring" + i;
      this.pieGroup.add(ring);
    }

    this.chooseRing(this.activeIndex, true);

    this.timer = setInterval(() => {
      this.loopChange();
    }, this.delay);

    this.createPlane({
      url: ring1,
      width: 8.2,
      position: new THREE.Vector3(0, 0, -0.01),
      animate: true,
      dir: 1,
      duration: 5,
      opacity: 0.6,
      color: "#ffffff",
    });
    this.createPlane({
      url: ring2,
      width: 6,
      position: new THREE.Vector3(0, 0, -0.02),
      animate: true,
      dir: -1,
      duration: 20,
      color: "#052B4F",
    });
    this.createPlane({
      url: ring3,
      width: 6,
      position: new THREE.Vector3(0, 0, -0.03),
      animate: true,
      dir: -1,
      duration: 10,
      color: "#094277",
    });
    this.createPlane({
      url: ring4,
      width: 5.5,
      position: new THREE.Vector3(0, 0, -0.03),
      animate: true,
      dir: 1,
      duration: 10,
      color: "#2874A8",
    });
  }
  addRing(opt = {}) {
    let defaultOpt = {
      innerRadius: 1.6, // 内圆半径
      outerRadius: 2, // 外援半径
      thickness: 0.4, // 厚度
      startAngle: 0,
      endAngle: Math.PI / 2,
      color: 0x00ffff,
      segments: 120,
    };
    let options = Object.assign(defaultOpt, opt);
    // 外层
    let outerShape = new Shape();
    outerShape.arc(
      0,
      0,
      options.outerRadius,
      options.startAngle,
      options.endAngle
    );
    let outerPoints = outerShape.getPoints(options.segments);
    // 内层：需要把开始结束角度调换下，并反向绘制
    let innerShape = new Shape();
    innerShape.arc(
      0,
      0,
      options.innerRadius,
      options.endAngle,
      options.startAngle,
      true
    );
    let innerPoints = innerShape.getPoints(options.segments);
    // 组合内外侧的点，并重新生成shape
    let shape = new Shape(outerPoints.concat(innerPoints));
    // 扩展设置
    //
    const extrudeSettings = {
      steps: 1,
      depth: options.thickness,
      bevelEnabled: true,
      bevelThickness: 0,
      bevelSize: 0,
      bevelOffset: 0,
      bevelSegments: 0,
    };
    const extruGeometry = new ExtrudeGeometry(shape, extrudeSettings);
    let material = new MeshLambertMaterial({
      color: options.color,
      transparent: true,
      opacity: this.opacity,
      side: DoubleSide,
    });
    const mesh = new Mesh(extruGeometry, material.clone());
    mesh.renderOrder = 10;
    mesh.rotation.x = (-1 * Math.PI) / 2;
    return mesh;
  }
  loopChange() {
    let index = this.activeIndex + 1;

    if (index >= this.data.length) {
      index = 0;
    }
    this.chooseRing(index);
  }
  chooseRing(activeIndex = 0, isFirst = false) {
    let prevIndex =
      activeIndex - 1 < 0 ? this.data.length - 1 : activeIndex - 1;
    let prevMesh = this.pieGroup.children[prevIndex];
    this.prevMesh = prevMesh;
    this.activeIndex = activeIndex;
    this.emit("pieRingIndex", activeIndex);
    let chooseMesh = this.pieGroup.children[activeIndex];
    if (!isFirst) {
      gsap.to(prevMesh.scale, { z: 1 });
      gsap.to(prevMesh.material, { opacity: this.opacity });
    }
    gsap.to(chooseMesh.scale, { z: 2 });
    gsap.to(chooseMesh.material, { opacity: 0.8 });
  }
  createPlane(opt) {
    let defaultOpt = {
      url: "",
      width: 5.5,
      z: 0,
      position: new Vector3(0, 0, 0),
      animate: false,
      color: null,
      dir: 1,
      duration: 10,
      opacity: 1,
    };
    let options = Object.assign(defaultOpt, opt);
    const geometry = new PlaneGeometry(options.width, options.width);
    const material = new MeshBasicMaterial({
      map: this.getTexture(options.url),
      transparent: true,
      opacity: options.opacity,
      side: DoubleSide,
      depthTest: false,
    });
    if (options.color) {
      material.color = new Color(options.color);
    }
    const mesh = new Mesh(geometry, material);
    mesh.position.copy(options.position);
    mesh.rotation.x = (-1 * Math.PI) / 2;
    if (options.animate) {
      gsap.to(mesh.rotation, {
        z: 2 * Math.PI * options.dir,
        repeat: -1,
        ease: "none",
        duration: options.duration,
      });
    }
    this.scene.add(mesh);
  }
  getTexture(url) {
    const texture = new TextureLoader().load(url);
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  }
  initLight() {
    //   平行光1
    let directionalLight1 = new DirectionalLight(0xffffff, 3);
    directionalLight1.position.set(200, 300, 200);
    //   平行光2
    let directionalLight2 = new DirectionalLight(0xffffff, 3);
    directionalLight2.position.set(-200, -300, -200);
    // 环境光
    let ambientLight = new AmbientLight(0xffffff, 2);
    // 将光源添加到场景中
    this.scene.add(directionalLight1);
    this.scene.add(directionalLight2);
    this.scene.add(ambientLight);
  }
  update(delta, elapsedTime) {
    super.update(delta, elapsedTime);
    // console.log(this.camera.instance.position);
  }
}
