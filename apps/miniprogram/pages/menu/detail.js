import { request } from "../../utils/request";

Page({
  data: {
    item: {}
  },
  onLoad(query) {
    const id = query.id || "";
    this.load(id);
  },
  async load(id) {
    const data = await request(`/api/menu/detail?id=${id}`);
    this.setData({ item: data && data.item ? data.item : {} });
  }
});