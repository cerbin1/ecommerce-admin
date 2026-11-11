import React from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Users,
  Boxes,
  Tag,
  Settings,
  Search,
  Bell,
  Inbox,
  Plus,
  MoreHorizontal,
  Menu,
  Trash2,
  Eye,
  Check,
  RotateCcw,
} from "lucide-react";
import "./style.css";
import {
  loadBusinessData,
  saveBusinessData,
  resetBusinessData,
} from "./persistence";
import { translate, translateCategory, type Locale } from "./locales";
import {
  initial,
  formatMoney,
  formatDate,
  promotionStatus,
  type OrderItem,
  type Row,
} from "./data";
import {
  CustomerDetail,
  OrderDetail,
  Notifications,
  Overview,
} from "./DashboardViews";
function App() {
  const [loaded] = React.useState(() => loadBusinessData(initial)),
    [db, setDb] = React.useState<Record<string, Row[]>>(loaded.value),
    [storageWarning, setStorageWarning] = React.useState(loaded.recovered),
    [query, setQuery] = React.useState(""),
    [mobileSearchOpen, setMobileSearchOpen] = React.useState(false),
    [filterStatus, setFilterStatus] = React.useState("All"),
    [filterCategory, setFilterCategory] = React.useState("All"),
    [stockFilter, setStockFilter] = React.useState("All"),
    [paymentFilter, setPaymentFilter] = React.useState("All"),
    [dateFrom, setDateFrom] = React.useState(""),
    [dateTo, setDateTo] = React.useState(""),
    [orderItemCount, setOrderItemCount] = React.useState(1),
    [currentPage, setCurrentPage] = React.useState(1),
    [sortField, setSortField] = React.useState<keyof Row>("name"),
    [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc"),
    [selectedIds, setSelectedIds] = React.useState<string[]>([]),
    [modal, setModal] = React.useState(false),
    [editId, setEditId] = React.useState<string | null>(null),
    [detailId, setDetailId] = React.useState<string | null>(null),
    [mobileOpen, setMobileOpen] = React.useState(false),
    [profileMenuOpen, setProfileMenuOpen] = React.useState(false),
    [profileMenuSource, setProfileMenuSource] = React.useState<
      "header" | "sidebar"
    >("header"),
    profileMenuRef = React.useRef<HTMLDivElement>(null),
    sidebarProfileMenuRef = React.useRef<HTMLDivElement>(null),
    [dark, setDark] = React.useState(
      () => localStorage.getItem("shopflow-theme") === "dark",
    ),
    [lang, setLang] = React.useState<Locale>(() =>
      localStorage.getItem("shopflow-language") === "pl" ? "pl" : "en",
    );
  const navigate = useNavigate();
  const t = (key: string) => translate(lang, key);
  const categoryName = (name: string) => translateCategory(lang, name);
  const loc = useLocation(),
    section = loc.pathname.split("/")[1] || "overview",
    title =
      section === "overview"
        ? "Overview"
        : section[0].toUpperCase() + section.slice(1);
  const itemLabelKey: Record<string, string> = {
    Products: "Product_singular",
    Categories: "Category_singular",
    Orders: "Order_singular",
    Customers: "Customer_singular",
    Inventory: "Inventory_singular",
    Promotions: "Promotion_singular",
  };
  const managementCopyKey: Record<string, string> = {
    Products: "Manage_products",
    Categories: "Manage_categories",
    Orders: "Manage_orders",
    Customers: "Manage_customers",
    Inventory: "Manage_inventory",
    Promotions: "Manage_promotions",
    Notifications: "Manage_notifications",
    Settings: "Manage_settings",
  };
  const itemLabel = t(itemLabelKey[title] || title);
  React.useEffect(() => {
    if (!profileMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        !profileMenuRef.current?.contains(event.target as Node) &&
        !sidebarProfileMenuRef.current?.contains(event.target as Node)
      )
        setProfileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileMenuOpen]);
  React.useEffect(() => {
    saveBusinessData(db);
  }, [db]);
  const nav = [
    ["Overview", "/overview", LayoutDashboard],
    ["Products", "/products", ShoppingBag],
    ["Categories", "/categories", Boxes],
    ["Orders", "/orders", ClipboardList],
    ["Customers", "/customers", Users],
    ["Inventory", "/inventory", Boxes],
    ["Promotions", "/promotions", Tag],
    ["Notifications", "/notifications", Inbox],
    ["Settings", "/settings", Settings],
  ] as const;
  const key = title as keyof typeof db;
  const rows = db[key] || [],
    filteredRows = rows
      .filter(
        (r) =>
          (filterStatus === "All" || r.status === filterStatus) &&
          (title !== "Products" ||
            filterCategory === "All" ||
            r.category === filterCategory) &&
          (title !== "Inventory" ||
            stockFilter === "All" ||
            (stockFilter === "Low stock"
              ? (r.stock || 0) > 0 && (r.stock || 0) <= (r.threshold || 10)
              : stockFilter === "Out of stock"
                ? (r.stock || 0) === 0
                : (r.stock || 0) > 10)) &&
          (title !== "Orders" ||
            paymentFilter === "All" ||
            r.paymentStatus === paymentFilter) &&
          (title !== "Orders" ||
            !dateFrom ||
            new Date(r.date || "").getTime() >=
              new Date(`${dateFrom}T00:00:00`).getTime()) &&
          (title !== "Orders" ||
            !dateTo ||
            new Date(r.date || "").getTime() <=
              new Date(`${dateTo}T23:59:59.999`).getTime()) &&
          `${r.id} ${r.name} ${r.email || ""} ${r.status}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
      .sort((a, b) => {
        const av = a[sortField] ?? "",
          bv = b[sortField] ?? "";
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv), undefined, {
                numeric: true,
              });
        return sortDirection === "asc" ? cmp : -cmp;
      }),
    pageSize = 10,
    pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize)),
    pagedRows = filteredRows.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
    );
  function update(next: Row[]) {
    const data = { ...db, [key]: next };
    if (title === "Products") {
      const previous = db.Inventory || [],
        movements = [...(db.InventoryMovements || [])],
        ids = new Set(next.map((p) => p.id));
      data.Inventory = next.map((p) => {
        const old = previous.find((i) => i.id === p.id),
          quantity = p.stock || 0;
        if (old && old.stock !== quantity)
          movements.unshift({
            id: "MOV-" + Date.now() + "-" + p.id,
            status: "Recorded",
            name: p.name,
            delta: quantity - (old.stock || 0),
            reason: t("Change_reason"),
            date: new Date().toLocaleString(),
          });
        return {
          id: p.id,
          name: p.name,
          stock: quantity,
          threshold: old?.threshold ?? 10,
          status:
            quantity === 0
              ? "Out of stock"
              : quantity <= (old?.threshold ?? 10)
                ? "Low stock"
                : "In stock",
        };
      });
      if (previous.some((i) => !ids.has(i.id)))
        data.InventoryMovements = movements.filter(
          (m) => ids.has(m.id) || m.id.startsWith("MOV-"),
        );
      else data.InventoryMovements = movements;
    }
    setDb(data);
  }
  function add(form: HTMLFormElement) {
    const fd = new FormData(form);
    if (title === "Inventory") {
      const productId = String(fd.get("productId")),
        delta = Number(fd.get("delta")),
        reason = String(fd.get("reason") || "").trim(),
        product = rows.find((r) => r.id === productId);
      if (!product || !Number.isInteger(delta) || delta === 0 || !reason) {
        window.alert(t("Invalid_adjustment"));
        return;
      }
      const quantity = (product.stock || 0) + delta;
      if (quantity < 0) {
        window.alert(t("Negative_stock"));
        return;
      }
      const updated = rows.map((r) =>
        r.id === productId
          ? {
              ...r,
              stock: quantity,
              status:
                quantity === 0
                  ? "Out of stock"
                  : quantity <= (product.threshold || 10)
                    ? "Low stock"
                    : "In stock",
            }
          : r,
      );
      const movement: Row = {
        id: `MOV-${Date.now()}`,
        status: "Recorded",
        name: product.name,
        delta,
        reason,
        date: new Date().toLocaleString(),
      };
      setDb({
        ...db,
        Inventory: updated,
        Products: (db.Products || []).map((p) =>
          p.id === productId ? { ...p, stock: quantity } : p,
        ),
        InventoryMovements: [movement, ...(db.InventoryMovements || [])],
      });
      setModal(false);
      return;
    }
    if (title === "Orders") {
      const customer = (db.Customers || []).find(
        (candidate) => candidate.id === String(fd.get("customerId") || ""),
      );
      const items = Array.from({ length: orderItemCount }, (_, index) => {
        const product = (db.Products || []).find(
          (candidate) =>
            candidate.id === String(fd.get(`product-${index}`) || ""),
        );
        const quantity = Number(fd.get(`quantity-${index}`));
        if (!product || !Number.isInteger(quantity) || quantity < 1)
          return null;
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku || product.id,
          quantity,
          unitPrice: product.price || 0,
        } satisfies OrderItem;
      });
      const shipping = Number(fd.get("shipping") || 0);
      if (
        !customer ||
        items.some((item) => item === null) ||
        !Number.isFinite(shipping) ||
        shipping < 0
      ) {
        window.alert(t("Invalid_order"));
        return;
      }
      const orderItems = items as OrderItem[];
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const firstItem = orderItems[0];
      const now = new Date().toISOString();
      const order: Row = {
        id: `ORD-${Date.now()}`,
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        date: now,
        status: "Pending",
        paymentStatus: String(fd.get("paymentStatus") || "Pending"),
        items: orderItems,
        productId: firstItem.productId,
        productName: firstItem.productName,
        sku: firstItem.sku,
        quantity: firstItem.quantity,
        shipping,
        tax,
        price: subtotal + shipping + tax,
      };
      const initialEvent: Row = {
        id: `H-${Date.now()}-created`,
        name: order.id,
        status: "Pending",
        historyType: "fulfillment",
        date: now,
        note: t("Order_created"),
      };
      setDb({
        ...db,
        Orders: [order, ...(db.Orders || [])],
        OrderHistory: [initialEvent, ...(db.OrderHistory || [])],
      });
      setModal(false);
      return;
    }
    const name = String(fd.get("name") || "New item");
    if (
      title === "Categories" &&
      rows.some(
        (r) =>
          r.name.toLowerCase() === name.trim().toLowerCase() && r.id !== editId,
      )
    ) {
      window.alert(t("Duplicate_category"));
      return;
    }
    if (title === "Products") {
      const sku = String(fd.get("sku") || "").trim();
      const price = Number(fd.get("price")),
        stock = Number(fd.get("stock"));
      if (
        !sku ||
        rows.some(
          (r) =>
            (r.sku || r.id).toLowerCase() === sku.toLowerCase() &&
            r.id !== editId,
        )
      ) {
        window.alert(t("Unique_sku"));
        return;
      }
      if (
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        window.alert(t("Invalid_product"));
        return;
      }
      if (!db.Categories.some((c) => c.name === String(fd.get("category")))) {
        window.alert(t("Invalid_category"));
        return;
      }
    }
    if (title === "Promotions") {
      const code = String(fd.get("code") || "")
          .trim()
          .toUpperCase(),
        kind = String(fd.get("kind")),
        value = Number(fd.get("price")),
        limit = Number(fd.get("limit")),
        start = String(fd.get("startsAt")),
        end = String(fd.get("expiresAt"));
      if (
        !code ||
        rows.some(
          (r) => (r.code || r.id).toUpperCase() === code && r.id !== editId,
        )
      ) {
        window.alert(t("Unique_code"));
        return;
      }
      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        (kind === "percent" && value > 100) ||
        !Number.isInteger(limit) ||
        limit < 1
      ) {
        window.alert(t("Invalid_promotion"));
        return;
      }
      if (!start || !end || new Date(start) > new Date(end)) {
        window.alert(t("Invalid_dates"));
        return;
      }
    }
    const record: Row = {
      id:
        title === "Promotions"
          ? String(fd.get("code") || "").toUpperCase()
          : title === "Products"
            ? editId || String(fd.get("sku") || "").trim()
            : `${title.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      name,
      sku: String(fd.get("sku") || ""),
      imageKey: String(fd.get("imageKey") || ""),
      code: String(fd.get("code") || ""),
      kind: String(fd.get("kind") || ""),
      minimum: Number(fd.get("minimum") || 0),
      limit: Number(fd.get("limit") || 0),
      used: 0,
      startsAt: String(fd.get("startsAt") || ""),
      expiresAt: String(fd.get("expiresAt") || ""),
      status: String(fd.get("status") || "Active"),
      price: Number(fd.get("price") || 0),
      stock: Number(fd.get("stock") || 0),
      category: String(fd.get("category") || "General"),
      description: String(fd.get("description") || ""),
      tags: String(fd.get("tags") || ""),
      email: String(fd.get("email") || ""),
      date: new Date().toLocaleDateString(),
    };
    update(
      editId
        ? rows.map((r) => (r.id === editId ? { ...r, ...record } : r))
        : [record, ...rows],
    );
    setModal(false);
    setEditId(null);
  }
  return (
    <div className={dark ? "layout dark" : "layout"}>
      <aside className={mobileOpen ? "sidebar mobile-open" : "sidebar"}>
        <div className="brand">
          <span className="brand-icon">S</span>
          <span>
            shop<span className="muted">flow</span>
          </span>
        </div>
        <div className="store">
          <span className="store-icon">M</span>
          <span>
            <b>Mono Store</b>
            <small>{t("Retail_workspace")}</small>
          </span>
        </div>
        <small className="label">{t("WORKSPACE")}</small>
        <nav>
          {nav.map(([n, path, I]) => (
            <NavLink
              key={n}
              to={path}
              className={({ isActive }: { isActive: boolean }) =>
                isActive ? "active" : ""
              }
              onClick={() => setMobileOpen(false)}
            >
              <I size={18} />
              {t(n)}
              {n === "Orders" && <i>8</i>}
            </NavLink>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="help">
            <b>{t("Need_help")}</b>
            <p>{t("Help_copy")}</p>
            <button>{t("Open_help")}</button>
          </div>
          <div
            className="profile-menu-wrap sidebar-profile-wrap"
            ref={sidebarProfileMenuRef}
          >
            <button
              className="profile profile-button"
              aria-label={t("Profile")}
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen && profileMenuSource === "sidebar"}
              onClick={() => {
                if (profileMenuOpen && profileMenuSource === "sidebar") {
                  setProfileMenuOpen(false);
                } else {
                  setProfileMenuSource("sidebar");
                  setProfileMenuOpen(true);
                }
              }}
            >
              <div className="avatar">JD</div>
              <span>
                <b>Jordan Davis</b>
                <small>{t("Store_owner")}</small>
              </span>
              <MoreHorizontal size={18} />
            </button>
            {profileMenuOpen && profileMenuSource === "sidebar" && (
              <div className="profile-menu sidebar-profile-menu" role="menu">
                <div className="profile-menu-info">
                  <b>Jordan Davis</b>
                  <small>{t("Store_owner")}</small>
                </div>
                <NavLink
                  role="menuitem"
                  to="/settings"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Settings size={16} />
                  {t("Settings")}
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main>
        <header>
          <button
            className="mobile"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <Menu />
          </button>
          <div className="crumb">
            <span className="crumb-workspace">{t("Workspace")}</span>
            <span>/</span> <b>{t(title)}</b>
          </div>
          <div className="tools">
            <div
              className={"search" + (mobileSearchOpen ? " search-open" : "")}
            >
              <Search className="desktop-search-icon" size={17} />
              <button
                type="button"
                className="mobile-search-toggle"
                aria-label={t("Search")}
                aria-expanded={mobileSearchOpen}
                onClick={() => setMobileSearchOpen((open) => !open)}
              >
                <Search size={17} />
              </button>
              <input
                placeholder={t("Search")}
                value={query}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setMobileSearchOpen(false);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button
              className="language-button"
              onClick={() =>
                setLang((v) => {
                  const next = v === "en" ? "pl" : "en";
                  localStorage.setItem("shopflow-language", next);
                  return next;
                })
              }
            >
              {lang.toUpperCase()}
            </button>
            <button
              className="icon"
              onClick={() =>
                setDark((v) => {
                  localStorage.setItem("shopflow-theme", v ? "light" : "dark");
                  return !v;
                })
              }
            >
              ◐
            </button>
            <button
              className="icon"
              aria-label={t("Notifications")}
              title={t("Notifications")}
              onClick={() => {
                setProfileMenuOpen(false);
                navigate("/notifications");
              }}
            >
              <Bell size={19} />
              {db.Notifications?.some(
                (notification) => notification.status === "Unread",
              ) && <em />}
            </button>
            <div className="profile-menu-wrap" ref={profileMenuRef}>
              <button
                className="avatar profile-trigger"
                aria-label={t("Profile")}
                aria-haspopup="menu"
                aria-expanded={
                  profileMenuOpen && profileMenuSource === "header"
                }
                onClick={() => {
                  if (profileMenuOpen && profileMenuSource === "header") {
                    setProfileMenuOpen(false);
                  } else {
                    setProfileMenuSource("header");
                    setProfileMenuOpen(true);
                  }
                }}
              >
                JD
              </button>
              {profileMenuOpen && profileMenuSource === "header" && (
                <div className="profile-menu" role="menu">
                  <div className="profile-menu-info">
                    <b>Jordan Davis</b>
                    <small>{t("Store_owner")}</small>
                  </div>
                  <NavLink
                    role="menuitem"
                    to="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <Settings size={16} />
                    {t("Settings")}
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </header>
        <section className="content">
          {storageWarning && (
            <div className="recovery-banner" role="status">
              {t("Storage_recovered")}
              <button
                className="action"
                onClick={() => setStorageWarning(false)}
              >
                ×
              </button>
            </div>
          )}
          <div className="page-head">
            <div>
              <small>MONO STORE / {t("WORKSPACE")}</small>
              <h1>{t(title)}</h1>
              <p>
                {title === "Overview"
                  ? t("Description")
                  : t(managementCopyKey[title] || "Manage")}
              </p>
            </div>
            {!["Overview", "Settings", "Notifications", "Customers"].includes(
              title,
            ) && (
              <button
                className="primary"
                onClick={() => {
                  setEditId(null);
                  setOrderItemCount(1);
                  setModal(true);
                }}
              >
                <Plus size={17} />{" "}
                {title === "Inventory"
                  ? t("Adjust_stock")
                  : t("Add") + " " + itemLabel}
              </button>
            )}
          </div>
          {title === "Overview" ? (
            <Overview db={db} t={t} lang={lang} />
          ) : title === "Notifications" ? (
            <Notifications rows={rows} onUpdate={update} lang={lang} t={t} />
          ) : title === "Settings" ? (
            <div className="panel settings">
              <h3>{t("Store_settings")}</h3>
              <p>{t("Mono_details")}</p>
              <button
                className="select"
                onClick={() => {
                  setDb(resetBusinessData(initial));
                  setStorageWarning(false);
                }}
              >
                <RotateCcw size={15} /> {t("Reset_demo")}
              </button>
              <button
                className="select"
                onClick={() =>
                  setDark((v) => {
                    localStorage.setItem(
                      "shopflow-theme",
                      v ? "light" : "dark",
                    );
                    return !v;
                  })
                }
              >
                {t("Toggle_theme")}
              </button>
              <button
                className="select"
                onClick={() =>
                  setLang((v) => {
                    const next = v === "en" ? "pl" : "en";
                    localStorage.setItem("shopflow-language", next);
                    return next;
                  })
                }
              >
                {t("Language")}: {lang.toUpperCase()}
              </button>
            </div>
          ) : (
            <div className="panel table-panel">
              <div className="table-toolbar">
                <b>
                  {rows.length} {t(title).toLowerCase()}
                </b>
                {title === "Orders" && (
                  <div className="order-filters">
                    <select
                      className="select"
                      aria-label={t("Payment_status")}
                      value={paymentFilter}
                      onChange={(e) => {
                        setPaymentFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="All">{t("All_payment_statuses")}</option>
                      {["Pending", "Paid", "Refunded"].map((status) => (
                        <option key={status} value={status}>
                          {t(status)}
                        </option>
                      ))}
                    </select>
                    <label className="order-date-filter">
                      <span>{t("From_date")}</span>
                      <input
                        type="date"
                        aria-label={t("From_date")}
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </label>
                    <label className="order-date-filter">
                      <span>{t("To_date")}</span>
                      <input
                        type="date"
                        aria-label={t("To_date")}
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </label>
                  </div>
                )}
                {title === "Products" && selectedIds.length > 0 && (
                  <button
                    className="select"
                    onClick={() => {
                      setDb({
                        ...db,
                        Products: db.Products.map((p) =>
                          selectedIds.includes(p.id)
                            ? { ...p, status: "Archived" }
                            : p,
                        ),
                      });
                      setSelectedIds([]);
                    }}
                  >
                    {t("Archive_selected")} ({selectedIds.length})
                  </button>
                )}
                {title === "Products" && (
                  <select
                    className="select"
                    aria-label="Filter by category"
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">{t("All_categories")}</option>
                    {db.Categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {categoryName(c.name)}
                      </option>
                    ))}
                  </select>
                )}
                {title === "Inventory" && (
                  <select
                    className="select"
                    aria-label="Filter stock"
                    value={stockFilter}
                    onChange={(e) => {
                      setStockFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="All">{t("All")}</option>
                    <option value="In stock">{t("Stock_filter_in")}</option>
                    <option value="Low stock">{t("Stock_filter_low")}</option>
                    <option value="Out of stock">
                      {t("Stock_filter_out")}
                    </option>
                  </select>
                )}
                <select
                  className="select"
                  aria-label={t("Filter")}
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">{t("All")}</option>
                  {Array.from(new Set<string>(rows.map((r) => r.status))).map(
                    (s) => (
                      <option key={s} value={s}>
                        {t(s.replace(/ /g, "_"))}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {[
                        "",
                        t("Name_header"),
                        ...(title === "Products"
                          ? [t("CATEGORY"), t("PRICE"), t("STOCK")]
                          : title === "Orders"
                            ? [t("DATE"), t("Payment_header"), t("TOTAL")]
                            : title === "Customers"
                              ? [t("EMAIL"), t("ORDERS"), t("SPENT")]
                              : title === "Inventory"
                                ? [t("ON_HAND"), t("Reorder_point")]
                                : title === "Promotions"
                                  ? [t("DISCOUNT"), t("ENDS")]
                                  : [t("PRODUCTS")]),
                        title === "Inventory" ? t("Availability") : "STATUS",
                        t("Actions"),
                      ].map((c) => (
                        <th key={c || "selection"}>
                          {c === "" ? (
                            <input
                              aria-label="Select visible rows"
                              type="checkbox"
                              checked={
                                pagedRows.length > 0 &&
                                pagedRows.every((r) =>
                                  selectedIds.includes(r.id),
                                )
                              }
                              onChange={(e) =>
                                setSelectedIds((prev) =>
                                  e.target.checked
                                    ? [
                                        ...new Set([
                                          ...prev,
                                          ...pagedRows.map((r) => r.id),
                                        ]),
                                      ]
                                    : prev.filter(
                                        (id) =>
                                          !pagedRows.some((r) => r.id === id),
                                      ),
                                )
                              }
                            />
                          ) : (
                            <button
                              className="sort-button"
                              onClick={() => {
                                const field: keyof Row =
                                  c === t("Name_header")
                                    ? "name"
                                    : c === t("Category")
                                      ? "category"
                                      : c === t("Price") || c === t("Total")
                                        ? "price"
                                        : c === t("Stock") || c === t("On_hand")
                                          ? "stock"
                                          : c === t("Reorder_point")
                                            ? "threshold"
                                            : c === t("Date")
                                              ? "date"
                                              : c === t("Payment_header")
                                                ? "paymentStatus"
                                                : c === t("Email")
                                                  ? "email"
                                                  : c === t("Value")
                                                    ? "price"
                                                    : c === t("Ends")
                                                      ? "expiresAt"
                                                      : "status";
                                if (sortField === field)
                                  setSortDirection((v) =>
                                    v === "asc" ? "desc" : "asc",
                                  );
                                else {
                                  setSortField(field);
                                  setSortDirection("asc");
                                }
                              }}
                            >
                              {c}
                              {sortField && (
                                <small>
                                  {sortDirection === "asc" ? " ↕" : ""}
                                </small>
                              )}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map((r, i) => (
                      <tr key={r.id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={"Select " + r.id}
                            checked={selectedIds.includes(r.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked
                                  ? [...prev, r.id]
                                  : prev.filter((id) => id !== r.id),
                              )
                            }
                          />
                        </td>
                        <td>
                          <div className="entity">
                            <span className={"entity-img img" + (i % 3)}>
                              {title === "Products" ? (
                                <img
                                  className="product-thumb"
                                  src={
                                    "./products/" +
                                    (r.imageKey ||
                                      [
                                        "headphones",
                                        "watch",
                                        "backpack",
                                        "coffee",
                                        "charger",
                                      ][i % 5]) +
                                    ".svg"
                                  }
                                  alt=""
                                />
                              ) : title === "Customers" ? (
                                "JD"
                              ) : title === "Orders" ? (
                                "#"
                              ) : title === "Promotions" ? (
                                "%"
                              ) : (
                                "◈"
                              )}
                            </span>
                            <div>
                              <b>
                                {title === "Categories"
                                  ? categoryName(r.name)
                                  : r.name}
                              </b>
                              <small>{r.id}</small>
                            </div>
                          </div>
                        </td>
                        {title === "Products" ? (
                          <>
                            <td>{categoryName(r.category || "")}</td>
                            <td>{formatMoney(r.price, lang)}</td>
                            <td>
                              {r.stock} {t("units")}
                            </td>
                          </>
                        ) : title === "Categories" ? (
                          <>
                            <td>{r.description || "—"}</td>
                            <td>
                              {
                                db.Products.filter((p) => p.category === r.name)
                                  .length
                              }
                            </td>
                          </>
                        ) : title === "Orders" ? (
                          <>
                            <td>{formatDate(r.date, lang)}</td>
                            <td>{t(r.paymentStatus || "Paid")}</td>
                            <td>{formatMoney(r.price, lang)}</td>
                          </>
                        ) : title === "Customers" ? (
                          <>
                            <td>{r.email}</td>
                            <td>{(i % 5) + 1}</td>
                            <td>{formatMoney(r.price, lang)}</td>
                          </>
                        ) : title === "Inventory" ? (
                          <>
                            <td>
                              {r.stock} {t("units")}
                            </td>
                            <td>
                              {r.threshold ?? 10} {t("units")}
                            </td>
                          </>
                        ) : title === "Promotions" ? (
                          <>
                            <td>
                              {r.kind === "fixed"
                                ? formatMoney(r.price, lang)
                                : (r.price || 0) + "%"}
                            </td>
                            <td>{formatDate(r.date || r.expiresAt, lang)}</td>
                          </>
                        ) : (
                          <td>
                            {
                              db.Products.filter((p) => p.category === r.name)
                                .length
                            }
                          </td>
                        )}
                        <td>
                          <label
                            className={
                              "badge " +
                              ((title === "Promotions"
                                ? promotionStatus(r)
                                : r.status) === "Active" ||
                              r.status === "Delivered" ||
                              r.status === "In stock"
                                ? "green"
                                : (title === "Promotions"
                                      ? promotionStatus(r)
                                      : r.status) === "Scheduled" ||
                                    r.status === "Processing" ||
                                    r.status === "Low stock"
                                  ? "blue"
                                  : "yellow")
                            }
                          >
                            {t(
                              title === "Promotions"
                                ? promotionStatus(r)
                                : r.status.replace(/ /g, "_"),
                            )}
                          </label>
                        </td>
                        <td>
                          <button
                            className="action"
                            title="View details"
                            onClick={() =>
                              title === "Orders" || title === "Customers"
                                ? setDetailId(r.id)
                                : (setEditId(r.id), setModal(true))
                            }
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="action"
                            title="Delete"
                            onClick={() => {
                              if (
                                title === "Categories" &&
                                db.Products.some((p) => p.category === r.name)
                              ) {
                                window.alert(t("Category_in_use"));
                                return;
                              }
                              if (
                                title === "Products" &&
                                db.Orders.some((o) => o.productId === r.id)
                              ) {
                                window.alert(t("Product_referenced"));
                                return;
                              }
                              update(rows.filter((x) => x.id !== r.id));
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            className="action"
                            onClick={() =>
                              update(
                                rows.map((x) =>
                                  x.id === r.id
                                    ? {
                                        ...x,
                                        status:
                                          x.status === "Active"
                                            ? "Inactive"
                                            : "Active",
                                      }
                                    : x,
                                ),
                              )
                            }
                          >
                            <Check size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {title === "Inventory" && (
                <div className="movement-history">
                  <h3>{t("Stock_movement")}</h3>
                  {(db.InventoryMovements || []).map((m) => (
                    <div className="movement" key={m.id}>
                      <b>{m.name}</b>
                      <span
                        className={(m.delta || 0) > 0 ? "positive" : "negative"}
                      >
                        {(m.delta || 0) > 0 ? "+" : ""}
                        {m.delta}
                      </span>
                      <span>{m.reason}</span>
                      <small>{formatDate(m.date, lang)}</small>
                    </div>
                  ))}
                </div>
              )}
              <div className="pagination">
                <span>
                  {t("Showing")}{" "}
                  {filteredRows.length ? (currentPage - 1) * pageSize + 1 : 0}–
                  {Math.min(currentPage * pageSize, filteredRows.length)}{" "}
                  {t("Of")} {filteredRows.length} {t("Results")}
                </span>
                <div>
                  <button
                    className="select"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    {t("Previous")}
                  </button>
                  <span>
                    {currentPage} / {pageCount}
                  </span>
                  <button
                    className="select"
                    disabled={currentPage >= pageCount}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(pageCount, p + 1))
                    }
                  >
                    {t("Next")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      {detailId && title === "Customers" && (
        <CustomerDetail
          customer={rows.find((r) => r.id === detailId)!}
          orders={db.Orders || []}
          lang={lang}
          t={t}
          onClose={() => setDetailId(null)}
        />
      )}
      {detailId && title === "Orders" && (
        <OrderDetail
          order={rows.find((r) => r.id === detailId)!}
          history={db.OrderHistory || []}
          lang={lang}
          t={t}
          onClose={() => setDetailId(null)}
          onStatus={(status, note) => {
            const order = rows.find((r) => r.id === detailId);
            if (!order) return;
            setDb({
              ...db,
              Orders: rows.map((r) =>
                r.id === detailId ? { ...r, status } : r,
              ),
              OrderHistory: [
                {
                  id: "H-" + Date.now() + "-FUL",
                  name: order.id,
                  status,
                  historyType: "fulfillment",
                  date: new Date().toLocaleString(),
                  note,
                },
                ...(db.OrderHistory || []),
              ],
            });
          }}
          onPayment={(paymentStatus, note) => {
            const order = rows.find((r) => r.id === detailId);
            if (!order) return;
            setDb({
              ...db,
              Orders: rows.map((r) =>
                r.id === detailId ? { ...r, paymentStatus } : r,
              ),
              OrderHistory: [
                {
                  id: "H-" + Date.now() + "-PAY",
                  name: order.id,
                  status: paymentStatus,
                  historyType: "payment",
                  date: new Date().toLocaleString(),
                  note,
                },
                ...(db.OrderHistory || []),
              ],
            });
          }}
        />
      )}
      {modal && (
        <div className="overlay" onClick={() => setModal(false)}>
          <form
            className="dialog"
            onSubmit={(e) => {
              e.preventDefault();
              add(e.currentTarget);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-head">
              <h3>
                {t(editId ? "Edit" : "Add")} {itemLabel}
              </h3>
              <button
                type="button"
                className="action"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </div>
            {title === "Orders" ? (
              <>
                <label>
                  {t("Customer")}
                  <select name="customerId" required>
                    {(db.Customers || []).map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} · {customer.email}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="order-items-form">
                  <b>{t("Items")}</b>
                  {Array.from({ length: orderItemCount }, (_, index) => (
                    <div className="order-line-fields" key={index}>
                      <label>
                        {t("Product")}
                        <select name={`product-${index}`} required>
                          <option value="">{t("Select_product")}</option>
                          {(db.Products || []).map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} · {product.sku || product.id} ·{" "}
                              {formatMoney(product.price, lang)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        {t("Quantity")}
                        <input
                          type="number"
                          name={`quantity-${index}`}
                          min="1"
                          step="1"
                          defaultValue="1"
                          required
                        />
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="select"
                    disabled={orderItemCount >= 8}
                    onClick={() =>
                      setOrderItemCount((count) => Math.min(count + 1, 8))
                    }
                  >
                    <Plus size={14} /> {t("Add_another_item")}
                  </button>
                </div>
                <label>
                  {t("Payment_status")}
                  <select name="paymentStatus" defaultValue="Pending">
                    {["Pending", "Paid", "Refunded"].map((paymentStatus) => (
                      <option key={paymentStatus} value={paymentStatus}>
                        {t(paymentStatus)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("Shipping")}
                  <input
                    type="number"
                    name="shipping"
                    min="0"
                    step="0.01"
                    defaultValue="5"
                    required
                  />
                </label>
              </>
            ) : title === "Promotions" ? (
              <>
                <label>
                  {t("Promotion_name")}
                  <input
                    name="name"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.name}
                  />
                </label>
                <label>
                  {t("Code")}
                  <input
                    name="code"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.code}
                  />
                </label>
                <label>
                  {t("Discount_type")}
                  <select name="kind">
                    <option value="percent">{t("Percentage")}</option>
                    <option value="fixed">{t("Fixed")}</option>
                  </select>
                </label>
                <label>
                  {t("Discount_value")}
                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.price}
                  />
                </label>
                <label>
                  {t("Minimum_order")}
                  <input
                    type="number"
                    name="minimum"
                    min="0"
                    step="0.01"
                    defaultValue={
                      rows.find((r) => r.id === editId)?.minimum || 0
                    }
                  />
                </label>
                <label>
                  {t("Usage_limit")}
                  <input
                    type="number"
                    name="limit"
                    min="1"
                    step="1"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.limit}
                  />
                </label>
                <label>
                  {t("Starts")}
                  <input
                    type="date"
                    name="startsAt"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.startsAt}
                  />
                </label>
                <label>
                  {t("Expires")}
                  <input
                    type="date"
                    name="expiresAt"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.expiresAt}
                  />
                </label>
              </>
            ) : null}
            {title === "Inventory" ? (
              <>
                <label>
                  {t("Product")}
                  <select name="productId" required>
                    {rows.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.stock} {t("Stock_available")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("Quantity_change")}
                  <input
                    type="number"
                    name="delta"
                    required
                    placeholder="e.g. 12 or -2"
                  />
                </label>
                <label>
                  {t("Reason")}
                  <input
                    name="reason"
                    required
                    placeholder={t("Restock_placeholder")}
                  />
                </label>
              </>
            ) : (
              <label>
                {t("Name")}
                <input
                  name="name"
                  required
                  placeholder={t("Enter_name")}
                  defaultValue={rows.find((r) => r.id === editId)?.name}
                />
              </label>
            )}
            {title === "Categories" && (
              <label>
                {t("Description_field")}
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={rows.find((r) => r.id === editId)?.description}
                />
              </label>
            )}
            {title === "Products" && (
              <>
                <label>
                  {t("Image")}
                  <select
                    name="imageKey"
                    defaultValue={
                      rows.find((r) => r.id === editId)?.imageKey ||
                      "headphones"
                    }
                  >
                    {[
                      "headphones",
                      "watch",
                      "backpack",
                      "coffee",
                      "charger",
                    ].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("SKU")}
                  <input
                    name="sku"
                    required
                    defaultValue={
                      rows.find((r) => r.id === editId)?.sku ||
                      rows.find((r) => r.id === editId)?.id
                    }
                  />
                </label>
                <label>
                  {t("Category_field")}
                  <select
                    name="category"
                    required
                    defaultValue={
                      rows.find((r) => r.id === editId)?.category ||
                      db.Categories[0]?.name
                    }
                  >
                    {db.Categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {categoryName(c.name)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("Description_field")}
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={
                      rows.find((r) => r.id === editId)?.description
                    }
                  />
                </label>
                <label>
                  {t("Tags")}
                  <input
                    name="tags"
                    placeholder={t("Tag_placeholder")}
                    defaultValue={rows.find((r) => r.id === editId)?.tags}
                  />
                </label>
                <label>
                  {t("Price_field")}
                  <input
                    type="number"
                    name="price"
                    min="0.01"
                    step=".01"
                    required
                    defaultValue={rows.find((r) => r.id === editId)?.price}
                  />
                </label>
                <label>
                  {t("Stock_field")}
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    defaultValue={rows.find((r) => r.id === editId)?.stock}
                  />
                </label>
              </>
            )}
            {title === "Customers" && (
              <label>
                {t("Email")}
                <input
                  type="email"
                  name="email"
                  defaultValue={rows.find((r) => r.id === editId)?.email}
                />
              </label>
            )}
            <label>
              {t("Status_field")}
              <select
                name="status"
                defaultValue={
                  rows.find((r) => r.id === editId)?.status || "Active"
                }
              >
                {(title === "Products"
                  ? ["Active", "Draft", "Archived"]
                  : title === "Promotions"
                    ? ["Active", "Inactive"]
                    : ["Active", "Inactive", "Scheduled"]
                ).map((v) => (
                  <option key={v}>{t(v)}</option>
                ))}
              </select>
            </label>
            <button className="primary">
              {editId ? t("Save_changes") : t("Save") + " " + itemLabel}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <Routes>
      <Route path="*" element={<App />} />
    </Routes>
  </HashRouter>,
);
