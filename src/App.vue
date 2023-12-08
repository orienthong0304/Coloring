<template>
  <div id="app">
    <!-- <van-nav-bar title="标题"/> -->

    <van-floating-bubble icon="chat"/>
    <canvas
      id="c"
      class="app-canvas border-small"></canvas>
    <van-floating-panel v-model:height="height" :anchors="anchors">
      <van-row justify="space-around" style="margin-bottom: 10px;">
        <van-button type="primary" round class="btn" @click="fillBtn">
          {{ isAllowDraw ? "关闭" : "填充" }}
        </van-button>
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "画笔" }}
        </van-button>
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "擦除" }}
        </van-button>
      </van-row>

      <van-row justify="space-around" style="margin-bottom: 10px;">
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "撤销" }}
        </van-button>
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "重做" }}
        </van-button>
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "清空" }}
        </van-button>
      </van-row>

      <van-row justify="space-around" style="margin-bottom: ;">
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "保存" }}
        </van-button>
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "分享" }}
        </van-button>
        <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
          {{ isDrawingMode ? "关闭" : "下载" }}
        </van-button>
      </van-row>

      <van-row justify="center">
        <color-picker v-model:pureColor="pureColor" shape="circle"/>
        <color-picker v-model:gradientColor="gradientColor" shape="circle" useType="gradient"/>
        <input type="color" v-model="drawingColorEl" style="width: 25px; height: 25px; border-radius: 50%;"/>
      </van-row>
      
    </van-floating-panel>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import { fabric } from "fabric";
import { ColorInputWithoutInstance } from "tinycolor2";

