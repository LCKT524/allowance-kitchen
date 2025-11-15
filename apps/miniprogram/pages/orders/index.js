import { request } from "../../utils/request";

Page({
  data: { items: [], tab: "mine", loading: true, error: "" },
  onShow() { this.load(); },
  showMine() { this.setData({ tab: "mine" }); this.load(); },
  showAvailable() { this.setData({ tab: "available" }); this.load(); },
  async load() {
    try {
      const data = await request(`/api/order/list?type=${this.data.tab}`);
      this.setData({ items: data && data.items ? data.items : [], loading: false, error: "" });
    } catch (e) {
      this.setData({ loading: false, error: "加载失败，请稍后重试" });
    }
  },
  async accept(e) {
    try {
      const id = e.currentTarget.dataset.id;
      await request("/api/order/accept", { method: "POST", data: { orderId: id } });
      this.load();
    } catch (e) {
      wx.showToast({ title: "接单失败", icon: "none" });
    }
  }
})