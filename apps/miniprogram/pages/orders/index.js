import { request } from "../../utils/request";

Page({
  data: { items: [], tab: "mine", loading: true, error: "", status: "all" },
  onShow() { this.load(); },
  showMine() { this.setData({ tab: "mine" }); this.load(); },
  showAvailable() { this.setData({ tab: "available" }); this.load(); },
  async load() {
    try {
      const qStatus = this.data.tab === "mine" && this.data.status !== "all" ? `&status=${this.data.status}` : "";
      const data = await request(`/api/order/list?type=${this.data.tab}${qStatus}`);
      this.setData({ items: data && data.items ? data.items : [], loading: false, error: "" });
    } catch (e) {
      this.setData({ loading: false, error: "加载失败，请稍后重试" });
    }
  },
  setStatus(e) {
    const v = e.currentTarget.dataset.v;
    this.setData({ status: v, loading: true });
    this.load();
  },
  async accept(e) {
    try {
      const id = e.currentTarget.dataset.id;
      const token = wx.getStorageSync("token") || "";
      if (!token) { wx.showToast({ title: "请先登录", icon: "none" }); wx.navigateTo({ url: "/pages/home/index" }); return; }
      await request("/api/order/accept", { method: "POST", data: { orderId: id } });
      this.load();
    } catch (e) {
      wx.showToast({ title: "接单失败", icon: "none" });
    }
  },
  async start(e) {
    try {
      const id = e.currentTarget.dataset.id;
      const token = wx.getStorageSync("token") || "";
      if (!token) { wx.showToast({ title: "请先登录", icon: "none" }); wx.navigateTo({ url: "/pages/home/index" }); return; }
      const r = await request("/api/order/start", { method: "POST", data: { orderId: id } });
      if (r && r.order) wx.showToast({ title: "已开始", icon: "success" });
      this.load();
    } catch { wx.showToast({ title: "操作失败", icon: "none" }); }
  },
  async complete(e) {
    try {
      const id = e.currentTarget.dataset.id;
      const token = wx.getStorageSync("token") || "";
      if (!token) { wx.showToast({ title: "请先登录", icon: "none" }); wx.navigateTo({ url: "/pages/home/index" }); return; }
      const r = await request("/api/order/complete", { method: "POST", data: { orderId: id } });
      if (r && r.order) wx.showToast({ title: "已完成", icon: "success" });
      this.load();
    } catch { wx.showToast({ title: "操作失败", icon: "none" }); }
  },
  async cancel(e) {
    try {
      const id = e.currentTarget.dataset.id;
      const token = wx.getStorageSync("token") || "";
      if (!token) { wx.showToast({ title: "请先登录", icon: "none" }); wx.navigateTo({ url: "/pages/home/index" }); return; }
      const r = await request("/api/order/cancel", { method: "POST", data: { orderId: id } });
      if (r && r.order) wx.showToast({ title: "已取消接单", icon: "success" });
      this.load();
    } catch { wx.showToast({ title: "操作失败", icon: "none" }); }
  }
})