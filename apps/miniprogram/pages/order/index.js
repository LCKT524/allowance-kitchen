import { request } from "../../utils/request";

Page({
  data: {
    menus: [],
    viewMenus: [],
    filteredMenus: [],
    selected: {},
    quantities: {},
    categories: [],
    currentCategory: "popular",
    orderType: "dine_in",
    storeName: "中海大厦店",
    distance: "1.2km",
    total: 0,
    totalDisplay: "0.00",
    cartCount: 0
  },
  onShow() { this.prefillCart(); this.loadMenus(); },
  prefillCart() {
    const cart = wx.getStorageSync("cart") || [];
    const selected = {};
    const quantities = {};
    for (const it of cart) {
      selected[it.menu_id] = true;
      quantities[it.menu_id] = it.quantity || 1;
    }
    this.setData({ selected, quantities });
  },
  async loadMenus() {
    const d = await request("/api/menu/list");
    const items = d && d.items ? d.items : [];
    const viewMenus = items.map(it => ({
      id: it.id,
      name: it.name,
      category: it.category,
      price: it.category === "meat" ? 3.0 : 1.5
    }));
    const cats = [];
    const seen = {};
    const meta = {
      popular: { id: "popular", name: "人气", icon: "🔥" },
      vegetable: { id: "vegetable", name: "轻食系列", icon: "🥗" },
      meat: { id: "meat", name: "牛排系列", icon: "🍽️" }
    };
    cats.push(meta.popular);
    for (const v of viewMenus) { if (!seen[v.category]) { seen[v.category] = true; cats.push(meta[v.category]); } }
    this.setData({ menus: items, viewMenus, categories: cats, currentCategory: "popular" });
    this.applyFilter();
    this.updateTotals();
  },
  applyFilter() {
    const cur = this.data.currentCategory;
    const list = cur === "popular" ? this.data.viewMenus : this.data.viewMenus.filter(i => i.category === cur);
    this.setData({ filteredMenus: list });
  },
  selectCategory(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ currentCategory: id });
    this.applyFilter();
  },
  switchType(e) {
    const t = e.currentTarget.dataset.type;
    this.setData({ orderType: t });
  },
  increase(e) {
    const id = e.currentTarget.dataset.id;
    const q = { ...this.data.quantities };
    q[id] = (q[id] || 0) + 1;
    const sel = { ...this.data.selected };
    sel[id] = true;
    this.setData({ quantities: q, selected: sel });
    this.updateTotals();
    this.updateCartStorage();
  },
  decrease(e) {
    const id = e.currentTarget.dataset.id;
    const q = { ...this.data.quantities };
    const cur = q[id] || 0;
    const next = cur > 0 ? cur - 1 : 0;
    q[id] = next;
    const sel = { ...this.data.selected };
    sel[id] = next > 0;
    this.setData({ quantities: q, selected: sel });
    this.updateTotals();
    this.updateCartStorage();
  },
  updateTotals() {
    const priceMap = {};
    for (const i of this.data.viewMenus) priceMap[i.id] = i.price;
    let total = 0;
    let count = 0;
    const q = this.data.quantities;
    for (const id in q) {
      const qty = q[id] || 0;
      if (qty > 0) {
        total += qty * (priceMap[id] || 0);
        count += qty;
      }
    }
    const totalDisplay = total.toFixed(2);
    this.setData({ total, totalDisplay, cartCount: count });
  },
  updateCartStorage() {
    const items = [];
    const q = this.data.quantities;
    for (const id in q) {
      const qty = q[id] || 0;
      if (qty > 0) items.push({ menu_id: id, quantity: qty });
    }
    wx.setStorageSync("cart", items);
  },
  async submit() {
    const items = [];
    const q = this.data.quantities;
    for (const id in q) {
      const qty = q[id] || 0;
      if (qty > 0) items.push({ menu_id: id, quantity: qty });
    }
    if (!items.length) return;
    wx.setStorageSync("cart", items);
    wx.navigateTo({ url: "/pages/checkout/index" });
  }
})
