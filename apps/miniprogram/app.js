import { request } from "./utils/request";

App({
  globalData: {
    token: ""
  },
  onLaunch() {
    try { request("/api/menu/list", { timeout: 5000, retry: 1 }); } catch (e) {}
  }
})