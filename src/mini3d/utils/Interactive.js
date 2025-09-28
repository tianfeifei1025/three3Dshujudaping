import { Raycaster, Vector2 } from "three"

export class InteractiveObject {
  constructor(target, name) {
    this.wasIntersected = false
    this.wasIntersectedOnMouseDown = false
    this.target = target
    this.name = name
    this.intersected = false
    this.distance = 0
  }
}

export class InteractiveEvent {
  constructor(type, originalEvent = null) {
    // Dummy default values
    this.coords = new Vector2(0, 0)
    this.distance = 0
    this.intersected = false
    this.wasIntersected = false
    this.wasIntersectedOnMouseDown = false
    this.cancelBubble = false
    this.type = type
    this.originalEvent = originalEvent
    this.point = null; // 新增 point 属性
  }
  stopPropagation() {
    this.cancelBubble = true
  }
}

export class InteractionManagerOptions {
  constructor(options) {
    this.bindEventsOnBodyElement = true
    this.autoAdd = false
    this.scene = null
    if (options && typeof options.bindEventsOnBodyElement !== "undefined") {
      this.bindEventsOnBodyElement = options.bindEventsOnBodyElement
    }
    if (options && typeof options.scene !== "undefined") {
      this.scene = options.scene
    }
    if (options && typeof options.autoAdd !== "undefined") {
      this.autoAdd = options.autoAdd
    }
  }
}

