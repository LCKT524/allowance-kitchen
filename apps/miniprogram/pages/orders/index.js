import { request } from "../../utils/request";

Page({
  data: { items: [], tab: "mine", loading: true, error: "", status: "all" },
  onLoad(query) { const tab = (query && query.tab) || ""; if (tab) this.setData({ tab }); },
  onShow() { this.load(); },
  async load() {
    try {
      const qStatus = this.data.tab === "mine" && this.data.status !== "all" ? `&status=${this.data.status}` : "";
      const data = await request(`/api/order/list?type=${this.data.tab}${qStatus}`);
      const base = data && data.items ? data.items : [];
      const enhanced = await Promise.all(base.map(async it => {
        try {
          const d = await request(`/api/order/detail?id=${it.id}`);
          const names = (d && d.items ? d.items : []).map(i => i.menu_name).filter(Boolean);
          const namesText = names.slice(0, 3).join("、") + (names.length > 3 ? "…" : "");
          const created = d && d.order && d.order.created_at ? d.order.created_at : "";
          const fmt = (t) => { if (!t) return ""; const x = new Date(t); const y = x.getFullYear(); const m = ("0"+(x.getMonth()+1)).slice(-2); const da = ("0"+x.getDate()).slice(-2); const hh = ("0"+x.getHours()).slice(-2); const mm = ("0"+x.getMinutes()).slice(-2); return `${y}-${m}-${da} ${hh}:${mm}`; };
          const st = (s) => s === "pending" ? "待接单" : s === "accepted" ? "已接单" : s === "in_progress" ? "进行中" : s === "completed" ? "已完成" : "";
          const sc = (s) => s === "pending" ? "status-pending" : s === "accepted" ? "status-accepted" : s === "in_progress" ? "status-inprogress" : s === "completed" ? "status-completed" : "";
          return { ...it, _names: namesText, _created_at: fmt(created), _statusText: st(it.status), _statusClass: sc(it.status) };
        } catch { return { ...it, _names: "", _created_at: "", _statusText: "", _statusClass: "" }; }
      }));
      this.setData({ items: enhanced, loading: false, error: "" });
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
      const conf = await new Promise(resolve => { wx.showModal({ title: "开始制作", content: "确定开始制作该订单？", success: r => resolve(!!r.confirm), fail: () => resolve(false) }); });
      if (!conf) return;
      const r = await request("/api/order/start", { method: "POST", data: { orderId: id } });
      if (r && r.order) wx.showToast({ title: "已开始制作", icon: "success" });
      else wx.showToast({ title: "操作失败", icon: "none" });
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
      const conf = await new Promise(resolve => { wx.showModal({ title: "取消接单", content: "确定取消该订单的接单？", success: r => resolve(!!r.confirm), fail: () => resolve(false) }); });
      if (!conf) return;
      const r = await request("/api/order/cancel", { method: "POST", data: { orderId: id } });
      if (r && r.order) wx.showToast({ title: "已取消接单", icon: "success" });
      else wx.showToast({ title: "操作失败", icon: "none" });
      this.load();
    } catch { wx.showToast({ title: "操作失败", icon: "none" }); }
  }
})