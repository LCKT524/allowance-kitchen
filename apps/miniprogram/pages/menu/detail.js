import { request } from "../../utils/request";

Page({
  data: {
    item: {}
  },
  onLoad(query) {
    const id = query.id || "";
    this.load(id);
  },
  async load(id) {
    const data = await request(`/api/menu/detail?id=${id}`);
    this.setData({ item: data && data.item ? data.item : {} });
    this.id = id;
  },
  addToCart() {
    const cart = wx.getStorageSync("cart") || [];
    const exists = cart.find(i => i.menu_id === this.id);
    if (exists) {
      exists.quantity = (exists.quantity || 1) + 1;
    } else {
      cart.push({ menu_id: this.id, quantity: 1 });
    }
    wx.setStorageSync("cart", cart);
    wx.showToast({ title: "已加入购物车", icon: "success" });
    wx.navigateTo({ url: "/pages/order/index" });
  }
});