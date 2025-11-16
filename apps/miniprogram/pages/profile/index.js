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
  async goLogin() {
    wx.showLoading({ title: "正在登录" });
    wx.login({
      success: async (res) => {
        try {
          const code = res.code;
          let data = await request("/api/auth/wechat-login", { method: "POST", data: { code } });
          if (data && data.error) {
            data = await request("/api/auth/wechat-login?dev=1");
            if (!data || !data.token) { wx.showToast({ title: "登录失败", icon: "none" }); return; }
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
