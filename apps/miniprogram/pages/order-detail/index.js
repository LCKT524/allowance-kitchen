import { request } from "../../utils/request";

Page({
  data: { order: {}, items: [], messages: [], loading: true, lastId: "top" },
  onLoad(query) { this.id = query.id || ""; this.load(); this.startPolling(); },
  onUnload() { if (this.timer) clearInterval(this.timer); },
  async load() {
    try {
      const d = await request(`/api/order/detail?id=${this.id}`);
      this.setData({ order: d && d.order ? d.order : {}, items: d && d.items ? d.items : [], loading: false });
    } catch (e) {
      wx.showToast({ title: "加载失败", icon: "none" });
      this.setData({ loading: false });
    }
  },
  async loadMessages() {
    try {
      const d = await request(`/api/order/messages/list?orderId=${this.id}`);
      const list = d && d.items ? d.items : [];
      const lastId = list.length ? list[list.length - 1].id : "top";
      this.setData({ messages: list, lastId });
    } catch (e) {
      this.setData({ messages: [], lastId: "top" });
    }
  },
  startPolling() {
    this.loadMessages();
    this.timer = setInterval(() => this.loadMessages(), 3000);
  },
  async send(e) {
    const content = e.detail.value.content;
    if (!content) return;
    await request("/api/order/messages/send", { method: "POST", data: { orderId: this.id, content } });
    this.loadMessages();
  }
})