import { request } from "../../utils/request";

Page({
  data: { orderId: "", order: {}, messages: [], lastId: "top", loading: true },
  onLoad(query) {
    const id = query.orderId || query.id || "";
    this.setData({ orderId: id });
    this.load().then(() => this.startPolling());
  },
  onUnload() { if (this.timer) clearInterval(this.timer); },
  async load() {
    try {
      const d = await request(`/api/order/detail?id=${this.data.orderId}`);
      this.setData({ order: d && d.order ? d.order : {}, loading: false });
      await this.loadMessages();
    } catch { this.setData({ loading: false }); }
  },
  async loadMessages() {
    try {
      const d = await request(`/api/order/messages/list?orderId=${this.data.orderId}`);
      const list = d && d.items ? d.items : [];
      const lastId = list.length ? list[list.length - 1].id : "top";
      this.setData({ messages: list, lastId });
    } catch { this.setData({ messages: [], lastId: "top" }); }
  },
  startPolling() { this.loadMessages(); this.timer = setInterval(() => this.loadMessages(), 3000); },
  async send(e) {
    const content = e.detail.value.content;
    if (!content) return;
    await request("/api/order/messages/send", { method: "POST", data: { orderId: this.data.orderId, content } });
    this.loadMessages();
  }
});