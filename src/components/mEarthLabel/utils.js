import pointInPolygon from 'point-in-polygon'
import {Vector3} from 'three'
/**
 * 
 * @param {*} arr 
 * @param {*} iteratee 
 * @returns 
 */
export function maxBy(arr, iteratee) {
    if (arr.length === 0) {
        return undefined;
    }
    let maxItem = arr[0];
    let maxValue = iteratee(maxItem);
    for (let i = 1; i < arr.length; i++) {
        const currentItem = arr[i];
        const currentValue = iteratee(currentItem);
        if (currentValue > maxValue) {
            maxValue = currentValue;
            maxItem = currentItem;
        }
    }
    return maxItem;
  }
  
  export function minBy(arr, iteratee) {
    if (arr.length === 0) {
        return undefined;
    }
    let minItem = arr[0];
    let minValue = iteratee(minItem);
    for (let i = 1; i < arr.length; i++) {
        const currentItem = arr[i];
        const currentValue = iteratee(currentItem);
        if (currentValue < minValue) {
            minValue = currentValue;
            minItem = currentItem;
        }
    }
    return minItem;
  }
  
  /**
     * 生成球面坐标
     * @param {*} R 球半径
     * @param {*} longitude 经度
     * @param {*} latitude 纬度
     * @returns
     */
  export const geoSphereCoord = (R, longitude, latitude) => {
    var lon = (longitude * Math.PI) / 180 //转弧度值
    var lat = (latitude * Math.PI) / 180 //转弧度值
    lon = -lon // three.js坐标系z坐标轴对应经度-90度，而不是90度
  
    // 经纬度坐标转球面坐标计算公式
    var x = R * Math.cos(lat) * Math.cos(lon)
    var y = R * Math.sin(lat)
    var z = R * Math.cos(lat) * Math.sin(lon)
    // 返回球面坐标
    return {
      x: x,
      y: y,
      z: z,
    }
  }
  
  
  /**
     * 生成网格点
     * @param {*} coordinates 坐标 [Vector3(x, y, 0),Vector3(x, y, 0)]
     * @param {*} gap 网格点间距，越小越平滑，消耗的性格越大
     * @returns 返回内容点，和所有点
     */
  export const generateGrid = (coordinates, gap = 3) => {
    // coords整个多边形的坐标点。x,y
    let coords = coordinates.map(item => {
      return [item.x, item.y]
    })
    // 计算最大最小经纬度
    // lon lat 经纬度的最大最小值
    // 通过Math.floor、Math.ceil向两侧取整，把经纬度的方位稍微扩大
    let minLon = Math.floor(
      minBy(coordinates, function (o) {
        return o.x
      }).x,
    )
    let maxLon = Math.ceil(
      maxBy(coordinates, function (o) {
        return o.x
      }).x,
    )
    let minLat = Math.floor(
      minBy(coordinates, function (o) {
        return o.y
      }).y,
    )
    let maxLat = Math.ceil(
      maxBy(coordinates, function (o) {
        return o.y
      }).y,
    )
  
    // 计算经纬度的范围
    let lonScope = Math.ceil((maxLon - minLon) / gap)
    let latScope = Math.ceil((maxLat - minLat) / gap)
    let scopePoint = []
    // 循环生成点矩阵坐标
    for (let i = 0; i < lonScope + 1; i++) {
      let x = minLon + i * gap
      for (let j = 0; j < latScope + 1; j++) {
        let y = minLat + j * gap
        scopePoint.push([x, y])
      }
    }
    // 返回在多边形中的点
    let scopeInsidePoint = scopePoint
      .filter(item => {
        return pointInPolygon(item, coords)
      })
      .map(item => {
        return new Vector3(item[0], item[1], 0)
      })
    return { scopeInsidePoint, scopePoint }
  }