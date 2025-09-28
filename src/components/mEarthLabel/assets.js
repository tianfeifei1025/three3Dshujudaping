import { Resource } from "@/mini3d";
import { FileLoader } from "three"
import earthBlue from "./earth-blue.png"
import ring01 from "./ring01.png"
import ring02 from "./ring02.png"
import ring03 from "./ring03.png"
import ring04 from "./ring04.png"
import gaoguang from "./gaoguang2.png"


export class Assets {
  constructor(onLoadCallback = null) {
    this.onLoadCallback = onLoadCallback
    this.init()
  }
  init() {
    this.instance = new Resource()
    // 添加Fileloader
    this.instance.addLoader(FileLoader, "FileLoader")
    // 资源加载进度
    this.instance.on("onProgress", (path, itemsLoaded, itemsTotal) => {
      let progress = (itemsLoaded / itemsTotal) * 100
      let bfb = progress.toFixed(2) + "%!"
      // console.log(bfb, path, itemsLoaded, itemsTotal)
    })
    // 资源加载完成事件
    this.instance.on("onLoad", () => {
      // console.log("资源加载完成")
      this.onLoadCallback && this.onLoadCallback()
    })
    // 资源加载
    let assets = [
      { type: "Texture", name: "earthBlue", path: earthBlue },
      { type: "Texture", name: "ring01", path: ring01 },
      { type: "Texture", name: "ring02", path: ring02 },
      { type: "Texture", name: "ring03", path: ring03 },
      { type: "Texture", name: "ring04", path: ring04 },
      { type: "Texture", name: "gaoguang", path: gaoguang },
    ]
    // 资源加载
    this.instance.loadAll(assets)
  }
}
