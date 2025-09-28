import { Resource } from "@/mini3d";
import { FileLoader } from "three";
// 地图
import bg from "@/assets/texture/map/mapBg2.png";
import side from "@/assets/texture/map/side.png";
import face from "@/assets/texture/map/face3.png";
import faceGlow from "@/assets/texture/map/faceGlow.png";
import tenLine from "@/assets/texture/10.png";
// import quan1 from "@/assets/texture/map/quan1.png";
// import quan2 from "@/assets/texture/map/quan2.png";
// import quan3 from "@/assets/texture/map/quan3.png";
import quan4 from "@/assets/texture/map/quan4.png";
import quan1 from "@/assets/texture/map/quan/quan1.png";
import quan2 from "@/assets/texture/map/quan/quan2.png";
import quan3 from "@/assets/texture/map/quan/quan3.png";
import diffuse from "@/assets/texture/map/diffuse.png";
import mapFlyline from "@/assets/texture/flyline11.png";

import particle from "@/assets/texture/particle.png";

import pathLine from "@/assets/texture/pathLine4.png";
import pathLine3 from "@/assets/texture/pathLine2.png";
import pathLine2 from "@/assets/texture/pathLine.png";

import arrow from "@/assets/texture/arrow.png";
import flyLineFocus from "@/assets/texture/guangquan01.png";
import iconQidian from "@/assets/texture/icon-qidian.png";
import iconZhongdian from "@/assets/texture/icon-zhongdian.png";
// 焦点贴图
import focusArrowsTexture from "@/assets/texture/focus/focus_arrows.png";
import focusBarTexture from "@/assets/texture/focus/focus_bar.png";
import focusBgTexture from "@/assets/texture/focus/focus_bg.png";
import focusMidQuanTexture from "@/assets/texture/focus/focus_mid_quan.png";
import focusMoveBgTexture from "@/assets/texture/focus/focus_move_bg.png";
import pointModel from "@/assets/model/棱锥.glb";
import pointModelTexture2 from "@/assets/model/jb2.png";
export class Assets {
  constructor() {
    this.init();
  }
  init() {
    this.instance = new Resource();
    // 添加Fileloader
    this.instance.addLoader(FileLoader, "FileLoader");

    // 资源加载
    let base_url = import.meta.env.BASE_URL;
    let assets = [
      { type: "GLTF", name: "pointModel", path: pointModel },
      { type: "Texture", name: "pointModelTexture2", path: pointModelTexture2 },
      { type: "Texture", name: "bg", path: bg },
      { type: "Texture", name: "face", path: face },
      { type: "Texture", name: "faceGlow", path: faceGlow },
      { type: "Texture", name: "tenLine", path: tenLine },
      { type: "Texture", name: "side", path: side },
      { type: "Texture", name: "quan1", path: quan1 },
      { type: "Texture", name: "quan2", path: quan2 },
      { type: "Texture", name: "quan3", path: quan3 },
      { type: "Texture", name: "quan4", path: quan4 },
      { type: "Texture", name: "diffuse", path: diffuse },
      { type: "Texture", name: "mapFlyline", path: mapFlyline },
      { type: "Texture", name: "particle", path: particle },
      //
      { type: "Texture", name: "iconQidian", path: iconQidian },
      { type: "Texture", name: "iconZhongdian", path: iconZhongdian },
      { type: "Texture", name: "flyline", path: pathLine },
      { type: "Texture", name: "pathLine", path: pathLine },
      { type: "Texture", name: "pathLine2", path: pathLine2 },
      { type: "Texture", name: "pathLine3", path: pathLine3 },

      {
        type: "File",
        name: "mapJson",
        path: base_url + "assets/json/rangtangquyu.json",
      },
      {
        type: "File",
        name: "mapStroke",
        path: base_url + "assets/json/rangtangbianjie.json",
      },
      {
        type: "File",
        name: "hotmapData",
        path: base_url + "assets/json/hotPoint.geojson",
      },
      { type: "Texture", name: "flyLineFocus", path: flyLineFocus },

      { type: "Texture", name: "arrow", path: arrow },

      // focus
      { type: "Texture", name: "focusArrows", path: focusArrowsTexture },
      { type: "Texture", name: "focusBar", path: focusBarTexture },
      { type: "Texture", name: "focusBg", path: focusBgTexture },
      { type: "Texture", name: "focusMidQuan", path: focusMidQuanTexture },
      { type: "Texture", name: "focusMoveBg", path: focusMoveBgTexture },
    ];
    // 资源加载
    this.instance.loadAll(assets);
  }
}
