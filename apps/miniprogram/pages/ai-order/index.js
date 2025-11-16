import { request } from "../../utils/request";

function genId() { return Math.random().toString(36).slice(2); }

Page({
  data: { messages: [], loading: false, lastId: "top" },
  pushMessage(msg) {
    const list = [...this.data.messages, msg];
    const lastId = msg.id;
    this.setData({ messages: list, lastId });
  },
  async send(e) {
    const content = e.detail.value.content;
    if (!content) return;
    const userMsg = { id: genId(), role: "user", type: "text", text: content };
    this.pushMessage(userMsg);
    await this.requestRecommendation(content);
  },
  async requestRecommendation(prompt) {
    try {
      this.setData({ loading: true });
      const history = this.data.messages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.type === "text" ? m.text : (m.rec && m.rec.raw ? m.rec.raw : "推荐一个菜品") }));
      const d = await request("/api/ai/recommend", { method: "POST", data: { prompt, history } });
      const rec = d && d.recommendation ? d.recommendation : null;
      if (rec) {
        rec.ingredientsText = Array.isArray(rec.ingredients) ? rec.ingredients.join("、") : (typeof rec.ingredients === "string" ? rec.ingredients : "");
        const msg = { id: genId(), role: "assistant", type: "rec", rec };
        this.pushMessage(msg);
      }
    } catch (e) {
      wx.showToast({ title: "生成失败，请重试", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  },
  async reject() {
    const lastUserNeed = this.data.messages.findLast ? this.data.messages.findLast(m => m.role === "user" && m.type === "text") : [...this.data.messages].reverse().find(m => m.role === "user" && m.type === "text");
    const base = lastUserNeed ? lastUserNeed.text : "继续推荐一个不同的菜品";
    const prompt = base + "，不满意，请再推荐一个不同风格的菜品。";
    await this.requestRecommendation(prompt);
  },
  async accept(e) {
    const lastRec = this.data.messages.findLast ? this.data.messages.findLast(m => m.type === "rec") : [...this.data.messages].reverse().find(m => m.type === "rec");
    if (!lastRec) return;
    const name = lastRec.rec.name;
    const category = lastRec.rec.category || "vegetable";
    const ingredients = { list: lastRec.rec.ingredients };
    const method = lastRec.rec.method || lastRec.rec.raw || "";
    try {
      this.setData({ loading: true });
      const existing = await request("/api/menu/list?name=" + encodeURIComponent(name));
      const items = existing && existing.items ? existing.items : [];
      let menu = items && items.length ? items[0] : null;
      if (!menu) {
        const created = await request("/api/menu/create", { method: "POST", data: { name, category, ingredients, method, source: "ai" } });
        menu = created && created.item ? created.item : null;
      }
      if (menu && menu.id) {
        const cart = wx.getStorageSync("cart") || [];
        const exists = cart.find(i => i.menu_id === menu.id);
        if (exists) exists.quantity = (exists.quantity || 1) + 1; else cart.push({ menu_id: menu.id, quantity: 1 });
        wx.setStorageSync("cart", cart);
        wx.showToast({ title: "已加入购物车", icon: "success" });
        wx.navigateTo({ url: "/pages/checkout/index" });
      }
    } catch (err) {
      wx.showToast({ title: "加入失败", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  }
})
