import { request } from "../../utils/request";

Page({
  data: {
    items: [],
    loading: true,
    error: "",
    categoryFilter: "all",
    searchKey: "",
    adminMode: false,
    adminToken: "",
    addMode: false,
    newName: "",
    newCategory: "vegetable",
    newIngredientsText: "",
    newMethodText: "",
    selectedMap: {},
    selectedCount: 0
  },
  onShow() {
    const at = wx.getStorageSync("admin_token") || "";
    this.setData({ adminToken: at });
    this.verifyToken().then(ok => this.setData({ adminMode: !!ok })).finally(() => this.load());
  },
  async load() {
    try {
      const q = this.data.categoryFilter !== "all" ? `?category=${this.data.categoryFilter}` : "";
      const data = await request(`/api/menu/list${q}`);
      let items = (data && data.items) ? data.items : [];
      const key = (this.data.searchKey || "").trim();
      if (key) items = items.filter(i => (i.name || "").includes(key));
      this.setData({ items, loading: false, error: "" });
    } catch (e) {
      this.setData({ loading: false, error: "加载失败，请稍后重试" });
    }
  },
  setFilter(e) {
    const v = e.currentTarget.dataset.v;
    this.setData({ categoryFilter: v, loading: true });
    this.load();
  },
  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value || "", loading: true });
    this.load();
  },
  toggleAdmin(e) {
    const v = !!e.detail.value;
    if (!v) { this.setData({ adminMode: false }); return; }
    if (!this.data.adminToken) { wx.showToast({ title: "请先输入令牌", icon: "none" }); this.setData({ adminMode: false }); return; }
    this.verifyToken().then(ok => {
      this.setData({ adminMode: !!ok });
      if (!ok) wx.showToast({ title: "令牌无效", icon: "none" });
    });
  },
  onAdminTokenInput(e) {
    this.setData({ adminToken: e.detail.value || "" });
  },
  saveAdminToken() {
    const v = (this.data.adminToken || "").trim();
    if (!v) { wx.showToast({ title: "令牌不能为空", icon: "none" }); return; }
    wx.setStorageSync("admin_token", v);
    this.verifyToken().then(ok => {
      this.setData({ adminMode: !!ok });
      wx.showToast({ title: ok ? "已启用管理模式" : "令牌无效", icon: ok ? "success" : "none" });
    });
  },
  async verifyToken() {
    try {
      const r = await request("/api/admin/verify");
      return !!(r && r.ok);
    } catch { return false; }
  },
  toggleAddMode() { this.setData({ addMode: !this.data.addMode }); },
  onNewName(e) { this.setData({ newName: e.detail.value || "" }); },
  onNewCategory(e) { const v = e.currentTarget.dataset.v; this.setData({ newCategory: v }); },
  onNewIngredients(e) { this.setData({ newIngredientsText: e.detail.value || "" }); },
  onNewMethod(e) { this.setData({ newMethodText: e.detail.value || "" }); },
  async createItem() {
    const name = (this.data.newName || "").trim();
    const category = this.data.newCategory || "vegetable";
    const ingredients = { list: (this.data.newIngredientsText || "").split(/[、,，]/).map(s=>s.trim()).filter(Boolean) };
    const method = this.data.newMethodText || "";
    if (!name) { wx.showToast({ title: "名称不能为空", icon: "none" }); return; }
    try {
      const r = await request("/api/menu/create", { method: "POST", data: { name, category, ingredients, method, source: "manual" } });
      const item = r && r.item ? r.item : null;
      if (item) {
        wx.showToast({ title: "已新增", icon: "success" });
        this.setData({ addMode: false, newName: "", newIngredientsText: "", newMethodText: "" });
        this.load();
      } else {
        wx.showToast({ title: "新增失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "网络错误", icon: "none" });
    }
  },
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const checked = (e.detail && e.detail.value || []).includes(id);
    const map = { ...this.data.selectedMap, [id]: checked };
    let count = 0; for (const k in map) if (map[k]) count++;
    this.setData({ selectedMap: map, selectedCount: count });
  },
  selectAll() {
    const map = {};
    for (const it of this.data.items) map[it.id] = true;
    this.setData({ selectedMap: map, selectedCount: this.data.items.length });
  },
  clearSelection() { this.setData({ selectedMap: {}, selectedCount: 0 }); },
  clearAdminToken() {
    wx.removeStorageSync("admin_token");
    this.setData({ adminToken: "", adminMode: false });
    wx.showToast({ title: "已清除令牌", icon: "success" });
  },
  async deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const conf = await new Promise(resolve => {
      wx.showModal({ title: "删除菜单", content: "确定删除该菜品吗？", success: r => resolve(!!r.confirm), fail: () => resolve(false) });
    });
    if (!conf) return;
    try {
      const r = await request("/api/menu/delete", { method: "POST", data: { id } });
      if (r && r.ok) {
        wx.showToast({ title: "已删除", icon: "success" });
        this.load();
      } else {
        wx.showToast({ title: "删除失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "网络错误", icon: "none" });
    }
  }
  ,
  async bulkDelete() {
    const ids = Object.keys(this.data.selectedMap).filter(k => this.data.selectedMap[k]);
    if (!ids.length) { wx.showToast({ title: "未选择项目", icon: "none" }); return; }
    const conf = await new Promise(resolve => {
      wx.showModal({ title: "批量删除", content: `确定删除选中的 ${ids.length} 项吗？`, success: r => resolve(!!r.confirm), fail: () => resolve(false) });
    });
    if (!conf) return;
    try {
      for (const id of ids) {
        await request("/api/menu/delete", { method: "POST", data: { id } });
      }
      wx.showToast({ title: "已删除", icon: "success" });
      this.clearSelection();
      this.load();
    } catch (err) {
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  }
});
