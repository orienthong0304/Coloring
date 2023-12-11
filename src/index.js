import { createApp } from 'vue';
// 1. 引入你需要的组件
import { Button } from 'vant';
import { FloatingPanel } from 'vant';
import { FloatingBubble } from 'vant';
import { NavBar } from 'vant';
import { Divider } from 'vant';
import { Col, Row } from 'vant';
import { ActionSheet } from 'vant';
import { Dialog } from 'vant';
import { Progress } from 'vant';
import Vue3ColorPicker from "vue3-colorpicker";
import "vue3-colorpicker/style.css";
// 2. 引入组件样式
import 'vant/lib/index.css';


import App from './App.vue';
const app = createApp(App);

app.use(Vue3ColorPicker);

// 3. 注册你需要的组件
app.use(Button);
app.use(FloatingPanel);
app.use(FloatingBubble);
app.use(NavBar);
app.use(Divider);
app.use(Col);
app.use(Row);
app.use(ActionSheet);
app.use(Dialog);
app.use(Progress);
app.mount('#root');