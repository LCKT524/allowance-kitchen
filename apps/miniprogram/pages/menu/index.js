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
  }
});