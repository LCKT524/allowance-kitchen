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
  goLogin() { wx.navigateTo({ url: "/pages/home/index" }); },
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
