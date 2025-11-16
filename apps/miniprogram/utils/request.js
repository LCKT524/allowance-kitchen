const BASE_URL = "https://allowance-kitchen.vercel.app";

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const doReq = () => wx.request({
      url: BASE_URL + path,
      method: options.method || "GET",
      data: options.data || {},
      header: {
        "Content-Type": "application/json",
        ...(options.header || {}),
        ...(function(){
          const t = wx.getStorageSync("token") || "";
          return t ? { Authorization: `Bearer ${t}` } : {};
        })(),
        ...(function(){
          const at = wx.getStorageSync("admin_token") || "";
          return at ? { "X-Admin-Token": at } : {};
        })(),
        ...(function(){
          const role = wx.getStorageSync("role") || "";
          return role ? { "X-Role": role } : {};
        })()
      },
      timeout: options.timeout || 20000,
      success: (res) => resolve(res.data),
      fail: (err) => {
        try { wx.showToast({ title: (err && err.errMsg) ? err.errMsg : "网络错误", icon: "none" }); } catch {}
        if ((options._retried ? 1 : 0) < (options.retry || 1) && String(err.errMsg || "").includes("timeout")) {
          setTimeout(() => {
            request(path, { ...options, _retried: 1 }).then(resolve).catch(reject);
          }, 500);
        } else {
          reject(err);
        }
      }
    });
    doReq();
  });
}