export default {
  name: "App",
  setup() {

    const pureColor = ref<ColorInputWithoutInstance>("red");
    const gradientColor = ref("linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 100%)");
    const canvas = ref(null);
    const isMutiTouch = ref(false);
    const drawingColorEl = ref("#FF0000");
    const selectedPath = ref(null);
    const initialDistance = ref(0);
    const lastScale = ref(1);
    const lastTouches = ref([]);
    const currentMidpoint = ref(null);
    //是否允许涂色
    const isAllowDraw = ref(false);
    const isDrawingMode = ref(false);
    const isDrawing = ref(false);

    const anchors = [
    Math.round(0.3 * window.innerHeight),
      // Math.round(0.4 * window.innerHeight),
      Math.round(0.7 * window.innerHeight),
    ];
    const height = ref(anchors[0]);

    onMounted(() => {
      // 初始化 Fabric 画布
      canvas.value = new fabric.Canvas("c", {
        width: window.innerWidth,
        height: window.innerHeight * 0.7,
        isDrawingMode: false,
        subTargetCheck: true,
        allowTouchScrolling: false,
        selection: false,
      });

      // 添加 svg
      fabric.loadSVGFromURL(
        "https://raw.githubusercontent.com/orienthong0304/Coloring/main/coloring/1.svg",
        function (objects, options) {
          var group = fabric.util.groupSVGElements(objects, options);
          // 根据 Canvas 画布尺寸压缩大小
          var scale = canvas.value.width / group.width;
          group.scale(scale * 0.9);
          group.forEachObject(function (obj) {
            obj.set({
              perPixelTargetFind: true,
              selectable: false,
              objectCaching: false,
              evented: true, // 允许透明路径响应事件
            });
            //把对象添加到画布，并相对居中
            canvas.value.add(obj);
          });
          // 将画布内容居中
          canvas.value.centerObject(group);
          // 给 group 添加一个外边框
          var rect = new fabric.Rect({
            left: group.left,
            top: group.top,
            width: canvas.value.width * 0.9,
            height: canvas.value.width * 0.9,
            stroke: "black",
            strokeWidth: 1,
            fill: "transparent",
            selectable: false,
            evented: false,
          });
          // 将外边框添加到group
          // group.addWithUpdate(rect);
          // 将外边框添加到画布
          canvas.value.add(rect);
          // 设置背景颜色
          canvas.value.setBackgroundColor("white", canvas.value.renderAll.bind(canvas.value));
          // 重新渲染画布
          canvas.value.renderAll();
        }
      );

      // // 加载背景图像
      // fabric.Image.fromURL('https://example.com/background-image.jpg', function (img) {
      //   // 设置画布背景
      //   canvas.value.setBackgroundImage(img, canvas.value.renderAll.bind(canvas), {
      //     // 背景图像的设置选项
      //     originX: 'left',
      //     originY: 'top',
      //     scaleX: canvas.width / img.width,  // 根据需要缩放图像以适应画布大小
      //     scaleY: canvas.height / img.height
      //   });
      // });

      fabric.Object.prototype.transparentCorners = false; //画布边框
      canvas.value.on("mouse:down", function (options) {
        console.log("mouse:down", options)
        if (!isAllowDraw.value) {
          return;
        }
        if (
          !isMutiTouch.value &&
          options.target &&
          options.target.type === "path" &&
          options.target.fill !== drawingColorEl.value
        ) {
          var path = options.target;
          selectedPath.value = path;
          // 使用动画改变颜色
          animateColorChange(path, drawingColorEl.value, 500); // 500 毫秒的动画时长
        }
      });

      canvas.value.on("mouse:move", function (options) {
        console.log("mouse:move", options.target)
        // if (!isAllowDraw.value) {
        //   return;
        // }
        // if (
        //   !isMutiTouch.value &&
        //   options.target &&
        //   options.target.type === "path" &&
        //   options.target.fill !== drawingColorEl.value &&
        //   options.target.id !== "#010101ff"
        // ) {
        //   var path = options.target;
        //   selectedPath.value = path;
        //   // 使用动画改变颜色
        //   animateColorChange(path, drawingColorEl.value, 500); // 500 毫秒的动画时长
        // }
      });

      canvas.value.on("mouse:up", function (options) {
        console.log("mouse:up", options.target)
        if (!isAllowDraw.value) {
          return;
        }
        if (
          !isMutiTouch.value &&
          options.target &&
          options.target.type === "path" &&
          options.target.fill !== drawingColorEl.value &&
          options.target.id !== "#010101ff"
        ) {
          var path = options.target;
          selectedPath.value = path;
          // 使用动画改变颜色
          animateColorChange(path, drawingColorEl.value, 500); // 500 毫秒的动画时长
        }
      });

      canvas.value.on("path:created", function (e) {
        console.log("path:created", e)
        var path = e.path;
        path.set({
          perPixelTargetFind: true,
          selectable: false,
          objectCaching: false,
        });
        // canvas.value.renderAll();
        // canvas.value.add(path);
      });

      canvas.value.on("mouse:wheel", function (opt) {
        // 获取鼠标滚轮的滚动方向
        var delta = opt.e.deltaY;
        // 获取当前缩放比例
        var zoom = canvas.value.getZoom();
        // 缩放比例的变化速度
        zoom *= 0.999 ** delta;

        // 设置缩放比例的上限和下限
        if (zoom > 20) zoom = 20;
        if (zoom < 1) {
          zoom = 1;
          // 当缩放比例为 1 时自动居中画布
          canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
        }

        // 如果缩放比例大于 1，则正常缩放
        if (zoom > 1) {
          canvas.value.zoomToPoint(
            { x: opt.e.offsetX, y: opt.e.offsetY },
            zoom
          );
        }
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });      

      canvas.value.upperCanvasEl.addEventListener(
        "touchstart",
        canvasTouchStart,
        false
      );
      canvas.value.upperCanvasEl.addEventListener(
        "touchmove",
        canvasTouchMove,
        false
      );
      canvas.value.upperCanvasEl.addEventListener(
        "touchend",
        canvasTouchEnd,
        false
      );
    });

    function canvasTouchStart(e) {
      // console.log("start:", e);
      if (e.touches.length > 1) {
        isMutiTouch.value = true;
        initialDistance.value = getDistance(e.touches[0], e.touches[1]);
        lastScale.value = canvas.value.getZoom();
        lastTouches.value = e.touches;
        // 计算双指中心点
        currentMidpoint.value = getMidpoint(e.touches[0], e.touches[1]);
      }
    }

    let throttleTimer;
    
    function canvasTouchMove(e) {
      // 节流处理，减少函数调用频率
      if (!throttleTimer) {
        throttleTimer = requestAnimationFrame(() => {
          // 处理多点触控
          if (e.touches.length > 1) {
            isMutiTouch.value = true;
            // 计算当前距离和缩放比例
            var currentDistance = getDistance(e.touches[0], e.touches[1]);
            var scale = (currentDistance / initialDistance.value) * lastScale.value;
            // 限制缩放比例范围
            scale = Math.max(1, Math.min(scale, 20));
            // 自动居中画布（当缩放比例为1）
            if (scale === 1) {
              canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
            } else {
              canvas.value.zoomToPoint(
                new fabric.Point(currentMidpoint.value.x, currentMidpoint.value.y),
                scale
              );
            }
            // if(!isDrawingMode) {
            //   e.preventDefault();
            //   e.stopPropagation();
            // }
          }
          throttleTimer = null;
        });
      }
      if (!isDrawingMode.value) {
        e.preventDefault();
        e.stopPropagation();
      }
    }


    function canvasTouchEnd(e) {
      // console.log("end: ", e)
      if (e.touches.length === 0) {
        isMutiTouch.value = false;
      }
    }

    function fillBtn() {
      isAllowDraw.value = !isAllowDraw.value;
      if (isDrawingMode.value) {
        canvas.value.isDrawingMode = false;
        isDrawingMode.value = false;
      }
    }

    function isDrawingModeBtn() {
      isDrawingMode.value = !isDrawingMode.value;
      canvas.value.isDrawingMode = !canvas.value.isDrawingMode;
      if(isAllowDraw.value)  { 
        isAllowDraw.value = false;
      }
    }

    function animateColorChange(object, newColor, duration) {
      var startColor = new fabric.Color(object.fill).toRgb(); // 确保这是一个字符串格式的颜色值
      var endColor = new fabric.Color(newColor).toRgb(); // 确保这也是一个字符串格式的颜色值

      fabric.util.animate({
        startValue: fabric.Color.sourceFromRgb(startColor),
        endValue: fabric.Color.sourceFromRgb(endColor),
        duration: duration,
        onChange: function (value) {
          object.set("fill", "rgb(" + value.join(",") + ")");
          canvas.value.renderAll();
        },
        onComplete: function () {
          object.set("fill", endColor);
          canvas.value.renderAll();
        },
      });
    }

    function getDistance(touch1, touch2) {
      const x = touch2.pageX - touch1.pageX;
      const y = touch2.pageY - touch1.pageY;
      return Math.sqrt(x * x + y * y);
    }

    function getMidpoint(touch1, touch2) {
      return {
        x: (touch1.pageX + touch2.pageX) / 2,
        y: (touch1.pageY + touch2.pageY) / 2,
      };
    }

    return {
      pureColor, gradientColor,
      drawingColorEl,
      isAllowDraw,
      isDrawingMode,
      height,
      anchors,
      canvas,
      fillBtn,
      isDrawingModeBtn
    };
  },
  mounted() {
    console.log("mounted")
  },
  methods: {
    canvasTouchStart(e) {
      console.log(e);
      if (e.touches.length > 1) {
        isMutiTouch.value = true;
      }
    },

    canvasTouchMove(e) {
      if (e.touches.length > 1) {
        isMutiTouch.value = true;
      }
    },

    canvasTouchEnd(e) {
      if (e.touches.length === 0) {
        isMutiTouch.value = false;
      }
    },
  },
};
</script>

<style>
.app {
  min-height: 100vh;
}
.app-canvas {
  width: 100%;
  height: 70vh;
  touch-action: none;
}
</style>
