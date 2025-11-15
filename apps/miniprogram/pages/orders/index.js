import { request } from "../../utils/request";

Page({
  data: { items: [], tab: "mine" },
  onShow() { this.load(); },
  showMine() { this.setData({ tab: "mine" }); this.load(); },
  showAvailable() { this.setData({ tab: "available" }); this.load(); },
  async load() {
    const data = await request(`/api/order/list?type=${this.data.tab}`);
    this.setData({ items: data && data.items ? data.items : [] });
  },
  async accept(e) {
    const id = e.currentTarget.dataset.id;
    await request("/api/order/accept", { method: "POST", data: { orderId: id } });
    this.load();
  }
})