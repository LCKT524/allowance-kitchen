import { request } from "../../utils/request";

Page({
  data: { item: null },
  async submit(e) {
    const prompt = e.detail.value.prompt;
    if (!prompt) return;
    const d = await request("/api/ai/suggest-and-create", { method: "POST", data: { prompt } });
    this.setData({ item: d && d.item ? d.item : null });
  }
})