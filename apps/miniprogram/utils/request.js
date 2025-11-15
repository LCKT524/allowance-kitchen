const BASE_URL = "";

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        ...(options.header || {})
      },
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}