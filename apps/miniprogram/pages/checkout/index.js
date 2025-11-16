import { request } from "../../utils/request";

Page({
  data: {
    tableNo: "A3",
    peopleCount: 3,
    phone: "15677900009",
    items: [],
    subTotal: 0,
    subTotalDisplay: "0.00",
    discount: 15.6,
    discountDisplay: "15.6",
    total: 0,
    totalDisplay: "0.00",
    couponText: "2张可用",
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
      list.push({ id: it.menu_id, name, price: price.toFixed(1), qty });
      subTotal += price * qty;
    }
    const subTotalDisplay = subTotal.toFixed(1);
    const discount = this.data.discount;
    const total = Math.max(subTotal - discount, 0);
    const totalDisplay = total.toFixed(1);
    this.setData({ items: list, subTotal, subTotalDisplay, total, totalDisplay });
  },
  continueAdd() {
    wx.navigateBack({ delta: 1 });
  },
  onRemark(e) {
    this.setData({ remark: e.detail.value || "" });
  },
  async goPay() {
    const cart = wx.getStorageSync("cart") || [];
    if (!cart.length) { wx.showToast({ title: "请先加菜", icon: "none" }); return; }
    const r = await request("/api/order/create", { method: "POST", data: { items: cart } });
    const order = r && r.order ? r.order : null;
    if (order) {
      wx.removeStorageSync("cart");
      wx.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
    }
  }
});
