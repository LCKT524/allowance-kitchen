import { request } from "../../utils/request";

Page({
  data: {
    logged: false,
    role: ""
  },
  selectRole(e) {
    const role = e.currentTarget.dataset.role;
    this.setData({ role });
    wx.setStorageSync("role", role);
  },
  onLogin() {
    wx.showLoading({ title: "正在登录" });
    wx.login({
      success: async (res) => {
        try {
          const code = res.code;
          const data = await request("/api/auth/wechat-login", { method: "POST", data: { code } });
          if (data && data.error) {
            const msg = (data.detail && (data.detail.errmsg || data.detail.errcode)) || data.error;
            wx.showToast({ title: `登录失败: ${msg}`, icon: "none" });
            return;
          }
          const token = data && data.token ? data.token : "";
          getApp().globalData.token = token;
          wx.setStorageSync("token", token);
          this.setData({ logged: !!token });
          wx.showToast({ title: "登录成功", icon: "success" });
        } catch (e) {
          wx.showToast({ title: "网络错误，请稍后重试", icon: "none" });
        } finally {
          wx.hideLoading();
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: "登录失败，请检查网络", icon: "none" });
      }
    });
  }
});