export class InteractionManager {
  constructor(renderer, camera, domElement, options) {
    this.dispose = () => {
      this.domElement.removeEventListener("click", this.onMouseClick)
      if (this.supportsPointerEvents) {
        if (this.bindEventsOnBodyElement) {
          this.domElement.ownerDocument.removeEventListener("pointermove", this.onDocumentPointerMove)
        } else {
          this.domElement.removeEventListener("pointermove", this.onDocumentPointerMove)
        }
        this.domElement.removeEventListener("pointerdown", this.onPointerDown)
        this.domElement.removeEventListener("pointerup", this.onPointerUp)
      }
      if (this.bindEventsOnBodyElement) {
        this.domElement.ownerDocument.removeEventListener("mousemove", this.onDocumentMouseMove)
      } else {
        this.domElement.removeEventListener("mousemove", this.onDocumentMouseMove)
      }
      this.domElement.removeEventListener("mousedown", this.onMouseDown)
      this.domElement.removeEventListener("mouseup", this.onMouseUp)
      this.domElement.removeEventListener("touchstart", this.onTouchStart)
      this.domElement.removeEventListener("touchmove", this.onTouchMove)
      this.domElement.removeEventListener("touchend", this.onTouchEnd)
    }

    this.add = (object, childNames = []) => {
      if (object && !this.interactiveObjects.find((i) => i.target === object)) {
        if (childNames.length > 0) {
          childNames.forEach((name) => {
            const o = object.getObjectByName(name)
            if (o) {
              const interactiveObject = new InteractiveObject(o, name)
              this.interactiveObjects.push(interactiveObject)
            }
          })
        } else {
          const interactiveObject = new InteractiveObject(object, object.name)
          this.interactiveObjects.push(interactiveObject)
        }
      }
    }

    this.remove = (object, childNames = []) => {
      if (!object) return
      if (childNames.length > 0) {
        childNames.forEach((name) => {
          const child = object.getObjectByName(name)
          if (child) {
            this.interactiveObjects = this.interactiveObjects.filter((o) => o.target !== child)
          }
        })
      } else {
        this.interactiveObjects = this.interactiveObjects.filter((o) => o.target !== object)
      }
    }

    this.update = () => {
      var _a
      this.raycaster.setFromCamera(this.mouse, this.camera)
      this.interactiveObjects.forEach((object) => {
        if (object.target) this.checkIntersection(object)
      })
      this.interactiveObjects.sort(function (a, b) {
        return a.distance - b.distance
      })
      const newClosestObject =
        (_a = this.interactiveObjects.find((object) => object.intersected)) !== null && _a !== void 0 ? _a : null

      if (newClosestObject != this.closestObject) {
        if (this.closestObject) {
          const eventOutClosest = new InteractiveEvent("mouseout")
          this.dispatch(this.closestObject, eventOutClosest)
        }
        if (newClosestObject) {
          const eventOverClosest = new InteractiveEvent("mouseover")
          this.dispatch(newClosestObject, eventOverClosest)
        }
        this.closestObject = newClosestObject
      }
      let eventLeave
      this.interactiveObjects.forEach((object) => {
        if (!object.intersected && object.wasIntersected) {
          if (!eventLeave) {
            eventLeave = new InteractiveEvent("mouseleave")
          }
          this.dispatch(object, eventLeave)
        }
      })
      let eventEnter
      this.interactiveObjects.forEach((object) => {
        if (object.intersected && !object.wasIntersected) {
          if (!eventEnter) {
            eventEnter = new InteractiveEvent("mouseenter")
          }
          this.dispatch(object, eventEnter)
        }
      })
    }

    this.checkIntersection = (object) => {
      const intersects = this.raycaster.intersectObjects([object.target], true)
      object.wasIntersected = object.intersected
      if (intersects.length > 0) {
        let distance = intersects[0].distance
        intersects.forEach((i) => {
          if (i.distance < distance) {
            distance = i.distance
          }
        })
        object.target.point = intersects[0].point
        object.intersected = true
        object.distance = distance
      } else {
        object.intersected = false
        object.target.point = null;
      }
    }

    this.onDocumentMouseMove = (mouseEvent) => {
      this.mapPositionToPoint(this.mouse, mouseEvent.clientX, mouseEvent.clientY)
      this.update(); // 新增：更新射线检测
      const event = new InteractiveEvent("mousemove", mouseEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
        }
        this.dispatch(object, event)
      })
    }

    this.onDocumentPointerMove = (pointerEvent) => {
      this.mapPositionToPoint(this.mouse, pointerEvent.clientX, pointerEvent.clientY)
      this.update(); // 新增：更新射线检测
      const event = new InteractiveEvent("pointermove", pointerEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
        }
        this.dispatch(object, event)
      })
    }

    this.onTouchMove = (touchEvent) => {
      if (touchEvent.touches.length > 0) {
        this.mapPositionToPoint(this.mouse, touchEvent.touches[0].clientX, touchEvent.touches[0].clientY)
      }
      this.update(); // 新增：更新射线检测
      const event = new InteractiveEvent(this.treatTouchEventsAsMouseEvents ? "mousemove" : "touchmove", touchEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
        }
        this.dispatch(object, event)
      })
    }

    this.onMouseClick = (mouseEvent) => {
      this.update()
      const event = new InteractiveEvent("click", mouseEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
          this.dispatch(object, event)
        }
      })
    }

    this.onMouseDown = (mouseEvent) => {
      this.mapPositionToPoint(this.mouse, mouseEvent.clientX, mouseEvent.clientY)
      this.update()
      const event = new InteractiveEvent("mousedown", mouseEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          object.wasIntersectedOnMouseDown = true
          event.point = object.target.point; // 设置 point 属性
          this.dispatch(object, event)
        } else {
          object.wasIntersectedOnMouseDown = false
        }
      })
    }

    this.onPointerDown = (pointerEvent) => {
      this.mapPositionToPoint(this.mouse, pointerEvent.clientX, pointerEvent.clientY)
      this.update()
      const event = new InteractiveEvent("pointerdown", pointerEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
          this.dispatch(object, event)
        }
      })
    }

    this.onTouchStart = (touchEvent) => {
      if (touchEvent.touches.length > 0) {
        this.mapPositionToPoint(this.mouse, touchEvent.touches[0].clientX, touchEvent.touches[0].clientY)
      }
      this.update()
      const event = new InteractiveEvent(this.treatTouchEventsAsMouseEvents ? "mousedown" : "touchstart", touchEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
          this.dispatch(object, event)
        }
      })
    }

    this.onMouseUp = (mouseEvent) => {
      const event = new InteractiveEvent("mouseup", mouseEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
        }
        this.dispatch(object, event)
      })
    }

    this.onPointerUp = (pointerEvent) => {
      const event = new InteractiveEvent("pointerup", pointerEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
        }
        this.dispatch(object, event)
      })
    }

    this.onTouchEnd = (touchEvent) => {
      if (touchEvent.touches.length > 0) {
        this.mapPositionToPoint(this.mouse, touchEvent.touches[0].clientX, touchEvent.touches[0].clientY)
      }
      this.update()
      const event = new InteractiveEvent(this.treatTouchEventsAsMouseEvents ? "mouseup" : "touchend", touchEvent)
      this.interactiveObjects.forEach((object) => {
        if (object.intersected) {
          event.point = object.target.point; // 设置 point 属性
        }
        this.dispatch(object, event)
      })
    }

    this.dispatch = (object, event) => {
      if (object.target && !event.cancelBubble) {
        event.coords = this.mouse
        event.distance = object.distance
        event.intersected = object.intersected
        event.wasIntersected = object.wasIntersected
        event.wasIntersectedOnMouseDown = object.wasIntersectedOnMouseDown
        object.target.dispatchEvent(event)
      }
    }

    this.mapPositionToPoint = (point, x, y) => {
      const rect = this.renderer.domElement.getBoundingClientRect()
      point.x = ((x - rect.left) / rect.width) * 2 - 1
      point.y = -((y - rect.top) / rect.height) * 2 + 1
    }

    this.renderer = renderer
    this.camera = camera
    this.domElement = domElement
    this.bindEventsOnBodyElement =
      options && typeof options.bindEventsOnBodyElement !== "undefined" ? options.bindEventsOnBodyElement : true
    this.scene = options && typeof options.scene !== "undefined" ? options.scene : null
    if (this.scene) {
      this.scene.onBeforeRender = () => {
        if (this.autoAdd && this.scene !== null) {
          this.scene.traverse((object) => {
            this.add(object)
            object.addEventListener("removed", (o) => {
              this.remove(o.target)
            })
          })
        }
        this.update()
      }
    }
    this.autoAdd = options && typeof options.autoAdd !== "undefined" ? options.autoAdd : false
    if (this.autoAdd && this.scene === null) {
      console.error("Attention: Options.scene needs to be set when using options.autoAdd")
    }
    this.mouse = new Vector2(-1, 1) // top left default position
    this.supportsPointerEvents = !!window.PointerEvent
    this.interactiveObjects = []
    this.closestObject = null
    this.raycaster = new Raycaster()
    domElement.addEventListener("click", this.onMouseClick, { passive: true });
    if (this.supportsPointerEvents) {
      if (this.bindEventsOnBodyElement) {
        domElement.ownerDocument.addEventListener("pointermove", this.onDocumentPointerMove, { passive: true });
      } else {
        domElement.addEventListener("pointermove", this.onDocumentPointerMove, { passive: true });
      }
      domElement.addEventListener("pointerdown", this.onPointerDown, { passive: true });
      domElement.addEventListener("pointerup", this.onPointerUp, { passive: true });
    }
    if (this.bindEventsOnBodyElement) {
      domElement.ownerDocument.addEventListener("mousemove", this.onDocumentMouseMove, { passive: true });
    } else {
      domElement.addEventListener("mousemove", this.onDocumentMouseMove, { passive: true });
    }
    domElement.addEventListener("mousedown", this.onMouseDown, { passive: true });
    domElement.addEventListener("mouseup", this.onMouseUp, { passive: true });
    domElement.addEventListener("touchstart", this.onTouchStart, {
      passive: true,
    })
    domElement.addEventListener("touchmove", this.onTouchMove, {
      passive: true,
    })
    domElement.addEventListener("touchend", this.onTouchEnd, {
      passive: true,
    })
    this.treatTouchEventsAsMouseEvents = true
  }
}