import { request } from "../../utils/request";

Page({
  data: { order: {}, items: [], messages: [] },
  onLoad(query) { this.id = query.id || ""; this.load(); this.loadMessages(); },
  async load() {
    const d = await request(`/api/order/detail?id=${this.id}`);
    this.setData({ order: d && d.order ? d.order : {}, items: d && d.items ? d.items : [] });
  },
  async loadMessages() {
    const d = await request(`/api/order/messages/list?orderId=${this.id}`);
    this.setData({ messages: d && d.items ? d.items : [] });
  },
  async send(e) {
    const content = e.detail.value.content;
    if (!content) return;
    await request("/api/order/messages/send", { method: "POST", data: { orderId: this.id, content } });
    this.loadMessages();
  }
})