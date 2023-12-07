import { createApp } from 'vue';
// 1. 引入你需要的组件
import { Button } from 'vant';
import { FloatingPanel } from 'vant';
import { FloatingBubble } from 'vant';

// 2. 引入组件样式
import 'vant/lib/index.css';

import App from './App.vue';
const app = createApp(App);

// 3. 注册你需要的组件
app.use(Button);
app.use(FloatingPanel);
app.use(FloatingBubble);

app.mount('#root');