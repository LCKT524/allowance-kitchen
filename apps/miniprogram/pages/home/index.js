import { request } from "../../utils/request";

Page({
  data: {
    logged: false
  },
  onLogin() {
    wx.login({
      success: async (res) => {
        const code = res.code;
        const data = await request("/api/auth/wechat-login", { method: "POST", data: { code } });
        const token = data && data.token ? data.token : "";
        getApp().globalData.token = token;
        wx.setStorageSync("token", token);
        this.setData({ logged: !!token });
      }
    });
  }
});