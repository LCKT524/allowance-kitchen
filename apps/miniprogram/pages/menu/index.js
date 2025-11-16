import { request } from "../../utils/request";

Page({
  data: {
    items: [],
    loading: true,
    error: "",
    categoryFilter: "all",
    searchKey: ""
  },
  onShow() {
    this.load();
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
});
