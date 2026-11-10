import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { formatDate, formatMoney, type Row } from "./data";
import { translateCategory, type Locale } from "./locales";

export function CustomerDetail({
  customer,
  orders,
  lang,
  t,
  onClose,
}: {
  customer: Row;
  orders: Row[];
  lang: Locale;
  t: (key: string) => string;
  onClose: () => void;
}) {
  const linked = orders.filter((o) => o.name === customer.name),
    spend = linked.reduce((sum, o) => sum + (o.price || 0), 0);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog order-detail" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div>
            <small>{t("Customer_profile")}</small>
            <h3>{customer.name}</h3>
          </div>
          <button className="action" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="detail-grid">
          <span>{t("Email")}</span>
          <b>{customer.email}</b>
          <span>{t("Phone")}</span>
          <b>{customer.phone || "—"}</b>
          <span>{t("Registered")}</span>
          <b>{formatDate(customer.registeredAt, lang)}</b>
          <span>{t("Address")}</span>
          <b>{customer.address || "—"}</b>
          <span>{t("Customer_ID")}</span>
          <b>{customer.id}</b>
          <span>{t("Orders")}</span>
          <b>{linked.length}</b>
          <span>{t("Total_spend")}</span>
          <b>{formatMoney(spend, lang)}</b>
          <span>{t("Average_order")}</span>
          <b>{formatMoney(linked.length ? spend / linked.length : 0, lang)}</b>
        </div>
        <div className="history">
          <b>{t("Order_history")}</b>
          {linked.length ? (
            linked.map((o) => (
              <div key={o.id}>
                <i />
                <span>
                  <strong>
                    {o.id} · {formatMoney(o.price, lang)}
                  </strong>
                  <small>
                    {formatDate(o.date, lang)} · {o.status}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <small>{t("No_orders")}</small>
          )}
        </div>
      </div>
    </div>
  );
}
export function OrderDetail({
  order,
  history,
  lang,
  t,
  onClose,
  onStatus,
  onPayment,
}: {
  order: Row;
  history: Row[];
  lang: Locale;
  t: (key: string) => string;
  onClose: () => void;
  onStatus: (status: string, note: string) => void;
  onPayment: (status: string, note: string) => void;
}) {
  const [status, setStatus] = React.useState(order.status);
  const [note, setNote] = React.useState("");
  const [paymentStatus, setPaymentStatus] = React.useState(
    order.paymentStatus || "Pending",
  );
  const [paymentNote, setPaymentNote] = React.useState("");
  const orderItems = order.items?.length
    ? order.items
    : [
        {
          productId: order.productId || order.id,
          productName: order.productName || t("Catalog_item"),
          sku: order.sku || order.productId || "",
          quantity: order.quantity || 1,
          unitPrice:
            ((order.price || 0) - (order.shipping || 0) - (order.tax || 0)) /
            (order.quantity || 1),
        },
      ];
  const events = history.filter((h) => h.name === order.id);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="dialog order-detail" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div>
            <small>{t("Order_details")}</small>
            <h3>{order.id}</h3>
          </div>
          <button className="action" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="detail-grid">
          <span>{t("Customer")}</span>
          <b>{order.name}</b>
          <span>{t("Order_date")}</span>
          <b>{formatDate(order.date, lang)}</b>
          <span>{t("Payment")}</span>
          <b>{t(order.paymentStatus || "Paid")}</b>
          <span>{t("Total")}</span>
          <b>{formatMoney(order.price, lang)}</b>
          <span>{t("Current_status")}</span>
          <b>{t(order.status)}</b>
        </div>
        <div className="itemized">
          <b>{t("Items")}</b>
          {orderItems.map((item, index) => (
            <div className="order-detail-line" key={`${item.productId}-${index}`}>
              <span>
                {item.productName}
                <small>
                  {item.sku} · {t("Quantity")} {item.quantity} ×{" "}
                  {formatMoney(item.unitPrice, lang)}
                </small>
              </span>
              <strong>
                {formatMoney(item.unitPrice * item.quantity, lang)}
              </strong>
            </div>
          ))}
          <div>
            <span>{t("Shipping")}</span>
            <strong>{formatMoney(order.shipping, lang)}</strong>
          </div>
          <div>
            <span>{t("Tax")}</span>
            <strong>{formatMoney(order.tax, lang)}</strong>
          </div>
          <div className="grand-total">
            <span>{t("Total")}</span>
            <strong>{formatMoney(order.price, lang)}</strong>
          </div>
          <small>
            {t("Ship_to")}: {order.address || t("Address_missing")}
          </small>
        </div>
        <label>
          {t("Payment_status")}
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
          >
            {["Pending", "Paid", "Refunded"].map((option) => (
              <option key={option} value={option}>{t(option)}</option>
            ))}
          </select>
        </label>
        <label>
          {t("Payment_note")}
          <input
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder={t("Optional_note")}
          />
        </label>
        <button
          className="primary"
          disabled={
            paymentStatus === (order.paymentStatus || "Pending") &&
            !paymentNote.trim()
          }
          onClick={() => {
            onPayment(paymentStatus, paymentNote);
            setPaymentNote("");
          }}
        >
          {t("Update_payment")}
        </button>
        <label>
          {t("Update_fulfillment")}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
        </label>
        <label>
          {t("Status_note")}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("Optional_note")}
          />
        </label>
        <button
          className="primary"
          onClick={() => {
            if (status === "Cancelled" && !window.confirm(t("Cancel_confirm")))
              return;
            onStatus(status, note);
            setNote("");
          }}
        >
          {t("Save_status")}
        </button>
        <div className="history">
          <b>{t("Status_history")}</b>
          {events.length ? (
            events.map((e) => (
              <div key={e.id}>
                <i />
                <span>
                  <strong>
                    {e.historyType === "payment"
                      ? `${t("Payment")}: ${t(e.status)}`
                      : t(e.status)}
                  </strong>
                  <small>
                    {formatDate(e.date, lang)}
                    {e.note ? " · " + e.note : ""}
                  </small>
                </span>
              </div>
            ))
          ) : (
            <small>{t("No_updates")}</small>
          )}
        </div>
      </div>
    </div>
  );
}
function notificationLabel(name: string, t: (key: string) => string) {
  const delivered = name.match(/^Order (.+) was delivered$/);
  if (delivered) return t("Order_delivered").replace("{id}", delivered[1]);
  const stock = name.match(/^Stock is running low: (.+)$/);
  if (stock) return t("Stock_warning").replace("{product}", stock[1]);
  const received = name.match(/^New order (.+) received$/);
  if (received) return t("Order_received").replace("{id}", received[1]);
  return name;
}
export function Notifications({
  rows,
  onUpdate,
  lang,
  t,
}: {
  rows: Row[];
  onUpdate: (rows: Row[]) => void;
  lang: Locale;
  t: (key: string) => string;
}) {
  return (
    <div className="panel inbox">
      <div className="panel-head">
        <div>
          <h3>{t("Notifications")}</h3>
          <p>{t("Notification_copy")}</p>
        </div>
        <div className="inbox-actions">
          <button
            className="select"
            onClick={() =>
              onUpdate(rows.map((r) => ({ ...r, status: "Read" })))
            }
          >
            {t("Mark_all_read")}
          </button>
          <button className="select" onClick={() => onUpdate([])}>
            {t("Clear_all")}
          </button>
        </div>
      </div>
      {rows.length ? (
        rows.map((r) => (
          <div key={r.id} className={"notice " + (r.status === "Unread" ? "unread" : "")}>
            <span className="notice-dot" />
            <div>
              <b>{notificationLabel(r.name, t)}</b>
              <small>
                {formatDate(r.date, lang)} · {r.id}
              </small>
            </div>
            {r.status === "Unread" && (
              <button
                className="link"
                onClick={() =>
                  onUpdate(
                    rows.map((x) =>
                      x.id === r.id ? { ...x, status: "Read" } : x,
                    ),
                  )
                }
              >
                {t("Mark_read")}
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="empty">{t("All_caught_up")}</div>
      )}
    </div>
  );
}
export function Overview({
  db,
  t,
  lang,
}: {
  db: Record<string, Row[]>;
  t: (key: string) => string;
  lang: Locale;
}) {
  const now = Date.now(),
    recent30 = db.Orders.filter(
      (o) => (now - new Date(o.date || "").getTime()) / 86400000 <= 30,
    ),
    lowStock = db.Inventory.filter((i) => (i.stock || 0) <= 10).slice(0, 6),
    salesByProduct = new Map<string, number>();
  for (const o of recent30)
    if (o.productId)
      salesByProduct.set(
        o.productId,
        (salesByProduct.get(o.productId) || 0) + (o.quantity || 1),
      );
  const topSellers = [...salesByProduct]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, units]) => ({
      product: db.Products.find((p) => p.id === id),
      units,
    }));
  const series = Array.from({ length: 7 }, (_, bucket) =>
      db.Orders.filter((o) => {
        const age = (now - new Date(o.date || "").getTime()) / 86400000;
        return age >= bucket * 5 && age < (bucket + 1) * 5;
      }).reduce((sum, o) => sum + (o.price || 0), 0),
    ),
    max = Math.max(1, ...series),
    chartPoints = series
      .map((v, i) => `${(i * 700) / 6},${205 - (v / max) * 175}`)
      .join(" "),
    chartPath = `M${chartPoints.replace(/ /g, ",")} `,
    total = db.Orders.length || 1,
    delivered = db.Orders.filter((o) => o.status === "Delivered").length,
    processing = db.Orders.filter(
      (o) => o.status === "Processing" || o.status === "Shipped",
    ).length,
    pending = total - delivered - processing,
    dp = Math.round((delivered / total) * 100),
    pp = Math.round((processing / total) * 100),
    xp = Math.max(0, 100 - dp - pp);
  return (
    <>
      <div className="stats">
        {[
          [
            t("Total_revenue"),
            formatMoney(
              recent30.reduce((s, o) => s + (o.price || 0), 0),
              lang,
            ),
            "+12.8%",
          ],
          [t("Total_orders"), String(db.Orders.length), " +8.2%"],
          [t("Total_customers"), String(db.Customers.length), "+5.4%"],
          [t("Conversion"), "3.24%", "+1.2%"],
        ].map((x) => (
          <article className="stat" key={x[0]}>
            <div>
              {x[0]} <MoreHorizontal size={16} />
            </div>
            <h2>{x[1]}</h2>
            <small>
              <strong>↗ {x[2]}</strong> {t("Vs_last_month")}
            </small>
          </article>
        ))}
      </div>
      <div className="grid">
        <article className="panel sales">
          <div className="panel-head">
            <div>
              <h3>{t("Sales_overview")}</h3>
              <p>{t("Track_revenue")}</p>
            </div>
            <button className="select">
              {t("Last_30_days")} <ChevronDown size={15} />
            </button>
          </div>
          <div className="chart">
            <div className="ylabels">
              <span>€8k</span>
              <span>€6k</span>
              <span>€4k</span>
              <span>€2k</span>
              <span>€0</span>
            </div>
            <svg viewBox="0 0 700 230" preserveAspectRatio="none">
              <path d={`${chartPath}L700,230 L0,230 Z`} fill="#7557e822" />
              <path
                d={chartPath}
                fill="none"
                stroke="#7557e8"
                strokeWidth="3"
              />
            </svg>
            <div className="xlabels">
              <span>{t("Units_30")}</span>
              <span>{t("Units_25")}</span>
              <span>{t("Units_20")}</span>
              <span>{t("Units_15")}</span>
              <span>{t("Units_10")}</span>
              <span>{t("Units_5")}</span>
              <span>{t("Today")}</span>
            </div>
          </div>
        </article>
        <article className="panel fulfillment">
          <div className="panel-head">
            <div>
              <h3>{t("Order_fulfillment")}</h3>
              <p>{t("Fulfillment_copy")}</p>
            </div>
            <MoreHorizontal size={18} />
          </div>
          <div className="donut-wrap">
            <div
              className="donut"
              style={{
                background: `conic-gradient(#7358df 0 ${dp}%,#b5a7f0 ${dp}% ${dp + pp}%,#f5a45f ${dp + pp}% 100%)`,
              }}
            >
              <div>
                <b>{db.Orders.length}</b>
                <small>{t("Total_orders")}</small>
              </div>
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="purple" />
              {t("Delivered")} <b>{dp}%</b>
            </span>
            <span>
              <i className="lavender" />
              {t("Processing")} <b>{pp}%</b>
            </span>
            <span>
              <i className="orange" />
              {t("Pending")} <b>{xp}%</b>
            </span>
          </div>
        </article>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>{t("Recent_orders")}</h3>
            <p>{t("Latest_orders")}</p>
          </div>
          <NavLink className="link" to="/orders">
            {t("View_all")}
          </NavLink>
        </div>
        <table>
          <thead>
            <tr>
              <th>{t("Order")}</th>
              <th>{t("Customer")}</th>
              <th>{t("Date_header")}</th>
              <th>{t("Status_header")}</th>
              <th>{t("Total_header")}</th>
            </tr>
          </thead>
          <tbody>
            {db.Orders.slice(0, 5).map((r) => (
              <tr key={r.id}>
                <td>
                  <b>{r.id}</b>
                </td>
                <td>{r.name}</td>
                <td>{formatDate(r.date, lang)}</td>
                <td>
                  <label className="badge green">{t(r.status)}</label>
                </td>
                <td>
                  <b>{formatMoney(r.price, lang)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overview-bottom">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3>{t("Top_products")}</h3>
              <p>{t("Best_selling")}</p>
            </div>
            <NavLink className="link" to="/products">
              {t("View_all")}
            </NavLink>
          </div>
          {topSellers.map(({ product, units }, i) => (
            <div className="product" key={product?.id || i}>
              <img
                className="product-thumb"
                src={
                  "/products/" + (product?.imageKey || "headphones") + ".svg"
                }
                alt=""
              />
              <div>
                <b>{product?.name || t("Product")}</b>
                <small>
                  {product?.category
                    ? translateCategory(lang, product.category)
                    : ""}
                </small>
              </div>
              <strong>
                {units} {t("Units_sold")}
              </strong>
            </div>
          ))}
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3>{t("Low_stock")}</h3>
              <p>{t("Stock_attention")}</p>
            </div>
            <NavLink className="link" to="/inventory">
              {t("View_all")}
            </NavLink>
          </div>
          {lowStock.map((i) => (
            <div className="stock-alert" key={i.id}>
              <span className="notice-dot" />
              <b>{i.name}</b>
              <span>
                {i.stock} {t("units")}
              </span>
            </div>
          ))}
        </article>
      </div>
    </>
  );
}
