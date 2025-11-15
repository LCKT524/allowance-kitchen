import { request } from "../../utils/request";

Page({
  data: {
    items: [],
    loading: true,
    error: ""
  },
  onShow() {
    this.load();
  },
  async load() {
    try {
      const data = await request("/api/menu/list");
      this.setData({ items: (data && data.items) ? data.items : [], loading: false, error: "" });
    } catch (e) {
      this.setData({ loading: false, error: "加载失败，请稍后重试" });
    }
  }
});