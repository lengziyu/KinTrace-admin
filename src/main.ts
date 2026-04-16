import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";
import { useBrandStore } from "./stores/brand";
import "./style.css";

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
void useBrandStore(pinia).loadSettings();
app.mount("#app");
