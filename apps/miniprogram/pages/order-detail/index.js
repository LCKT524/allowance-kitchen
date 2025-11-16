import { request } from "../../utils/request";

Page({
  data: { order: {}, items: [], loading: true },
  onLoad(query) { this.id = query.id || ""; this.load(); },
  async load() {
    try {
      const d = await request(`/api/order/detail?id=${this.id}`);
      this.setData({ order: d && d.order ? d.order : {}, items: d && d.items ? d.items : [], loading: false });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
      this.setData({ loading: false });
    }
  }
})