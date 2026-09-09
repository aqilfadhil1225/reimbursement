import { useEffect, useMemo, useState } from "react";
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
const roleDescriptions = {
  EMPLOYEE: "Kelola pengajuan reimbursement",
  MANAGER: "Review pengajuan tim",
  FINANCE: "Verifikasi dan proses pembayaran",
};
const emptyExpense = {
  category: "",
  amount: "",
  expenseDate: "",
  description: "",
  receiptUrl: "",
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
    expenses: [{ ...emptyExpense }],
  });
  const [decision, setDecision] = useState({ action: "", note: "" });

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );
  const isEmployee = session?.role === "EMPLOYEE";
  const isManager = session?.role === "MANAGER";
  const isFinance = session?.role === "FINANCE";

  const loadData = async () => {
    setLoading(true);
    try {
      const [reimbursementResponse, notificationResponse] = await Promise.all([
        api.get("/reimbursements"),
        api.get("/notifications"),
      ]);
      setItems(reimbursementResponse.data.data);
      setNotifications(notificationResponse.data.data);
    } catch (error) {
      setNotice(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return undefined;
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, [session]);

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
      expenses: item.expenses?.length
        ? item.expenses.map((expense) => ({
            ...expense,
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

  const submitReimbursement = async (event) => {
    event.preventDefault();
    if (actionKey) return;
    const validExpenses = form.expenses.filter((expense) =>
      expense.category.trim(),
    );
    const hasIncompleteExpense = form.expenses.some((expense) => {
      const hasAnyValue = Object.values(expense).some((value) =>
        String(value).trim(),
      );
      const hasAllValues =
        expense.category.trim() &&
        expense.amount &&
        Number(expense.amount) > 0 &&
        expense.expenseDate &&
        expense.description.trim();

      return hasAnyValue && !hasAllValues;
    });
    const hasInvalidExpense = validExpenses.some(
      (expense) =>
        !expense.amount ||
        !Number.isFinite(Number(expense.amount)) ||
        Number(expense.amount) <= 0 ||
        !expense.expenseDate ||
        !expense.description.trim(),
    );
    const expenseTotal = validExpenses.reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );
    const reimbursementAmount = Number(form.amount);
    if (
      !form.category.trim() ||
      !form.description.trim() ||
      !form.amount ||
      !Number.isFinite(reimbursementAmount) ||
      reimbursementAmount <= 0 ||
      validExpenses.length === 0 ||
      hasIncompleteExpense ||
      hasInvalidExpense
    ) {
      setNotice(
        "Lengkapi kategori, deskripsi, dan semua expense yang diisi.",
      );
      return;
    }
    if (Math.abs(expenseTotal - reimbursementAmount) > 0.01) {
      setNotice(
        `Total expense harus sama dengan total reimbursement (Rp ${expenseTotal.toLocaleString("id-ID")}).`,
      );
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
      if (editingId)
        await api.patch(`/reimbursements/${editingId}`, {
          ...payload,
          expenses: validExpenses.map((expense) => ({
            ...expense,
            amount: Number(expense.amount),
          })),
        });
      else
        await api.post("/reimbursements", {
          ...payload,
          expenses: validExpenses.map((expense) => ({
            ...expense,
            amount: Number(expense.amount),
          })),
        });
      setForm({
        category: "",
        amount: "",
        description: "",
        receiptUrl: "",
        expenses: [{ ...emptyExpense }],
      });
      setEditingId(null);
      setShowForm(false);
      setNotice(
        editingId
          ? "Perubahan reimbursement berhasil disimpan."
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
    if (actionKey || !selected) return;
    setActionKey(`pay-${selected.id}`);
    try {
      await api.post(`/reimbursements/${selected.id}/payment`, {
        method: "BANK_TRANSFER",
        reference: `PAY-${selected.id}-${Date.now()}`,
        note: "Pembayaran diproses melalui dashboard finance.",
      });
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

  if (!session)
    return (
      <main className="auth-shell">
        <section className="auth-intro">
          <div className="brand-mark">RM</div>
          <p className="eyebrow">Reimbursement operations</p>
          <h1>Pengeluaran yang rapi, keputusan yang jelas.</h1>
          <p className="intro-copy">
            Kelola pengajuan, review, dan pembayaran dalam satu ruang kerja yang
            mudah dipantau.
          </p>
          <div className="process-line">
            <span>Submit</span>
            <i />
            <span>Review</span>
            <i />
            <span>Pay</span>
          </div>
        </section>
        <section className="auth-panel">
          <div className="panel-heading">
            <p className="eyebrow">Workspace access</p>
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

  const openItems = items.filter(
    (item) => !["PAID", "REJECTED"].includes(item.status),
  ).length;
  const unreadCount = notifications.filter((item) => !item.isRead).length;
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
          <div className="sidebar-label">Overview</div>
          <div className="side-stat">
            <span>Pengajuan aktif</span>
            <strong>{openItems}</strong>
          </div>
          <div className="side-stat">
            <span>Notifikasi baru</span>
            <strong>{unreadCount}</strong>
          </div>
          <div className="sidebar-note">
            <span className="dot" /> API tersambung
            <br />
            <small>Data dimuat langsung dari backend</small>
          </div>
          <div className="sidebar-note role-note">
            <strong>{roleLabels[session.role]}</strong>
            <br />
            <small>{roleDescriptions[session.role]}</small>
          </div>
        </aside>
        <section className="content-area">
          <div className="page-header">
            <div>
              <p className="eyebrow">
                {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
              </p>
              <h1>Selamat datang, {session.name.split(" ")[0]}.</h1>
              <p className="muted">
                Pantau progres reimbursement tanpa kehilangan konteks.
              </p>
            </div>
            {isEmployee && (
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setShowForm(!showForm);
                }}
              >
                + Pengajuan baru
              </button>
            )}
          </div>
          {notice && (
            <div className="notice">
              {notice}
              <button type="button" onClick={() => setNotice("")}>
                Tutup
              </button>
            </div>
          )}
          {showForm && (
            <section className="form-section">
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
                onSubmit={submitReimbursement}
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
                        required={index === 0}
                        placeholder="Kategori"
                        value={expense.category}
                        onChange={(event) =>
                          updateExpense(index, "category", event.target.value)
                        }
                      />
                      <input
                        required={index === 0}
                        type="number"
                        min="0"
                        placeholder="Nominal"
                        value={expense.amount}
                        onChange={(event) =>
                          updateExpense(index, "amount", event.target.value)
                        }
                      />
                      <input
                        required={index === 0}
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
                        required={index === 0}
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
                    </div>
                  ))}
                </div>
                <button className="primary-button" type="submit">
                  {editingId ? "Simpan perubahan" : "Simpan draft"}
                </button>
              </form>
            </section>
          )}
          <div className="dashboard-grid">
            <section className="list-section">
              <div className="section-title">
                <div>
                  <p className="eyebrow">Live queue</p>
                  <h2>Reimbursement</h2>
                </div>
                <span className="count-label">{items.length} total</span>
              </div>
              {loading ? (
                <div className="empty-state">Memuat data...</div>
              ) : items.length === 0 ? (
                <div className="empty-state">Belum ada pengajuan.</div>
              ) : (
                <div className="request-list">
                  {items.map((item) => (
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
                      <p className="eyebrow">Tindakan review</p>
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
                        {isManager && <option value="approve">Setujui</option>}
                        {isFinance && selected.status === "MANAGER_APPROVED" && (
                          <option value="start">Mulai review finance</option>
                        )}
                        {isFinance && selected.status === "FINANCE_REVIEW" && (
                          <option value="approve">Siapkan pembayaran</option>
                        )}
                        <option value="revise">Minta revisi</option>
                        <option value="reject">Tolak</option>
                      </select>
                      <textarea
                        placeholder="Catatan review"
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
                    <button
                      className="primary-button full-button"
                      type="button"
                      disabled={actionKey === `pay-${selected.id}`}
                      onClick={payReimbursement}
                    >
                      {actionKey === `pay-${selected.id}`
                        ? "Memproses..."
                        : "Proses pembayaran"}
                    </button>
                  )}
                </>
              ) : (
                <div className="empty-state detail-empty">
                  Pilih pengajuan untuk melihat detail.
                </div>
              )}
            </aside>
          </div>
          <section className="notifications-section">
            <div className="section-title">
              <div>
                <p className="eyebrow">Inbox</p>
                <h2>Notifikasi</h2>
              </div>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state">Belum ada notifikasi.</div>
            ) : (
              notifications.slice(0, 4).map((notification) => (
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
          </section>
        </section>
      </div>
    </main>
  );
}

export default App;
