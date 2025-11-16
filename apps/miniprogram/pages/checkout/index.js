import { request } from "../../utils/request";

Page({
  data: {
    phone: "",
    items: [],
    subTotal: 0,
    subTotalDisplay: "0.00",
    total: 0,
    totalDisplay: "0.00",
    remark: ""
  },
  async onShow() {
    await this.loadData();
  },
  async loadData() {
    const cart = wx.getStorageSync("cart") || [];
    const d = await request("/api/menu/list");
    const items = d && d.items ? d.items : [];
    const priceMap = {};
    const nameMap = {};
    const catMap = {};
    for (const it of items) {
      const price = it.category === "meat" ? 3.0 : 1.5;
      priceMap[it.id] = price;
      nameMap[it.id] = it.name;
      catMap[it.id] = it.category;
    }
    const list = [];
    let subTotal = 0;
    for (const it of cart) {
      const price = priceMap[it.menu_id] || 0;
      const qty = it.quantity || 1;
      const name = nameMap[it.menu_id] || "";
      list.push({ id: it.menu_id, name, price, priceDisplay: price.toFixed(2), qty });
      subTotal += price * qty;
    }
    const subTotalDisplay = subTotal.toFixed(2);
    const total = subTotal;
    const totalDisplay = total.toFixed(2);
    this.setData({ items: list, subTotal, subTotalDisplay, total, totalDisplay });
  },
  continueAdd() {
    wx.navigateBack({ delta: 1 });
  },
  onRemark(e) {
    this.setData({ remark: e.detail.value || "" });
  },
  onPhone(e) { this.setData({ phone: e.detail.value || "" }); },
  incItem(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.items.map(it => it.id === id ? { ...it, qty: it.qty + 1 } : it);
    this.updateCartFromItems(items);
  },
  decItem(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.items.map(it => it.id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it);
    this.updateCartFromItems(items);
  },
  removeItem(e) {
    const id = e.currentTarget.dataset.id;
    const items = this.data.items.filter(it => it.id !== id);
    this.updateCartFromItems(items);
  },
  updateCartFromItems(items) {
    const itemsFmt = items.map(it => ({ ...it, priceDisplay: (Number(it.price) || 0).toFixed(2) }));
    const cart = itemsFmt.map(it => ({ menu_id: it.id, quantity: it.qty }));
    wx.setStorageSync("cart", cart);
    let subTotal = 0;
    for (const it of itemsFmt) subTotal += (Number(it.price) || 0) * (Number(it.qty) || 1);
    const total = subTotal;
    this.setData({ items: itemsFmt, subTotal, subTotalDisplay: subTotal.toFixed(2), total, totalDisplay: total.toFixed(2) });
  },
  async goPay() {
    const cart = wx.getStorageSync("cart") || [];
    if (!cart.length) { wx.showToast({ title: "请先加菜", icon: "none" }); return; }
    const token = wx.getStorageSync("token") || "";
    if (!token) { wx.showToast({ title: "请先登录", icon: "none" }); wx.navigateTo({ url: "/pages/home/index" }); return; }
    const r = await request("/api/order/create", { method: "POST", data: { items: cart } });
    const order = r && r.order ? r.order : null;
    if (order) {
      const ph = (this.data.phone || "").trim();
      const rm = (this.data.remark || "").trim();
      const msgParts = [];
      if (ph) msgParts.push(`电话：${ph}`);
      if (rm) msgParts.push(`备注：${rm}`);
      const content = msgParts.join("；");
      if (content) {
        try { await request("/api/order/messages/send", { method: "POST", data: { orderId: order.id, content } }); } catch {}
      }
      wx.removeStorageSync("cart");
      wx.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
    }
  }
});
