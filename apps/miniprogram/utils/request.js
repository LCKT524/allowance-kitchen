const BASE_URL = "https://allowance-kitchen.vercel.app";

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        ...(options.header || {}),
        ...(function(){
          const t = wx.getStorageSync("token") || "";
          return t ? { Authorization: `Bearer ${t}` } : {};
        })()
      },
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}