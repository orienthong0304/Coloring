<template>
  <div id="app">
    <van-floating-bubble icon="chat" @click="onClick" />
    <canvas
      id="c"
      class="app-canvas border-small"
    ></canvas>
    <van-button type="primary" round class="btn" @click="drawBtn">
      {{ isAllowDraw ? "关闭" : "涂色" }}
    </van-button>
    <van-button type="primary" round class="btn" @click="isDrawingModeBtn">
      {{ isDrawingMode ? "关闭" : "画笔" }}
    </van-button>

    <van-floating-panel v-model:height="height" :anchors="anchors" content-draggable="false">
      <div style="text-align: center; padding: 15px;">
        <p>面板显示高度 {{ height.toFixed(0) }} px</p>
      </div>
    </van-floating-panel>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import { fabric } from "fabric";

export default {
  name: "App",
  setup() {
    const canvas = ref(null);
    const isMutiTouch = ref(false);
    const drawingColorEl = ref("#ff0000ff");
    const selectedPath = ref(null);
    const initialDistance = ref(0);
    const lastScale = ref(1);
    const lastTouches = ref([]);
    //是否允许涂色
    const isAllowDraw = ref(false);
    const isDrawingMode = ref(false);
    const isDrawing = ref(false);

    const anchors = [
      100,
      // Math.round(0.4 * window.innerHeight),
      Math.round(0.7 * window.innerHeight),
    ];
    const height = ref(anchors[0]);

    onMounted(() => {
      // 初始化 Fabric 画布
      canvas.value = new fabric.Canvas("c", {
        width: window.innerWidth * 0.9,
        height: window.innerWidth * 0.9,
        isDrawingMode: false,
        subTargetCheck: true,
        allowTouchScrolling: false,
        selection: false,
      });

      // 添加 svg
      fabric.loadSVGFromURL(
        "https://raw.githubusercontent.com/orienthong0304/coloring/main/Z1.svg",
        function (objects, options) {
          var group = fabric.util.groupSVGElements(objects, options);
          // 根据 Canvas 画布尺寸压缩大小
          var scale = canvas.value.width / group.width;
          group.scale(scale);
          group.forEachObject(function (obj) {
            console.log(obj)
            //如果对象是透明色
            // if (obj.fill == "#fcfdfe") {
            //   console.log("透明色")
            //   obj.set({
            //     fill: "blue"
            //   });
            // }
            obj.set({
              perPixelTargetFind: true,
              selectable: false,
              objectCaching: false,
              evented: true, // 允许透明路径响应事件
            });
            canvas.value.add(obj);
          });
          // canvas.value.setBackgroundColor("blue", canvas.value.renderAll.bind(canvas));
          // 加载背景图像
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
          // canvas.value.renderAll();
        }
      );

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
      console.log("start:", e);
      if (e.touches.length > 1) {
        isMutiTouch.value = true;
        initialDistance.value = getDistance(e.touches[0], e.touches[1]);
        lastScale.value = canvas.value.getZoom();
        lastTouches.value = e.touches;
      }
    }

    function canvasTouchMove(e) {
      // console.log("move:", e)
      if (e.touches.length === 1) {
        // 画布执行拖动操作
        canvas.value.relativePan({
          x: e.touches[0].clientX - e.touches[0].clientX,
          y: e.touches[0].clientY - e.touches[0].clientY,
        });
      }
      if (e.touches.length > 1) {
        isMutiTouch.value = true;
        var currentDistance = getDistance(e.touches[0], e.touches[1]);
        var scale = (currentDistance / initialDistance.value) * lastScale.value;

        // 设置缩放比例的上限和下限
        if (scale > 20) scale = 20;
        if (scale < 1) {
          scale = 1;
          // 当缩放比例为 1 时自动居中画布
          canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
        }
        
        var currentMidpoint = getMidpoint(e.touches[0], e.touches[1]);
        var lastMidpoint = getMidpoint(lastTouches.value[0], lastTouches.value[1]);
        const deltaX = currentMidpoint.x - lastMidpoint.x;
        const deltaY = currentMidpoint.y - lastMidpoint.y;

        const distanceChange = Math.abs(
          e.touches[0].clientY - e.touches[1].clientY
        );

        // 判断是否为缩放操作
        if (distanceChange > 20) {
          // 缩放画布
          canvas.value.zoomToPoint(
            new fabric.Point(currentMidpoint.x, currentMidpoint.y),
            scale
          );
        } else {
          // 画布执行拖动操作
          canvas.value.relativePan({
            x: deltaX,
            y: deltaY,
          });
        }
      }
    }

    function canvasTouchEnd(e) {
      console.log("end: ", e)
      if (e.touches.length === 0) {
        isMutiTouch.value = false;
      }
    }

    function drawBtn() {
      isAllowDraw.value = !isAllowDraw.value;
      // canvas.value.isDrawingMode = isDrawingMode.value;
    }

    function isDrawingModeBtn() {
      isDrawingMode.value = !isDrawingMode.value;
      canvas.value.isDrawingMode = !canvas.value.isDrawingMode;
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
      isAllowDraw,
      isDrawingMode,
      height,
      anchors,
      canvas,
      drawBtn,
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
  height: 100vw;
  touch-action: none;
}
</style>
