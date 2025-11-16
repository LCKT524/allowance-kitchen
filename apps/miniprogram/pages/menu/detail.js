import { request } from "../../utils/request";

Page({
  data: {
    item: {},
    imageSrc: "",
    priceDisplay: "0.00",
    calories: 0,
    cookWay: "",
    taste: "",
    description: "",
    ingredientsList: [],
    methodSteps: [],
    cartCount: 0,
    cartTotalDisplay: "0.00",
    editing: false,
    editName: "",
    editCategory: "vegetable",
    editIngredientsText: "",
    editMethodText: ""
  },
  async onLoad(query) {
    const id = query.id || "";
    this.id = id;
    await this.load(id);
    await this.loadCartTotals();
  },
  async load(id) {
    const data = await request(`/api/menu/detail?id=${id}`);
    const item = data && data.item ? data.item : {};
    const price = item.category === "meat" ? 3.0 : 1.5;
    const priceDisplay = price.toFixed(2);
    const calories = item.category === "meat" ? 640 : 240;
    const method = (item.method || "").includes("烤") ? "烤" : ((item.method || "").includes("炒") ? "炒" : "煮");
    const taste = (JSON.stringify(item.ingredients || "")).includes("辣") ? "辣" : "香";
    const imageSrc = item.source || "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop";
    const description = item.method || "这是一道清爽可口的菜品，营养均衡，适合情侣分享。";
    const ingredientsRaw = item.ingredients || {};
    const ingredientsList = Array.isArray(ingredientsRaw.list) ? ingredientsRaw.list : (typeof ingredientsRaw === "string" ? ingredientsRaw.split(/[、,，]/).map(s=>s.trim()).filter(Boolean) : []);
    const steps = [];
    const txt = item.method || "";
    const re = /第[一二三四五六七八九十百]+步[:：]\s*([^；。\n]+)/g;
    let m;
    while ((m = re.exec(txt)) !== null) { steps.push(m[1].trim()); }
    const methodSteps = steps.length ? steps : txt.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
    const editIngredientsText = ingredientsList.join("、");
    const editMethodText = item.method || "";
    const editName = item.name || "";
    const editCategory = item.category || "vegetable";
    this.setData({ item, imageSrc, priceDisplay, calories, cookWay: method, taste, description, ingredientsList, methodSteps, editIngredientsText, editMethodText, editName, editCategory });
  },
  toggleEdit() { this.setData({ editing: !this.data.editing }); },
  onEditName(e) { this.setData({ editName: e.detail.value || "" }); },
  onEditIngredients(e) { this.setData({ editIngredientsText: e.detail.value || "" }); },
  onEditMethod(e) { this.setData({ editMethodText: e.detail.value || "" }); },
  onEditCategory(e) { const v = e.currentTarget.dataset.v; this.setData({ editCategory: v }); },
  async saveEdit() {
    const id = this.id;
    const name = (this.data.editName || "").trim();
    const category = this.data.editCategory || "vegetable";
    const ingredients = { list: (this.data.editIngredientsText || "").split(/[、,，]/).map(s=>s.trim()).filter(Boolean) };
    const method = this.data.editMethodText || "";
    if (!id || !name) { wx.showToast({ title: "名称不能为空", icon: "none" }); return; }
    try {
      const r = await request("/api/menu/update", { method: "POST", data: { id, name, category, ingredients, method } });
      const item = r && r.item ? r.item : null;
      if (item) {
        wx.showToast({ title: "已保存", icon: "success" });
        this.setData({ editing: false });
        await this.load(id);
      } else {
        wx.showToast({ title: "保存失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "网络错误", icon: "none" });
    }
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
    this.loadCartTotals();
  },
  async loadCartTotals() {
    const cart = wx.getStorageSync("cart") || [];
    if (!cart.length) { this.setData({ cartCount: 0, cartTotalDisplay: "0.00" }); return; }
    const d = await request("/api/menu/list");
    const items = d && d.items ? d.items : [];
    const catMap = {};
    for (const it of items) catMap[it.id] = it.category;
    let total = 0;
    let count = 0;
    for (const it of cart) {
      const cat = catMap[it.menu_id];
      const price = cat === "meat" ? 3.0 : 1.5;
      const qty = it.quantity || 1;
      total += price * qty;
      count += qty;
    }
    this.setData({ cartCount: count, cartTotalDisplay: total.toFixed(2) });
  },
  goToOrder() {
    wx.navigateTo({ url: "/pages/order/index" });
  }
});
