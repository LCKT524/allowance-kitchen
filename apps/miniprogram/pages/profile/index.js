import { request } from "../../utils/request";

Page({
  data: {
    logged: false,
    role: "",
    showAdminPanel: false,
    adminToken: ""
  },
  onShow() {
    const token = wx.getStorageSync("token") || "";
    const role = wx.getStorageSync("role") || "";
    const at = wx.getStorageSync("admin_token") || "";
    this.setData({ logged: !!token, role, adminToken: at });
  },
  selectRole(e) {
    const v = e.currentTarget.dataset.v || "";
    if (!v) return;
    wx.setStorageSync("role", v);
    this.setData({ role: v });
    wx.showToast({ title: "角色已选择", icon: "success" });
  },
  toggleRole(e) {
    const on = !!e.detail.value;
    const v = on ? "courier" : "diner";
    wx.setStorageSync("role", v);
    this.setData({ role: v });
    wx.showToast({ title: `已切换为${on?"接单角色":"点餐角色"}`, icon: "success" });
  },
  async goLogin() {
    const role = this.data.role || wx.getStorageSync("role") || "";
    if (!role) { wx.showToast({ title: "请先选择角色", icon: "none" }); return; }
    wx.showLoading({ title: "正在登录" });
    try { await request("/api/menu/list", { timeout: 5000, retry: 1 }); } catch (e) {}
    wx.login({
      success: async (res) => {
        try {
          const code = res.code;
          let data = await request("/api/auth/wechat-login?strict=1", { method: "POST", data: { code }, timeout: 30000, retry: 1 });
          if (data && data.error) {
            const dev = await request("/api/auth/wechat-login?dev=1");
            data = dev;
            if (!data || !data.token) {
              const msg = data && data.detail ? (data.detail.errmsg || data.detail.errcode || data.error) : (data.error || "登录失败");
              wx.showToast({ title: String(msg), icon: "none" });
              return;
            }
          }
          const token = data && data.token ? data.token : "";
          getApp().globalData.token = token;
          wx.setStorageSync("token", token);
          this.setData({ logged: !!token });
          wx.showToast({ title: "登录成功", icon: "success" });
          wx.reLaunch({ url: "/pages/home/index" });
        } catch (e) { wx.showToast({ title: "网络错误", icon: "none" }); }
        finally { wx.hideLoading(); }
      },
      fail: () => { wx.hideLoading(); wx.showToast({ title: "登录失败", icon: "none" }); }
    });
  },
  async diagnose() {
    wx.showLoading({ title: "检测中" });
    try {
      const r = await request("/api/menu/list");
      const count = (r && r.items && Array.isArray(r.items)) ? r.items.length : 0;
      wx.showToast({ title: `接口正常(${count})`, icon: "success" });
    } catch (e) {
      wx.showToast({ title: "接口不可达", icon: "none" });
    } finally { wx.hideLoading(); }
  },
  logout() {
    wx.removeStorageSync("token");
    getApp().globalData.token = "";
    this.setData({ logged: false });
    wx.showToast({ title: "已退出", icon: "success" });
  },
  goManage() { this.setData({ showAdminPanel: true }); },
  closeAdminPanel() { this.setData({ showAdminPanel: false }); },
  noop() {},
  onAdminTokenInput(e) { this.setData({ adminToken: e.detail.value || "" }); },
  saveAdminToken() {
    const v = (this.data.adminToken || "").trim();
    if (!v) { wx.showToast({ title: "令牌不能为空", icon: "none" }); return; }
    wx.setStorageSync("admin_token", v);
    wx.showToast({ title: "已保存令牌", icon: "success" });
  },
  clearAdminToken() {
    wx.removeStorageSync("admin_token");
    this.setData({ adminToken: "" });
    wx.showToast({ title: "已清除令牌", icon: "success" });
  },
  goManageMenu() { wx.navigateTo({ url: "/pages/menu/index?openAdmin=1" }); }
});
