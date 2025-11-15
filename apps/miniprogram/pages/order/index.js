import { request } from "../../utils/request";

Page({
  data: { menus: [], selected: {}, quantities: {} },
  onShow() { this.loadMenus(); },
  async loadMenus() {
    const d = await request("/api/menu/list");
    this.setData({ menus: d && d.items ? d.items : [] });
  },
  toggle(e) {
    const id = e.currentTarget.dataset.id;
    const sel = this.data.selected;
    sel[id] = !sel[id];
    this.setData({ selected: sel });
  },
  setQty(e) {
    const id = e.currentTarget.dataset.id;
    const q = this.data.quantities;
    q[id] = Number(e.detail.value || 1);
    this.setData({ quantities: q });
  },
  async submit() {
    const items = Object.keys(this.data.selected).filter(id => this.data.selected[id]).map(id => ({ menu_id: id, quantity: this.data.quantities[id] || 1 }));
    if (!items.length) return;
    const r = await request("/api/order/create", { method: "POST", data: { items } });
    const order = r && r.order ? r.order : null;
    if (order) wx.navigateTo({ url: `/pages/order-detail/index?id=${order.id}` });
  }
})