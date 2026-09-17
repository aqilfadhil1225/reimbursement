import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "./api";
import "./App.css";

const roleLabels = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  FINANCE: "Finance",
};
const statusLabels = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  MANAGER_APPROVED: "Manager approved",
  FINANCE_REVIEW: "Finance review",
  READY_FOR_PAYMENT: "Ready for payment",
  PAID: "Paid",
  REJECTED: "Rejected",
  REVISION_REQUIRED: "Revision required",
};
const paymentMethodLabels = {
  BANK_TRANSFER: "Transfer bank",
  CASH: "Tunai",
  OTHER: "Lainnya",
};
const statusFilterOptions = [
  ["", "Semua status"],
  ...Object.entries(statusLabels),
];
const emptyExpense = {
  category: "",
  amount: "",
  expenseDate: "",
  description: "",
  receiptUrl: "",
  receiptFile: null,
};

function App() {
  const [session, setSession] = useState(() => {
    const savedUser = localStorage.getItem("reimbursement_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authError, setAuthError] = useState("");
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [summary, setSummary] = useState({ total: 0, totalAmount: 0, byStatus: {} });
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    category: "",
    amount: "",
    description: "",
    receiptUrl: "",
    receiptFile: null,
    expenses: [{ ...emptyExpense }],
  });
  const [decision, setDecision] = useState({ action: "", note: "" });
  const [paymentForm, setPaymentForm] = useState({
    method: "BANK_TRANSFER",
    reference: "",
    note: "",
  });
  const [queueFilters, setQueueFilters] = useState({ search: "", status: "" });
  const [reportFilters, setReportFilters] = useState({ status: "", from: "", to: "" });
  const [activePage, setActivePage] = useState("dashboard");
  const [profileForm, setProfileForm] = useState(() => ({
    name: session?.name || "",
    email: session?.email || "",
  }));

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );
  const isEmployee = session?.role === "EMPLOYEE";
  const isManager = session?.role === "MANAGER";
  const isFinance = session?.role === "FINANCE";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        api.get("/reimbursements"),
        api.get("/notifications"),
        api.get("/reports/summary", {
          params: Object.fromEntries(
            Object.entries(reportFilters).filter(([, value]) => value),
          ),
        }),
      ];
      if (session.role === "MANAGER" || session.role === "FINANCE") {
        requests.push(api.get("/audit-logs"));
      }
      const [reimbursementResponse, notificationResponse, reportResponse, auditResponse] = await Promise.all(requests);
      setItems(reimbursementResponse.data.data);
      setNotifications(notificationResponse.data.data);
      setSummary(reportResponse.data.data);
      setAuditLogs(auditResponse?.data?.data || []);
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [session, reportFilters]);

  useEffect(() => {
    if (!session) return undefined;
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, [session, loadData]);

  const submitAuth = async (event) => {
    event.preventDefault();
    if (actionKey) return;
    setAuthError("");
    setActionKey("auth");
    try {
      const response = await api.post(
        `/auth/${authMode === "login" ? "login" : "register"}`,
        authForm,
      );
      const { user, token } = response.data.data;
      localStorage.setItem("reimbursement_token", token);
      localStorage.setItem("reimbursement_user", JSON.stringify(user));
      setProfileForm({ name: user.name || "", email: user.email || "" });
      setSession(user);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const logout = () => {
    localStorage.removeItem("reimbursement_token");
    localStorage.removeItem("reimbursement_user");
    setSession(null);
    setItems([]);
    setNotifications([]);
    setAuditLogs([]);
    setSummary({ total: 0, totalAmount: 0, byStatus: {} });
  };

  const updateExpense = (index, field, value) => {
    setForm((current) => ({
      ...current,
      expenses: current.expenses.map((expense, expenseIndex) =>
        expenseIndex === index ? { ...expense, [field]: value } : expense,
      ),
    }));
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setForm({
      category: item.category || "",
      amount: item.amount || "",
      description: item.description || "",
      receiptUrl: item.receiptUrl || "",
      receiptFile: null,
      expenses: item.expenses?.length
        ? item.expenses.map((expense) => ({
            ...expense,
        receiptFile: null,
            expenseDate: expense.expenseDate?.slice(0, 10) || "",
          }))
        : [{ ...emptyExpense }],
    });
    setShowForm(true);
  };

  const deleteReimbursement = async () => {
    if (actionKey || !selected || selected.status !== "DRAFT") return;
    if (!window.confirm("Hapus draft reimbursement ini?")) return;
    setActionKey(`delete-${selected.id}`);
    try {
      await api.delete(`/reimbursements/${selected.id}`);
      setSelectedId(null);
      setNotice("Draft reimbursement berhasil dihapus.");
      await loadData();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const saveDraft = async (event) => {
    event.preventDefault();
    if (actionKey) return;
    const validExpenses = form.expenses.filter((expense) =>
      expense.category.trim() &&
      expense.amount &&
      Number.isFinite(Number(expense.amount)) &&
      Number(expense.amount) > 0 &&
      expense.expenseDate &&
      expense.description.trim(),
    );
    const hasInvalidExpense = validExpenses.some(
      (expense) =>
        !expense.amount ||
        !Number.isFinite(Number(expense.amount)) ||
        Number(expense.amount) <= 0 ||
        !expense.expenseDate ||
        !expense.description.trim(),
    );
    const reimbursementAmount = Number(form.amount);
    if (
      !form.category.trim() ||
      !form.amount ||
      !Number.isFinite(reimbursementAmount) ||
      reimbursementAmount < 0 ||
      hasInvalidExpense
    ) {
      setNotice("Lengkapi data reimbursement dan expense yang diisi.");
      return;
    }
    setActionKey(editingId ? `edit-${editingId}` : "create");
    try {
      const payload = {
        category: form.category.trim(),
        amount: Number(form.amount),
        description: form.description.trim(),
        receiptUrl: form.receiptUrl.trim(),
      };
      let savedReimbursement;
      let savedExpenses = [];
      const expensesPayload = validExpenses.map((expense) => ({
        ...Object.fromEntries(
          Object.entries(expense).filter(([key]) => key !== "receiptFile"),
        ),
        amount: Number(expense.amount),
      }));
      if (editingId) {
        const response = await api.patch(`/reimbursements/${editingId}`, payload);
        savedReimbursement = response.data.data;
        const expenseResponses = await Promise.all(
          expensesPayload.map((expense) => {
            const expenseId = expense.id;
            const expenseData = Object.fromEntries(
              Object.entries(expense).filter(([key]) => key !== "id"),
            );
            return expenseId
              ? api.patch(`/reimbursements/${editingId}/expenses/${expenseId}`, expenseData)
              : api.post(`/reimbursements/${editingId}/expenses`, expenseData);
          }),
        );
        savedExpenses = expenseResponses.map((expenseResponse) => expenseResponse.data.data);
      } else {
        const response = await api.post("/reimbursements", {
          ...payload,
        });
        savedReimbursement = response.data.data;
        const expenseResponses = await Promise.all(
          expensesPayload.map((expense) =>
            api.post(`/reimbursements/${savedReimbursement.id}/expenses`, expense),
          ),
        );
        savedExpenses = expenseResponses.map((expenseResponse) => expenseResponse.data.data);
      }
      if (form.receiptFile) {
        const receiptData = new FormData();
        receiptData.append("receipt", form.receiptFile);
        await api.post(`/reimbursements/${savedReimbursement.id}/receipt`, receiptData);
      }
      if (!savedExpenses.length) savedExpenses = savedReimbursement.expenses || [];
      await Promise.all(
        validExpenses.map((expense, index) => {
          const savedExpense = savedExpenses[index];
          if (!expense.receiptFile || !savedExpense?.id) return null;
          const receiptData = new FormData();
          receiptData.append("receipt", expense.receiptFile);
          return api.post(
            `/reimbursements/${savedReimbursement.id}/expenses/${savedExpense.id}/receipt`,
            receiptData,
          );
        }),
      );
      setForm({
        category: "",
        amount: "",
        description: "",
        receiptUrl: "",
        receiptFile: null,
        expenses: [{ ...emptyExpense }],
      });
      setEditingId(null);
      setShowForm(false);
      setNotice(
        editingId
          ? "Perubahan draft berhasil disimpan."
          : "Pengajuan berhasil disimpan sebagai draft.",
      );
      await loadData();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const submitDraft = async (id) => {
    if (actionKey) return;
    setActionKey(`submit-${id}`);
    try {
      await api.patch(`/reimbursements/${id}/submit`);
      setNotice("Pengajuan dikirim untuk direview manager.");
      await loadData();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const reviewReimbursement = async () => {
    if (actionKey || !selected || !decision.action) return;
    if (["revise", "reject"].includes(decision.action) && !decision.note.trim()) {
      setNotice("Catatan wajib diisi untuk meminta revisi atau menolak pengajuan.");
      return;
    }
    if (
      isFinance &&
      ((selected.status === "MANAGER_APPROVED" && decision.action !== "start") ||
        (selected.status === "FINANCE_REVIEW" &&
          !["verify", "revise", "reject"].includes(decision.action)))
    ) {
      setNotice("Aksi Finance tidak sesuai dengan status reimbursement.");
      return;
    }
    const endpoint = isManager
      ? `/reimbursements/${selected.id}/manager`
      : `/reimbursements/${selected.id}/finance`;
    setActionKey(`review-${selected.id}`);
    try {
      await api.patch(endpoint, decision);
      setDecision({ action: "", note: "" });
      setNotice("Keputusan berhasil disimpan.");
      await loadData();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const payReimbursement = async () => {
    if (actionKey || !selected || !isFinance) return;
    if (selected.status !== "READY_FOR_PAYMENT") {
      setNotice("Pembayaran hanya dapat diproses saat status siap dibayar.");
      return;
    }
    if (!paymentForm.method) {
      setNotice("Pilih metode pembayaran terlebih dahulu.");
      return;
    }
    setActionKey(`pay-${selected.id}`);
    try {
      await api.post(`/reimbursements/${selected.id}/payment`, {
        method: paymentForm.method,
        reference: paymentForm.reference.trim() || `PAY-${selected.id}-${Date.now()}`,
        note: paymentForm.note.trim() || "Pembayaran diproses melalui dashboard finance.",
      });
      setPaymentForm({ method: "BANK_TRANSFER", reference: "", note: "" });
      setNotice("Pembayaran berhasil diproses.");
      await loadData();
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const markRead = async (id) => {
    if (actionKey) return;
    setActionKey(`notification-${id}`);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    if (actionKey) return;
    setActionKey("profile");
    try {
      const response = await api.patch("/profile", profileForm);
      const { user, token } = response.data.data;
      const updatedUser = { ...session, ...user };
      localStorage.setItem("reimbursement_token", token);
      localStorage.setItem("reimbursement_user", JSON.stringify(updatedUser));
      setSession(updatedUser);
      setNotice("Profile berhasil diperbarui.");
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setActionKey("");
    }
  };

  const openQueue = (status = "") => {
    setQueueFilters({ search: "", status });
    setSelectedId(null);
    setActivePage(status === "READY_FOR_PAYMENT" ? "payment" : "reimbursement");
  };

  const openApprovalHistory = () => {
    setQueueFilters({ search: "", status: "" });
    setSelectedId(null);
    setActivePage("approval");
  };

  const openPage = (page) => {
    setActivePage(page);
    setNotice("");
  };

  if (!session)
    return (
      <main className="auth-shell">
        <section className="auth-intro">
          <p className="eyebrow">Reimbursement operations</p>
          <h1>Pengeluaran yang rapi, keputusan yang jelas.</h1>
          <p className="intro-copy">
            Kelola pengajuan, review, dan pembayaran dalam satu ruang kerja yang
            mudah dipantau.
          </p>
        </section>
        <section className="auth-panel">
          <div className="panel-heading">
            <h2>
              {authMode === "login"
                ? "Masuk ke dashboard"
                : "Buat akun employee"}
            </h2>
          </div>
          <form onSubmit={submitAuth} className="stack-form">
            {authMode === "register" && (
              <label>
                Nama
                <input
                  required
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, name: event.target.value })
                  }
                />
              </label>
            )}
            <label>
              Email
              <input
                required
                type="email"
                value={authForm.email}
                onChange={(event) =>
                  setAuthForm({ ...authForm, email: event.target.value })
                }
              />
            </label>
            <label>
              Password
              <input
                required
                minLength="6"
                type="password"
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
              />
            </label>
            {authError && <p className="error-text">{authError}</p>}
            <button className="primary-button" type="submit">
              {authMode === "login" ? "Masuk" : "Daftar sebagai employee"}
            </button>
          </form>
          <button
            className="link-button"
            type="button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setAuthError("");
            }}
          >
            {authMode === "login"
              ? "Belum punya akun? Daftar"
              : "Sudah punya akun? Masuk"}
          </button>
        </section>
      </main>
    );

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const statusCount = (status) => summary.byStatus[status]?.count || 0;
  const visibleItems = activePage === "approval"
    ? items.filter((item) => item.status !== "DRAFT")
    : items;
  const filteredItems = visibleItems.filter((item) => {
    const query = queueFilters.search.trim().toLowerCase();
    const matchesSearch = !query || [item.category, item.employeeName, item.description]
      .some((value) => value?.toLowerCase().includes(query));
    return matchesSearch && (!queueFilters.status || item.status === queueFilters.status);
  });
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark small">RM</div>
          <div>
            <strong>Reimburse</strong>
            <span>Operations desk</span>
          </div>
        </div>
        <div className="user-menu">
          <span className="role-pill">{roleLabels[session.role]}</span>
          <span className="user-name">{session.name}</span>
          <button className="ghost-button" type="button" onClick={logout}>
            Keluar
          </button>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="sidebar-account">
            <div>
              <strong>{session.name}</strong>
            </div>
          </div>
          <div className="sidebar-nav">
            <div className="sidebar-label">Main Menu</div>
            <button className={`sidebar-link ${activePage === "dashboard" ? "sidebar-link-active" : ""}`} type="button" onClick={() => openPage("dashboard")}><span>⌂</span> Dashboard</button>
            <div className="sidebar-label">Transaksi</div>
            <button className="sidebar-link" type="button" onClick={() => {
              if (isEmployee) {
                setEditingId(null);
                setShowForm(true);
                openPage("reimbursement");
              } else {
                openQueue();
              }
            }}><span>▤</span> Reimbursement <b>⌄</b></button>
            <button className="sidebar-link" type="button" onClick={() => openQueue("READY_FOR_PAYMENT")}><span>▣</span> Pembayaran <b>⌄</b></button>
            <div className="sidebar-label">Approval</div>
            <button className={`sidebar-link ${activePage === "approval" ? "sidebar-link-active" : ""}`} type="button" onClick={openApprovalHistory}><span>✓</span> Riwayat Approval</button>
            <div className="sidebar-label">Lainnya</div>
            <button className={`sidebar-link ${activePage === "notifications" ? "sidebar-link-active" : ""}`} type="button" onClick={() => openPage("notifications")}><span>♢</span> Notifikasi {unreadCount > 0 && <i />}</button>
            <button className={`sidebar-link ${activePage === "monitoring" ? "sidebar-link-active" : ""}`} type="button" onClick={() => openPage("monitoring")}><span>▥</span> Laporan Monitoring</button>
            <button className="sidebar-link" type="button" onClick={() => {
              setNotice(`${session.name} · ${session.email} · ${roleLabels[session.role]}`);
              openPage("profile");
            }}><span>○</span> Profile</button>
          </div>
          <button className="sidebar-logout" type="button" onClick={logout}><span>⇥</span> Keluar</button>
        </aside>
        <section className="content-area" id="profile-section">
          <div className="page-header">
            <div>
              <p className="breadcrumb">Home <b>/</b> Dashboard</p>
              <h1>Dashboard</h1>
              <p className="muted">Ringkasan aktivitas reimbursement Anda</p>
            </div>
            {isEmployee && (
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setShowForm(true);
                  openPage("reimbursement");
                }}
              >
                + Pengajuan baru
              </button>
            )}
          </div>
          {activePage === "dashboard" && <section className="welcome-banner">
            <div>
              <p>Dashboard Overview</p>
              <h2>Selamat datang, {roleLabels[session.role]}! </h2>
              <small>Pantau status reimbursement dan aktivitas pengajuan Anda melalui dashboard ini.</small>
              {isEmployee && <button type="button" onClick={() => { setEditingId(null); setShowForm(true); openPage("reimbursement"); }}>＋ &nbsp;Ajukan Reimbursement</button>}
            </div>
          </section>}
          {activePage === "dashboard" && <section className="summary-cards" aria-label="Ringkasan reimbursement">
            <div className="summary-card summary-card-blue">
              <div className="summary-card-top"><span className="summary-icon">▤</span><span>Total</span></div>
              <strong>{summary.total || items.length}</strong>
              <small>Semua reimbursement</small>
            </div>
            <div className="summary-card summary-card-orange">
              <div className="summary-card-top"><span className="summary-icon">◷</span><span>Pending</span></div>
              <strong>{statusCount("SUBMITTED") + statusCount("FINANCE_REVIEW")}</strong>
              <small>Menunggu proses</small>
            </div>
            <div className="summary-card summary-card-green">
              <div className="summary-card-top"><span className="summary-icon">✓</span><span>Approved</span></div>
              <strong>{statusCount("MANAGER_APPROVED")}</strong>
              <small>Telah disetujui</small>
            </div>
            <div className="summary-card summary-card-purple">
              <div className="summary-card-top"><span className="summary-icon">Rp</span><span>Payment</span></div>
              <strong>{statusCount("READY_FOR_PAYMENT")}</strong>
              <small>Menunggu pembayaran</small>
            </div>
            <div className="summary-card summary-card-teal">
              <div className="summary-card-top"><span className="summary-icon">✓</span><span>Paid</span></div>
              <strong>{statusCount("PAID")}</strong>
              <small>Sudah dibayarkan</small>
            </div>
          </section>}
          {notice && (
            <div className="notice">
              {notice}
              <button type="button" onClick={() => setNotice("")}>
                Tutup
              </button>
            </div>
          )}
          {activePage === "reimbursement" && showForm && (
            <section className="form-section" id="reimbursement-form">
              <div className="section-title">
                <div>
                  <p className="eyebrow">{editingId ? "Edit reimbursement" : "Draft baru"}</p>
                  <h2>{editingId ? "Perbarui reimbursement" : "Ajukan reimbursement"}</h2>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setShowForm(false);
                  }}
                  aria-label="Tutup form"
                >
                  ×
                </button>
              </div>
              <form
                onSubmit={saveDraft}
                className="reimbursement-form"
              >
                <div className="form-grid">
                  <label>
                    Kategori
                    <input
                      required
                      value={form.category}
                      onChange={(event) =>
                        setForm({ ...form, category: event.target.value })
                      }
                      placeholder="Contoh: Perjalanan dinas"
                    />
                  </label>
                  <label>
                    Total amount
                    <input
                      required
                      min="0"
                      type="number"
                      value={form.amount}
                      onChange={(event) =>
                        setForm({ ...form, amount: event.target.value })
                      }
                      placeholder="0"
                    />
                  </label>
                  <label className="full-field">
                    Deskripsi
                    <textarea
                      required
                      value={form.description}
                      onChange={(event) =>
                        setForm({ ...form, description: event.target.value })
                      }
                      placeholder="Jelaskan kebutuhan pengeluaran"
                    />
                  </label>
                  <label className="full-field">
                    Receipt URL
                    <input
                      value={form.receiptUrl}
                      onChange={(event) =>
                        setForm({ ...form, receiptUrl: event.target.value })
                      }
                      placeholder="https://..."
                    />
                  </label>
                  <label className="full-field">
                    Upload bukti (JPG, PNG, PDF maksimal 5 MB)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={(event) =>
                        setForm({ ...form, receiptFile: event.target.files?.[0] || null })
                      }
                    />
                  </label>
                </div>
                <div className="expense-builder">
                  <div className="section-title">
                    <div>
                      <p className="eyebrow">Rincian</p>
                      <h3>Expense items</h3>
                    </div>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          expenses: [...form.expenses, { ...emptyExpense }],
                        })
                      }
                    >
                      + Tambah item
                    </button>
                  </div>
                  {form.expenses.map((expense, index) => (
                    <div className="expense-row" key={index}>
                      <input
                        placeholder="Kategori"
                        value={expense.category}
                        onChange={(event) =>
                          updateExpense(index, "category", event.target.value)
                        }
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Nominal"
                        value={expense.amount}
                        onChange={(event) =>
                          updateExpense(index, "amount", event.target.value)
                        }
                      />
                      <input
                        type="date"
                        value={expense.expenseDate}
                        onChange={(event) =>
                          updateExpense(
                            index,
                            "expenseDate",
                            event.target.value,
                          )
                        }
                      />
                      <input
                        placeholder="Deskripsi"
                        value={expense.description}
                        onChange={(event) =>
                          updateExpense(
                            index,
                            "description",
                            event.target.value,
                          )
                        }
                      />
                      <input
                        type="url"
                        placeholder="Tautan bukti"
                        value={expense.receiptUrl}
                        onChange={(event) =>
                          updateExpense(index, "receiptUrl", event.target.value)
                        }
                      />
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        aria-label={`Upload bukti expense ${index + 1}`}
                        onChange={(event) =>
                          updateExpense(index, "receiptFile", event.target.files?.[0] || null)
                        }
                      />
                    </div>
                  ))}
                </div>
                <button className="primary-button" type="submit">
                  {editingId ? "Simpan perubahan draft" : "Simpan draft"}
                </button>
              </form>
            </section>
          )}
          {(activePage === "reimbursement" || activePage === "payment" || activePage === "approval") && <div className="dashboard-grid" id="reimbursement-queue">
            <section className="list-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">Live queue</p>
                  <h2>Reimbursement</h2>
                </div>
                <span className="count-label">{items.length} total</span>
              </div>
              <div className="queue-filters">
                <input
                  aria-label="Cari reimbursement"
                  placeholder="Cari kategori, pengaju, atau deskripsi"
                  value={queueFilters.search}
                  onChange={(event) =>
                    setQueueFilters({ ...queueFilters, search: event.target.value })
                  }
                />
                <select
                  aria-label="Filter status reimbursement"
                  value={queueFilters.status}
                  onChange={(event) =>
                    setQueueFilters({ ...queueFilters, status: event.target.value })
                  }
                >
                  {statusFilterOptions.map(([value, label]) => (
                    <option value={value} key={value || "all-queue-statuses"}>{label}</option>
                  ))}
                </select>
              </div>
              {loading ? (
                <div className="empty-state">Memuat data...</div>
              ) : filteredItems.length === 0 ? (
                <div className="empty-state">Belum ada pengajuan.</div>
              ) : (
                <div className="request-list">
                  {filteredItems.map((item) => (
                    <button
                      className={`request-row ${selectedId === item.id ? "selected" : ""}`}
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <span className="request-icon">
                        {item.category.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="request-main">
                        <strong>{item.category}</strong>
                        <small>
                          {item.employeeName} ·{" "}
                          {new Date(item.createdAt).toLocaleDateString("id-ID")}
                        </small>
                      </span>
                      <span className="request-amount">
                        Rp {Number(item.amount).toLocaleString("id-ID")}
                      </span>
                      <span
                        className={`status status-${item.status.toLowerCase()}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
            <aside className="detail-panel">
              {selected ? (
                <>
                  <div className="detail-heading">
                    <div>
                      <p className="eyebrow">Request #{selected.id}</p>
                      <h2>{selected.category}</h2>
                    </div>
                    <div className="detail-actions">
                      <span
                        className={`status status-${selected.status.toLowerCase()}`}
                      >
                        {statusLabels[selected.status]}
                      </span>
                      {isEmployee &&
                        ["DRAFT", "REVISION_REQUIRED"].includes(selected.status) && (
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => startEditing(selected)}
                          >
                            Edit
                          </button>
                        )}
                      {isEmployee && selected.status === "DRAFT" && (
                        <button
                          className="ghost-button danger-button"
                          type="button"
                          onClick={deleteReimbursement}
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="detail-description">{selected.description}</p>
                  <div className="detail-meta">
                    <div>
                      <span>Pengaju</span>
                      <strong>{selected.employeeName}</strong>
                    </div>
                    <div>
                      <span>Amount</span>
                      <strong>
                        Rp {Number(selected.amount).toLocaleString("id-ID")}
                      </strong>
                    </div>
                    <div>
                      <span>Dibuat</span>
                      <strong>
                        {new Date(selected.createdAt).toLocaleDateString(
                          "id-ID",
                        )}
                      </strong>
                    </div>
                  </div>
                  {selected.payment && (
                    <div className="payment-box">
                      <div className="section-title">
                        <div>
                          <p className="eyebrow">Payment</p>
                          <h3>Detail pembayaran</h3>
                        </div>
                        <span className={`status status-${selected.payment.status.toLowerCase()}`}>
                          {selected.payment.status}
                        </span>
                      </div>
                      <div className="payment-meta">
                        <div>
                          <span>Metode</span>
                          <strong>{paymentMethodLabels[selected.payment.method] || selected.payment.method}</strong>
                        </div>
                        <div>
                          <span>Reference</span>
                          <strong>{selected.payment.reference || "-"}</strong>
                        </div>
                        <div>
                          <span>Dibayar pada</span>
                          <strong>
                            {selected.payment.paidAt
                              ? new Date(selected.payment.paidAt).toLocaleString("id-ID")
                              : "Belum dibayar"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="detail-block">
                    <p className="eyebrow">Timeline</p>
                    {(selected.history || []).map((history) => (
                      <div className="timeline-row" key={history.id}>
                        <span className="timeline-dot" />
                        <div>
                          <strong>{statusLabels[history.status]}</strong>
                          <small>{history.note}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="detail-block">
                    <p className="eyebrow">Rincian expense</p>
                    {(selected.expenses || []).length === 0 ? (
                      <p className="muted">Belum ada rincian expense.</p>
                    ) : (
                      <div className="expense-list">
                        {selected.expenses.map((expense) => (
                          <div className="expense-detail-row" key={expense.id}>
                            <div>
                              <strong>{expense.category}</strong>
                              <small>
                                {expense.description} · {new Date(expense.expenseDate).toLocaleDateString("id-ID")}
                              </small>
                            </div>
                            <span>Rp {Number(expense.amount).toLocaleString("id-ID")}</span>
                            {expense.receiptUrl && (
                              <a href={expense.receiptUrl} target="_blank" rel="noreferrer">
                                Lihat bukti
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {isEmployee && selected.status === "DRAFT" && (
                    <button
                      className="primary-button full-button"
                      type="button"
                      disabled={actionKey === `submit-${selected.id}`}
                      onClick={() => submitDraft(selected.id)}
                    >
                      {actionKey === `submit-${selected.id}`
                        ? "Mengirim..."
                        : "Kirim untuk review"}
                    </button>
                  )}
                  {((isManager && selected.status === "SUBMITTED") ||
                    (isFinance &&
                      ["MANAGER_APPROVED", "FINANCE_REVIEW"].includes(
                        selected.status,
                      ))) && (
                    <div className="decision-box">
                      <p className="eyebrow">
                        {isFinance ? "Verifikasi finance" : "Tindakan review"}
                      </p>
                      <select
                        value={decision.action}
                        onChange={(event) =>
                          setDecision({
                            ...decision,
                            action: event.target.value,
                          })
                        }
                      >
                        <option value="">Pilih tindakan</option>
                        {isManager && (
                          <>
                            <option value="approve">Setujui</option>
                            <option value="revise">Minta revisi</option>
                            <option value="reject">Tolak</option>
                          </>
                        )}
                        {isFinance && selected.status === "MANAGER_APPROVED" && (
                          <option value="start">Mulai review finance</option>
                        )}
                        {isFinance && selected.status === "FINANCE_REVIEW" && (
                          <>
                            <option value="verify">Setujui verifikasi</option>
                            <option value="revise">Minta revisi</option>
                            <option value="reject">Tolak</option>
                          </>
                        )}
                      </select>
                      <textarea
                        placeholder={
                          ["revise", "reject"].includes(decision.action)
                            ? "Catatan wajib untuk revisi atau penolakan"
                            : "Catatan review (opsional)"
                        }
                        value={decision.note}
                        onChange={(event) =>
                          setDecision({ ...decision, note: event.target.value })
                        }
                      />
                      <button
                        className="primary-button full-button"
                        type="button"
                        disabled={actionKey === `review-${selected.id}`}
                        onClick={reviewReimbursement}
                      >
                        {actionKey === `review-${selected.id}`
                          ? "Menyimpan..."
                          : "Simpan keputusan"}
                      </button>
                    </div>
                  )}
                  {isFinance && selected.status === "READY_FOR_PAYMENT" && (
                    <div className="payment-box payment-form">
                      <div>
                        <p className="eyebrow">Payment</p>
                        <h3>Proses pembayaran</h3>
                      </div>
                      <label>
                        Metode pembayaran
                        <select
                          value={paymentForm.method}
                          onChange={(event) =>
                            setPaymentForm({ ...paymentForm, method: event.target.value })
                          }
                        >
                          {Object.entries(paymentMethodLabels).map(([value, label]) => (
                            <option value={value} key={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Reference pembayaran
                        <input
                          value={paymentForm.reference}
                          onChange={(event) =>
                            setPaymentForm({ ...paymentForm, reference: event.target.value })
                          }
                          placeholder="Opsional, dibuat otomatis jika kosong"
                        />
                      </label>
                      <label>
                        Catatan pembayaran
                        <textarea
                          value={paymentForm.note}
                          onChange={(event) =>
                            setPaymentForm({ ...paymentForm, note: event.target.value })
                          }
                          placeholder="Catatan untuk pengaju"
                        />
                      </label>
                      <button
                        className="primary-button full-button"
                        type="button"
                        disabled={actionKey === `pay-${selected.id}`}
                        onClick={payReimbursement}
                      >
                        {actionKey === `pay-${selected.id}` ? "Memproses..." : "Konfirmasi pembayaran"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state detail-empty">
                  Pilih pengajuan untuk melihat detail.
                </div>
              )}
            </aside>
          </div>}
          {activePage === "monitoring" && <section className="monitoring-section" id="monitoring-section">
            <div className="section-title">
              <div>
                <p className="eyebrow">Reports & monitoring</p>
                <h2>Ringkasan proses</h2>
              </div>
              <span className="count-label">{summary.total} pengajuan</span>
            </div>
            <div className="monitoring-grid">
              <div><span>Draft</span><strong>{statusCount("DRAFT")}</strong></div>
              <div><span>Menunggu review</span><strong>{statusCount("SUBMITTED") + statusCount("FINANCE_REVIEW")}</strong></div>
              <div><span>Siap dibayar</span><strong>{statusCount("READY_FOR_PAYMENT")}</strong></div>
              <div><span>Selesai dibayar</span><strong>{statusCount("PAID")}</strong></div>
              <div><span>Ditolak</span><strong>{statusCount("REJECTED")}</strong></div>
              <div><span>Perlu revisi</span><strong>{statusCount("REVISION_REQUIRED")}</strong></div>
              <div><span>Total nominal</span><strong>Rp {Number(summary.totalAmount).toLocaleString("id-ID")}</strong></div>
            </div>
            <div className="report-filters">
              <select
                aria-label="Filter laporan berdasarkan status"
                value={reportFilters.status}
                onChange={(event) =>
                  setReportFilters({ ...reportFilters, status: event.target.value })
                }
              >
                {statusFilterOptions.map(([value, label]) => (
                  <option value={value} key={value || "all-report-statuses"}>{label}</option>
                ))}
              </select>
              <label>
                Dari
                <input
                  type="date"
                  value={reportFilters.from}
                  onChange={(event) =>
                    setReportFilters({ ...reportFilters, from: event.target.value })
                  }
                />
              </label>
              <label>
                Sampai
                <input
                  type="date"
                  value={reportFilters.to}
                  onChange={(event) =>
                    setReportFilters({ ...reportFilters, to: event.target.value })
                  }
                />
              </label>
              <button
                className="ghost-button"
                type="button"
                onClick={() => setReportFilters({ status: "", from: "", to: "" })}
              >
                Reset filter
              </button>
            </div>
          </section>}
          {activePage === "notifications" && <section className="notifications-section" id="notifications-section">
            <div className="section-title">
              <div>
                <p className="eyebrow">Inbox</p>
                <h2>Notifikasi</h2>
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">Belum ada notifikasi.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  className={`notification-row ${notification.isRead ? "read" : ""}`}
                  key={notification.id}
                >
                  <span className="notification-mark">!</span>
                  <div>
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                  </div>
                  {!notification.isRead && (
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => markRead(notification.id)}
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
              ))
            )}
          </section>}
          {activePage === "profile" && <section className="notifications-section profile-page">
            <div className="section-title">
              <div>
                <p className="eyebrow">Account</p>
                <h2>Profile</h2>
              </div>
            </div>
            <div className="profile-details">
              <div><span>Role</span><strong>{roleLabels[session.role]}</strong></div>
            </div>
            <form className="profile-form" onSubmit={updateProfile}>
              <label>
                Nama
                <input
                  required
                  value={profileForm.name}
                  onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                />
              </label>
              <label>
                Email
                <input
                  required
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit" disabled={actionKey === "profile"}>
                {actionKey === "profile" ? "Menyimpan..." : "Simpan profile"}
              </button>
            </form>
          </section>}
          {(isManager || isFinance) && (
            <section className="notifications-section audit-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">System</p>
                  <h2>Audit trail</h2>
                </div>
                <span className="count-label">{auditLogs.length} aktivitas</span>
              </div>
              {auditLogs.length === 0 ? (
                <div className="empty-state">Belum ada aktivitas tercatat.</div>
              ) : (
                auditLogs.slice(0, 10).map((log) => (
                  <div className="notification-row" key={log.id}>
                    <span className="notification-mark">{log.action.slice(0, 1)}</span>
                    <div>
                      <strong>{log.action}</strong>
                      <p>{log.details || "Aktivitas reimbursement tercatat."}</p>
                    </div>
                    <small className="muted">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </small>
                  </div>
                ))
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
