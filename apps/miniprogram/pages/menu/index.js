import { request } from "../../utils/request";

Page({
  data: {
    items: []
  },
  onShow() {
    this.load();
  },
  async load() {
    const data = await request("/api/menu/list");
    this.setData({ items: (data && data.items) ? data.items : [] });
  }
});