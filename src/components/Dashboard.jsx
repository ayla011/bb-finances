// src/components/Dashboard.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, LineChart, Line,
  PieChart, Pie, Cell, ReferenceLine,
} from "recharts";

// ── CONFIG ────────────────────────────────────────────
const SHEETS_CONNECTED_DEFAULT = false;

// ── PALETTE ───────────────────────────────────────────
const C = {
  bg: "#05070e", card: "#0c1018", cardAlt: "#111a26", border: "#172033",
  cyan: "#06b6d4", cyanDim: "rgba(6,182,212,0.08)",
  green: "#10b981", greenDim: "rgba(16,185,129,0.08)",
  amber: "#f59e0b", amberDim: "rgba(245,158,11,0.08)",
  rose: "#f43f5e", roseDim: "rgba(244,63,94,0.08)",
  purple: "#8b5cf6", purpleDim: "rgba(139,92,246,0.08)",
  blue: "#3b82f6", blueDim: "rgba(59,130,246,0.08)",
  teal: "#14b8a6", tealDim: "rgba(20,184,166,0.08)",
  pink: "#ec4899", pinkDim: "rgba(236,72,153,0.08)",
  indigo: "#6366f1", indigoDim: "rgba(99,102,241,0.08)",
  orange: "#f97316",
  text: "#e2e8f0", muted: "#8b9dc3", dim: "#506380",
};

const mono = "'IBM Plex Mono', monospace";
const head = "'Outfit', sans-serif";
const body = "'DM Sans', sans-serif";

// ── DEFAULT TARGETS ───────────────────────────────────
const DEFAULT_TARGETS = {
  "Groceries": { amount: 8000, category: "Needs" },
  "Electricity": { amount: 4000, category: "Needs" },
  "Water": { amount: 400, category: "Needs" },
  "WiFi": { amount: 500, category: "Needs" },
  "Google One": { amount: 119, category: "Needs" },
  "Spotify": { amount: 338, category: "Needs" },
  "Netflix": { amount: 399, category: "Needs" },
  "Shopping": { amount: 3000, category: "Lifestyle" },
  "Clothing": { amount: 2000, category: "Lifestyle" },
  "Transport": { amount: 2000, category: "Lifestyle" },
  "House Maintenance": { amount: 1000, category: "Lifestyle" },
  "Grooming": { amount: 500, category: "Lifestyle" },
  "Medical/Dental": { amount: 500, category: "Lifestyle" },
  "Pet Expenses": { amount: 1000, category: "Lifestyle" },
  "Buffer/Misc": { amount: 2000, category: "Lifestyle" },
  "Parents' HMO": { amount: 6000, category: "Family" },
  "Mother's Shopping": { amount: 3000, category: "Family" },
  "Brother's Psychiatrist": { amount: 3000, category: "Family" },
  "Parents Help Buffer": { amount: 2000, category: "Family" },
  "Insurance": { amount: 6000, category: "Fixed" },
  "Tuition": { amount: 5000, category: "Fixed" },
  "Personal Wife": { amount: 6000, category: "Personal" },
  "Personal Husband": { amount: 6000, category: "Personal" },
  "Travel Fund": { amount: 3000, category: "Savings" },
  "SB Money Builder": { amount: 15000, category: "Savings" },
  "SB House & Lot": { amount: 20000, category: "Savings" },
  "Tuition Buffer": { amount: 5000, category: "Savings" },
  "MP2": { amount: 15000, category: "Investment" },
  "RTB": { amount: 3000, category: "Investment" },
  "UITF": { amount: 3211, category: "Investment" },
  "REITs": { amount: 5500, category: "Investment" },
  "PSEi Index": { amount: 3591, category: "Investment" },
};

const DEFAULT_INCOME = { wife: 79079, husband: 54979 };
const DEFAULT_PROFILE = { age: 29, netWorth: 1000000, efFund: 600000, japanFund: 400000 };

const CAT_COLORS = {
  Needs: C.cyan, Lifestyle: C.pink, Family: C.amber, Fixed: C.purple,
  Personal: C.blue, Savings: C.green, Investment: C.indigo,
};

// ── HELPERS ───────────────────────────────────────────
const fmt = (v) => `₱${Math.round(v).toLocaleString()}`;
const fmtK = (v) => `₱${(v/1000).toFixed(v >= 10000 ? 0 : 1)}k`;
const pct = (v, t) => t === 0 ? 0 : ((v / t) * 100).toFixed(1);
const today = new Date();
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const dayOfMonth = today.getDate();
const monthProgress = dayOfMonth / daysInMonth;
const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

// ── COMPONENTS ────────────────────────────────────────
const Dot = ({ color }) => <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}60`, marginRight: 7, flexShrink: 0 }} />;

const Card = ({ children, style, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", transition: "border-color 0.2s", ...style }}>{children}</div>
);

const Lbl = ({ children, icon, right }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: C.muted }}>{children}</span>
    </div>
    {right && <span style={{ fontFamily: mono, fontSize: 9, color: C.dim }}>{right}</span>}
  </div>
);

const Num = ({ label, value, sub, color, small }) => (
  <div>
    <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: C.dim, marginBottom: 2 }}>{label}</div>
    <div style={{ fontFamily: head, fontSize: small ? 18 : 24, fontWeight: 700, color: color || C.text, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ProgressBar = ({ value, max, color, height = 4 }) => {
  const p = Math.min(100, (value / max) * 100);
  const over = value > max;
  return (
    <div style={{ height, background: C.border, borderRadius: height / 2, overflow: "hidden", position: "relative" }}>
      <div style={{ height: "100%", width: `${Math.min(p, 100)}%`, background: over ? C.rose : color, borderRadius: height / 2, transition: "width 0.4s ease" }} />
      {!over && <div style={{ position: "absolute", left: `${monthProgress * 100}%`, top: 0, width: 1, height: "100%", background: C.text + "40" }} />}
    </div>
  );
};

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", boxShadow: "0 12px 32px rgba(0,0,0,0.6)" }}>
      <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
          <Dot color={p.color || p.stroke || p.fill} />
          <span style={{ fontFamily: head, fontSize: 11, color: C.text, fontWeight: 600 }}>{fmt(p.value)}</span>
          <span style={{ fontFamily: mono, fontSize: 7, color: C.dim }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
};

// ── API (via Next.js API route) ───────────────────────
const sheetsApi = {
  async fetchAll() {
    try {
      const res = await fetch('/api/sheets');
      return await res.json();
    } catch { return {}; }
  },

  // Append a new expense row
  async appendExpense(entry) {
    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch { /* silent */ }
  },

  // Append a new budget target row
  async appendTarget(target) {
    try {
      await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...target, type: "target" }),
      });
    } catch { /* silent */ }
  },

  // Update an existing row in-place by _row index
  // sheet:  "BudgetTargets" | "Profile" | "Expenses"
  // row:    the _row value stored on the object (1-based data row, header is row 0)
  // values: array matching the sheet's column order
  async updateRow(sheet, row, values) {
    const payload = { sheet, row, values };
    console.log("[sheetsApi.updateRow] PUT payload:", JSON.stringify(payload));
    try {
      const res = await fetch('/api/sheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("[sheetsApi.updateRow] response:", data);
    } catch (err) {
      console.error("[sheetsApi.updateRow] error:", err);
    }
  },

  async deleteRow(payload) {
    try {
      await fetch("/api/sheets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch { /* silent */ }
  },
};

// ── MAIN APP ──────────────────────────────────────────
const TABS = ["Dashboard", "Log", "Budget", "Analytics", "FIRE"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [income, setIncome] = useState(DEFAULT_INCOME);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(SHEETS_CONNECTED_DEFAULT);

  // ── FIX 1: Single useEffect — removed the duplicate ──────────────────────
  useEffect(() => {
    const loadSheets = async () => {
      try {
        const all = await sheetsApi.fetchAll();

        if (Array.isArray(all.expenses)) {
          setExpenses(
            all.expenses.map(e => ({
              ...e,
              amount: Number(e.amount),
              _row: e._row
            }))
          );
        }

        if (Array.isArray(all.targets)) {
          const mapped = {};
          all.targets.forEach(t => {
            mapped[t.name] = {
              amount: Number(t.amount),
              category: t.category,
              _row: t._row
            };
          });
          setTargets(mapped);
        }

        if (Array.isArray(all.profile) && all.profile.length > 0) {
          setProfile(all.profile[0]);
        }

        setSheetsConnected(true);

      } catch (e) {
        console.error(e);
      }
    };

    loadSheets();
  }, []); // runs once on mount only

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Needs");

  // ── FIX 4: Separate state for custom subcategory input ──────────────────
  const [customSub, setCustomSub] = useState("");

  const INCOME = income.wife + income.husband;

  // Inline editable value component
  const Editable = ({ id, value, color, fontSize = 12, fontWeight = 600, prefix = "₱" }) => {
    const isEditing = editingField === id;
    if (isEditing) {
      return (
        <div style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
          <span style={{ fontFamily: mono, fontSize: fontSize * 0.8, color: C.dim }}>{prefix}</span>
          <input
            type="number"
            step="100"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commitEdit(id); if (e.key === "Escape") setEditingField(null); }}
            onBlur={() => commitEdit(id)}
            style={{ width: Math.max(50, String(editValue).length * 9 + 20), padding: "2px 6px", background: C.cardAlt, border: `1px solid ${C.cyan}`, borderRadius: 4, color: C.text, fontFamily: mono, fontSize, fontWeight, outline: "none" }}
            autoFocus
          />
        </div>
      );
    }
    return (
      <span
        onClick={() => { setEditingField(id); setEditValue(String(value)); }}
        style={{ fontFamily: mono, fontSize, color: color || C.muted, fontWeight, cursor: "pointer", padding: "1px 4px", borderRadius: 4, borderBottom: `1px dashed ${C.dim}40`, transition: "background 0.15s" }}
        onMouseEnter={e => e.target.style.background = C.border}
        onMouseLeave={e => e.target.style.background = "transparent"}
        title="Click to edit"
      >
        {prefix}{Math.round(value).toLocaleString()}
      </span>
    );
  };

  const EditableRaw = ({ id, value, color, fontSize = 12, fontWeight = 600, suffix = "" }) => {
    const isEditing = editingField === id;
    if (isEditing) {
      return (
        <div style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
          <input
            type="number"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") commitEdit(id); if (e.key === "Escape") setEditingField(null); }}
            onBlur={() => commitEdit(id)}
            style={{ width: 60, padding: "2px 6px", background: C.cardAlt, border: `1px solid ${C.cyan}`, borderRadius: 4, color: C.text, fontFamily: mono, fontSize, fontWeight, outline: "none" }}
            autoFocus
          />
          {suffix && <span style={{ fontFamily: mono, fontSize: fontSize * 0.8, color: C.dim }}>{suffix}</span>}
        </div>
      );
    }
    return (
      <span
        onClick={() => { setEditingField(id); setEditValue(String(value)); }}
        style={{ fontFamily: mono, fontSize, color: color || C.muted, fontWeight, cursor: "pointer", padding: "1px 4px", borderRadius: 4, borderBottom: `1px dashed ${C.dim}40`, transition: "background 0.15s" }}
        onMouseEnter={e => e.target.style.background = C.border}
        onMouseLeave={e => e.target.style.background = "transparent"}
        title="Click to edit"
      >
        {value}{suffix}
      </span>
    );
  };

  // commitEdit: updates local state AND persists to Sheets via PUT
  const commitEdit = async (id) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { setEditingField(null); return; }
    const [type, key] = id.split(":");

    if (type === "target") {
      // Read _row directly from current targets state (avoids stale closure)
      const current = targets[key];
      if (!current) { setEditingField(null); return; }

      const updated = { ...current, amount: val };
      setTargets(prev => ({ ...prev, [key]: updated }));

      console.log("[commitEdit] target:", key, "| _row:", current._row, "| val:", val, "| sheetsConnected:", sheetsConnected);

      if (sheetsConnected) {
        if (current._row != null) {
          // Row exists in Sheets — update it in-place
          // BudgetTargets columns: name | amount | category
          await sheetsApi.updateRow("BudgetTargets", current._row, [key, val, current.category]);
        } else {
          // Row has no _row (e.g. added locally before Sheets loaded) — append it
          await sheetsApi.appendTarget({ name: key, amount: val, category: current.category });
          // Re-fetch so we get the real _row back
          const all = await sheetsApi.fetchAll();
          if (Array.isArray(all.targets)) {
            const mapped = {};
            all.targets.forEach(t => {
              mapped[t.name] = { amount: Number(t.amount), category: t.category, _row: t._row };
            });
            setTargets(mapped);
          }
        }
      }

    } else if (type === "income") {
      // Income has no dedicated sheet row — local state only
      setIncome(prev => ({ ...prev, [key]: val }));

    } else if (type === "profile") {
      const current = profile;
      const next = { ...current, [key]: val };
      setProfile(next);

      console.log("[commitEdit] profile:", key, "| _row:", current._row, "| val:", val, "| sheetsConnected:", sheetsConnected);

      if (sheetsConnected) {
        if (current._row != null) {
          // Profile columns: age | netWorth | efFund | japanFund
          await sheetsApi.updateRow("Profile", current._row, [
            next.age,
            next.netWorth,
            next.efFund,
            next.japanFund,
          ]);
        }
      }
    }

    setEditingField(null);
  };

  // Form state
  const [formDate, setFormDate] = useState(today.toISOString().slice(0, 10));
  const [formCat, setFormCat] = useState("Needs");
  const [formSub, setFormSub] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("Expense");

  // ── FIX 2: connectSheets now correctly maps arrays → objects ─────────────
  const connectSheets = async () => {
    setLoading(true);
    try {
      const all = await sheetsApi.fetchAll();
      setSheetsConnected(true);

      if (Array.isArray(all.targets)) {
        const mapped = {};
        all.targets.forEach(t => {
          mapped[t.name] = {
            amount: Number(t.amount),
            category: t.category,
            _row: t._row
          };
        });
        setTargets(mapped);
      }

      // FIX 2b: all.profile is an array — unwrap the first element
      if (Array.isArray(all.profile) && all.profile.length > 0) {
        setProfile(all.profile[0]);
      }

      if (Array.isArray(all.expenses)) {
        setExpenses(all.expenses.map(e => ({
          ...e,
          amount: Number(e.amount),
          _row: e._row
        })));
      }

    } catch (err) {
      console.error("Sheets connection failed", err);
      setSheetsConnected(false);
    }
    setLoading(false);
  };

  // ── COMPUTED ──────────────────────────────────────
  const thisMonthExpenses = useMemo(() => {
    const prefix = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
    return expenses.filter(e => e.date?.startsWith(prefix) && e.type !== "Income");
  }, [expenses]);

  const spentBySubcategory = useMemo(() => {
    const map = {};
    thisMonthExpenses.forEach(e => {
      map[e.subcategory] = (map[e.subcategory] || 0) + e.amount;
    });
    return map;
  }, [thisMonthExpenses]);

  const spentByCategory = useMemo(() => {
    const map = {};
    thisMonthExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [thisMonthExpenses]);

  const totalSpent = useMemo(() => thisMonthExpenses.reduce((s, e) => s + e.amount, 0), [thisMonthExpenses]);

  const totalBudgetSpending = useMemo(() => {
    return Object.entries(targets).reduce((s, [, v]) => {
      if (v.category !== "Savings" && v.category !== "Investment") return s + v.amount;
      return s;
    }, 0);
  }, [targets]);

  const expectedSpendByNow = totalBudgetSpending * monthProgress;
  const burnStatus = totalSpent <= expectedSpendByNow ? "ahead" : "behind";
  const burnDelta = Math.abs(totalSpent - expectedSpendByNow);

  const dailyBurn = useMemo(() => {
    const data = [];
    const dailyBudget = totalBudgetSpending / daysInMonth;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const daySpent = thisMonthExpenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
      const prev = data.length > 0 ? data[data.length - 1] : { actual: 0, budget: 0 };
      data.push({
        day: d,
        actual: d <= dayOfMonth ? prev.actual + daySpent : null,
        budget: prev.budget + dailyBudget,
        projected: null,
      });
    }
    if (dayOfMonth < daysInMonth) {
      const dailyAvg = totalSpent / dayOfMonth;
      for (let d = dayOfMonth; d <= daysInMonth; d++) {
        data[d - 1].projected = totalSpent + dailyAvg * (d - dayOfMonth);
      }
    }
    return data;
  }, [thisMonthExpenses, totalBudgetSpending]);

  const anomalies = useMemo(() => {
    const results = [];
    Object.entries(spentBySubcategory).forEach(([sub, spent]) => {
      const target = targets[sub];
      if (!target) return;
      const expectedByNow = target.amount * monthProgress;
      if (spent > expectedByNow * 1.3 && spent > 500) {
        results.push({ subcategory: sub, spent, expected: expectedByNow, target: target.amount, severity: spent / expectedByNow });
      }
    });
    return results.sort((a, b) => b.severity - a.severity).slice(0, 5);
  }, [spentBySubcategory, targets]);

  // ── FIX 6: savingsTrajectory starts inv from 0 but savings from netWorth.
  // Unified approach: netWorth is the shared starting pool, split proportionally
  // between savings-rate and invest-rate, then compounded separately.
  const savingsTrajectory = useMemo(() => {
    const monthlySavings = Object.entries(targets).filter(([,v]) => v.category === "Savings").reduce((s,[,v]) => s + v.amount, 0);
    const monthlyInvest = Object.entries(targets).filter(([,v]) => v.category === "Investment").reduce((s,[,v]) => s + v.amount, 0);
    const totalMonthly = monthlySavings + monthlyInvest;

    // Split starting netWorth proportionally between the two buckets
    const savingsShare = totalMonthly > 0 ? monthlySavings / totalMonthly : 0.5;
    const data = [];
    let sav = profile.netWorth * savingsShare;
    let inv = profile.netWorth * (1 - savingsShare);

    for (let m = 0; m <= 60; m++) {
      data.push({
        month: m,
        savings: Math.round(sav),
        investments: Math.round(inv),
        total: Math.round(sav + inv),
        label: m % 12 === 0 ? `Y${m/12}` : ""
      });
      sav += monthlySavings * (1 + 0.032 / 12);
      inv += monthlyInvest * (1 + 0.065 / 12);
    }
    return data;
  }, [targets, profile.netWorth]);

  const fireData = useMemo(() => {
    const annualExpenses = totalBudgetSpending * 12;
    const fireNumber = annualExpenses * 25;
    const leanFire = annualExpenses * 0.7 * 25;
    const monthlySavings = Object.entries(targets).filter(([,v]) => v.category === "Savings").reduce((s,[,v]) => s + v.amount, 0);
    const monthlyInvest = Object.entries(targets).filter(([,v]) => v.category === "Investment").reduce((s,[,v]) => s + v.amount, 0);
    const monthlySavInvest = monthlySavings + monthlyInvest;
    const annualSavInvest = monthlySavInvest * 12;
    const currentNetWorth = profile.netWorth;
    const realReturn = 0.05;
    const data = [];
    let nw = currentNetWorth;
    let fireYear = null;
    let leanFireYear = null;
    for (let y = 0; y <= 35; y++) {
      data.push({ year: y, age: profile.age + y, netWorth: Math.round(nw), fire: fireNumber, leanFire: leanFire });
      if (!fireYear && nw >= fireNumber) fireYear = y;
      if (!leanFireYear && nw >= leanFire) leanFireYear = y;
      nw = nw * (1 + realReturn) + annualSavInvest;
    }
    return { data, fireNumber, leanFire, fireYear, leanFireYear, annualExpenses, monthlySavInvest };
  }, [totalBudgetSpending, targets, profile]);

  // ── FIX 5: handleLog resets form after submission ────────────────────────
  // ── FIX 4: resolves actual subcategory from customSub when "__custom" ────
  const handleLog = async () => {
    const resolvedSub = formSub === "__custom" ? customSub.trim() : formSub;
    if (!resolvedSub || !formAmount) return;

    const entry = {
      date: formDate,
      category: formCat,
      subcategory: resolvedSub,
      amount: parseFloat(formAmount),
      type: formType,
    };

    setExpenses(prev => [...prev, entry]);

    // Reset form fields after logging
    setFormAmount("");
    setFormSub("");
    setCustomSub("");

    if (sheetsConnected) {
      await sheetsApi.appendExpense(entry);
      const all = await sheetsApi.fetchAll();
      if (Array.isArray(all.expenses)) {
        setExpenses(all.expenses.map(e => ({ ...e, amount: Number(e.amount), _row: e._row })));
      }
    }
  };

  const subcategoryOptions = useMemo(() => {
    return Object.entries(targets).filter(([, v]) => v.category === formCat).map(([k]) => k);
  }, [formCat, targets]);

  // ── RENDER TABS ───────────────────────────────────

  const renderDashboard = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
      {/* Status strip */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>{monthName} · Day {dayOfMonth}/{daysInMonth}</div>
            <div style={{ fontFamily: head, fontSize: 28, fontWeight: 800, color: C.text, marginTop: 2 }}>{fmt(totalSpent)} <span style={{ fontSize: 14, color: C.dim, fontWeight: 400 }}>/ {fmt(totalBudgetSpending)}</span></div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Num label="Burn Rate" value={burnStatus === "ahead" ? `${fmt(burnDelta)} under` : `${fmt(burnDelta)} over`} color={burnStatus === "ahead" ? C.green : C.rose} small />
            <Num label="Daily Avg" value={fmt(totalSpent / Math.max(dayOfMonth, 1))} color={C.cyan} small />
            <Num label="Projected EOM" value={fmt((totalSpent / Math.max(dayOfMonth, 1)) * daysInMonth)} color={(totalSpent / dayOfMonth) * daysInMonth > totalBudgetSpending ? C.rose : C.green} small />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <ProgressBar value={totalSpent} max={totalBudgetSpending} color={C.cyan} height={6} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontFamily: mono, fontSize: 8, color: C.dim }}>{pct(totalSpent, totalBudgetSpending)}% spent</span>
            <span style={{ fontFamily: mono, fontSize: 8, color: C.dim }}>{pct(monthProgress * 100, 100)}% through month</span>
          </div>
        </div>
      </Card>

      {/* Burn rate chart */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <Lbl icon="🔥">Burn Rate — Budget vs Actual</Lbl>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <AreaChart data={dailyBurn} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="burnActual" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.2} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="budget" name="Budget" stroke={C.dim} fill="none" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke={C.cyan} fill="url(#burnActual)" strokeWidth={2} connectNulls={false} />
              <Area type="monotone" dataKey="projected" name="Projected" stroke={C.amber} fill="none" strokeDasharray="6 3" strokeWidth={1.5} connectNulls={false} />
              <ReferenceLine x={dayOfMonth} stroke={C.text + "30"} strokeDasharray="2 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Category spending cards */}
      {Object.entries(CAT_COLORS).filter(([cat]) => cat !== "Savings" && cat !== "Investment").map(([cat, color]) => {
        const catTarget = Object.entries(targets).filter(([, v]) => v.category === cat).reduce((s, [, v]) => s + v.amount, 0);
        const catSpent = spentByCategory[cat] || 0;
        const items = Object.entries(targets).filter(([, v]) => v.category === cat);
        return (
          <Card key={cat}>
            <Lbl icon={cat === "Needs" ? "⚡" : cat === "Lifestyle" ? "🛒" : cat === "Family" ? "👨‍👩‍👦" : cat === "Fixed" ? "📌" : "🎮"} right={`${fmt(catSpent)} / ${fmt(catTarget)}`}>{cat}</Lbl>
            <ProgressBar value={catSpent} max={catTarget} color={color} height={5} />
            <div style={{ marginTop: 10 }}>
              {items.map(([sub, t]) => {
                const s = spentBySubcategory[sub] || 0;
                const over = s > t.amount;
                return (
                  <div key={sub} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ fontFamily: body, fontSize: 11, color: over ? C.rose : C.text }}>{sub}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: mono, fontSize: 10, color: over ? C.rose : C.muted }}>
                        {fmt(s)}
                      </span>
                      <span style={{ fontFamily: mono, fontSize: 8, color: C.dim }}>/</span>
                      <Editable
                        id={`target:${sub}`}
                        value={t.amount}
                        color={CAT_COLORS[cat]}
                        fontSize={10}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <Card style={{ gridColumn: "1 / -1", borderColor: C.rose + "40" }}>
          <Lbl icon="⚠️">Spending Anomalies</Lbl>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{ padding: "8px 12px", background: C.roseDim, borderRadius: 8, border: `1px solid ${C.rose}20` }}>
                <div style={{ fontFamily: body, fontSize: 12, color: C.rose, fontWeight: 600 }}>{a.subcategory}</div>
                <div style={{ fontFamily: mono, fontSize: 9, color: C.muted, marginTop: 2 }}>
                  {fmt(a.spent)} spent vs {fmt(a.expected)} expected · {pct(a.spent, a.target)}% of monthly target
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );

  const renderLog = () => {
    const recentExpenses = [...thisMonthExpenses].reverse().slice(0, 20);
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <Card>
          <Lbl icon="➕">Log Expense</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Date</label>
              <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, marginTop: 3, outline: "none" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Category</label>
                <select value={formCat} onChange={e => { setFormCat(e.target.value); setFormSub(""); setCustomSub(""); }} style={{ width: "100%", padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, marginTop: 3, outline: "none" }}>
                  {Object.keys(CAT_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} style={{ width: "100%", padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, marginTop: 3, outline: "none" }}>
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Subcategory</label>
              <select value={formSub} onChange={e => { setFormSub(e.target.value); setCustomSub(""); }} style={{ width: "100%", padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, marginTop: 3, outline: "none" }}>
                <option value="">Select...</option>
                {subcategoryOptions.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="__custom">+ Custom</option>
              </select>
              {/* FIX 4: custom input uses its own state so it never disappears on first keystroke */}
              {formSub === "__custom" && (
                <input
                  placeholder="Custom subcategory"
                  value={customSub}
                  onChange={e => setCustomSub(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, marginTop: 6, outline: "none" }}
                />
              )}
            </div>
            <div>
              <label style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Amount (₱)</label>
              <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0" style={{ width: "100%", padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: head, fontSize: 18, fontWeight: 700, marginTop: 3, outline: "none" }} />
            </div>
            <button onClick={handleLog} style={{ padding: "10px", background: `linear-gradient(135deg, ${C.cyan}, ${C.teal})`, border: "none", borderRadius: 8, color: "#000", fontFamily: head, fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4, letterSpacing: "0.02em" }}>
              Log Expense
            </button>
            {!sheetsConnected && (
              <button onClick={connectSheets} style={{ padding: "8px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontFamily: mono, fontSize: 9, cursor: "pointer" }}>
                {loading ? "Connecting..." : "Connect Google Sheets"}
              </button>
            )}
            {sheetsConnected && <div style={{ fontFamily: mono, fontSize: 8, color: C.green, textAlign: "center" }}>✓ Synced with Google Sheets</div>}
          </div>
        </Card>

        <Card>
          <Lbl icon="📜">Recent Transactions</Lbl>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {recentExpenses.length === 0 ? (
              <div style={{ fontFamily: body, fontSize: 12, color: C.dim, textAlign: "center", padding: 20 }}>No expenses logged this month</div>
            ) : recentExpenses.map((e, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < recentExpenses.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div>
                  <div style={{ fontFamily: body, fontSize: 12, color: C.text }}>{e.subcategory}</div>
                  <div style={{ fontFamily: mono, fontSize: 8, color: C.dim }}>{e.date} · {e.category}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: mono, fontSize: 12, color: CAT_COLORS[e.category] || C.muted, fontWeight: 600 }}>{fmt(e.amount)}</span>
                  <button
                    onClick={async () => {
                      await sheetsApi.deleteRow({ sheet: "Expenses", row: e._row });
                      setExpenses(prev => prev.filter(p => p._row !== e._row));
                    }}
                    style={{ padding: "6px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, color: C.dim, cursor: "pointer", fontFamily: mono, fontSize: 10 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderBudget = () => {
    const categories = [...new Set(Object.values(targets).map(t => t.category))];
    const totalAllocated = Object.values(targets).reduce((s, v) => s + v.amount, 0);
    const delta = INCOME - totalAllocated;

    const addNewSubcategory = async () => {
      if (!newName || !newAmount) return;
      const amt = parseFloat(newAmount);
      setTargets(prev => ({ ...prev, [newName]: { amount: amt, category: newCategory } }));
      if (sheetsConnected) {
        await sheetsApi.appendTarget({ name: newName, amount: amt, category: newCategory });
      }
      setNewName(""); setNewAmount("");
    };

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        {/* Income card */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <Lbl icon="💰">Monthly Income (click values to edit)</Lbl>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", marginBottom: 3 }}>Wife (Net)</div>
              <Editable id="income:wife" value={income.wife} color={C.cyan} fontSize={20} fontWeight={700} />
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", marginBottom: 3 }}>Husband (Net)</div>
              <Editable id="income:husband" value={income.husband} color={C.green} fontSize={20} fontWeight={700} />
            </div>
            <div>
              <div style={{ fontFamily: mono, fontSize: 8, color: C.dim, textTransform: "uppercase", marginBottom: 3 }}>Combined</div>
              <div style={{ fontFamily: head, fontSize: 20, fontWeight: 700, color: C.text }}>{fmt(INCOME)}</div>
            </div>
          </div>
        </Card>

        {/* Allocation bar */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <Lbl icon="📊">Budget Allocation</Lbl>
          <div style={{ display: "flex", gap: 2, height: 32, borderRadius: 8, overflow: "hidden" }}>
            {categories.map(cat => {
              const catTotal = Object.entries(targets).filter(([, v]) => v.category === cat).reduce((s, [, v]) => s + v.amount, 0);
              const p = pct(catTotal, INCOME);
              return catTotal > 0 ? (
                <div key={cat} style={{ flex: parseFloat(p), background: (CAT_COLORS[cat] || C.dim) + "25", borderBottom: `3px solid ${CAT_COLORS[cat] || C.dim}`, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 30 }}>
                  <span style={{ fontFamily: mono, fontSize: 7, color: CAT_COLORS[cat] || C.dim, fontWeight: 600 }}>{cat}</span>
                </div>
              ) : null;
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontFamily: mono, fontSize: 8, color: C.dim }}>Allocated: {fmt(totalAllocated)} / {fmt(INCOME)}</span>
            <span style={{ fontFamily: mono, fontSize: 8, color: delta === 0 ? C.green : delta > 0 ? C.amber : C.rose, fontWeight: 600 }}>
              {delta === 0 ? "✓ BALANCED" : delta > 0 ? `₱${Math.abs(delta).toLocaleString()} unallocated` : `₱${Math.abs(delta).toLocaleString()} OVER BUDGET`}
            </span>
          </div>
        </Card>

        {/* Profile card */}
        <Card>
          <Lbl icon="👤">Profile (click to edit)</Lbl>
          {[
            { label: "Age", id: "profile:age", val: profile.age, raw: true, suffix: " yrs" },
            { label: "Current Net Worth", id: "profile:netWorth", val: profile.netWorth },
            { label: "Emergency Fund", id: "profile:efFund", val: profile.efFund },
            { label: "Japan Fund", id: "profile:japanFund", val: profile.japanFund },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: body, fontSize: 12, color: C.muted }}>{row.label}</span>
              {row.raw ? (
                <EditableRaw id={row.id} value={row.val} color={C.text} suffix={row.suffix} />
              ) : (
                <Editable id={row.id} value={row.val} color={C.cyan} />
              )}
            </div>
          ))}
        </Card>

        {/* Add new subcategory */}
        <Card>
          <Lbl icon="➕">Add Category / Subcategory</Lbl>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input placeholder="Name (e.g. Snacks)" value={newName} onChange={e => setNewName(e.target.value)} style={{ padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, outline: "none" }} />
            <input placeholder="Amount" type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} style={{ padding: "8px 10px", width: 120, background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, outline: "none" }} />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: "8px 10px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontFamily: body, fontSize: 13, outline: "none" }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addNewSubcategory} style={{ padding: "8px 12px", background: `linear-gradient(135deg, ${C.green}, ${C.teal})`, border: "none", borderRadius: 6, color: "#000", fontFamily: mono, fontSize: 12, cursor: "pointer" }}>
              Add
            </button>
          </div>
        </Card>

        {/* Category cards with editable targets */}
        {categories.map(cat => {
          const items = Object.entries(targets).filter(([, v]) => v.category === cat);
          const catTotal = items.reduce((s, [, v]) => s + v.amount, 0);
          return (
            <Card key={cat}>
              <Lbl icon={cat === "Savings" ? "🏦" : cat === "Investment" ? "📈" : "💳"} right={fmt(catTotal)}>{cat}</Lbl>
              {items.map(([key, val]) => (
                <div
                  key={key}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}
                >
                  <span style={{ fontFamily: body, fontSize: 12, color: C.text }}>{key}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Editable id={`target:${key}`} value={val.amount} color={CAT_COLORS[cat] || C.muted} />
                    <button
                      onClick={async () => {
                        await sheetsApi.deleteRow({ sheet: "BudgetTargets", row: val._row });
                        setTargets(prev => {
                          const copy = { ...prev };
                          delete copy[key];
                          return copy;
                        });
                      }}
                      style={{ padding: "4px 8px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 4, color: C.dim, cursor: "pointer", fontFamily: mono, fontSize: 10 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
      {/* Spending by category pie */}
      <Card>
        <Lbl icon="🍩">Spending by Category</Lbl>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={Object.entries(spentByCategory).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }))} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                {Object.entries(spentByCategory).filter(([, v]) => v > 0).map(([k], i) => <Cell key={i} fill={CAT_COLORS[k] || C.dim} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {Object.entries(spentByCategory).filter(([, v]) => v > 0).map(([k]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Dot color={CAT_COLORS[k]} /><span style={{ fontFamily: mono, fontSize: 8, color: C.muted }}>{k}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Daily spending bar */}
      <Card>
        <Lbl icon="📊">Daily Spending</Lbl>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={Array.from({ length: dayOfMonth }, (_, d) => {
              const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(d+1).padStart(2,"0")}`;
              const daySpent = thisMonthExpenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
              return { day: d + 1, amount: daySpent };
            })} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="day" tick={{ fill: C.dim, fontSize: 7, fontFamily: mono }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} tickFormatter={fmtK} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Bar dataKey="amount" name="Spent" radius={[3, 3, 0, 0]} fill={C.cyan}>
                {Array.from({ length: dayOfMonth }, (_, i) => {
                  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;
                  const daySpent = thisMonthExpenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
                  const dailyBudget = totalBudgetSpending / daysInMonth;
                  return <Cell key={i} fill={daySpent > dailyBudget * 1.5 ? C.rose : C.cyan} />;
                })}
              </Bar>
              <ReferenceLine y={totalBudgetSpending / daysInMonth} stroke={C.amber} strokeDasharray="4 4" label={{ value: "Avg", fill: C.amber, fontSize: 8, fontFamily: mono }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 5-Year savings trajectory */}
      <Card style={{ gridColumn: "1 / -1" }}>
        <Lbl icon="📈">5-Year Savings & Investment Trajectory</Lbl>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={savingsTrajectory.filter((_, i) => i % 3 === 0 || i === savingsTrajectory.length - 1)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.2} /><stop offset="100%" stopColor={C.green} stopOpacity={0} /></linearGradient>
                <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.indigo} stopOpacity={0.2} /><stop offset="100%" stopColor={C.indigo} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="month" tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} tickFormatter={v => v % 12 === 0 ? `Y${v/12}` : ""} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} tickFormatter={v => `₱${(v/1000000).toFixed(1)}M`} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="savings" name="Savings" stroke={C.green} fill="url(#gSav)" strokeWidth={2} />
              <Area type="monotone" dataKey="investments" name="Investments" stroke={C.indigo} fill="url(#gInv)" strokeWidth={2} />
              <Legend wrapperStyle={{ fontFamily: mono, fontSize: 8, color: C.dim }} iconType="circle" iconSize={6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, flexWrap: "wrap", gap: 8 }}>
          <Num label="5-Year Savings" value={fmt(savingsTrajectory[60]?.savings || 0)} color={C.green} small />
          <Num label="5-Year Investments" value={fmt(savingsTrajectory[60]?.investments || 0)} color={C.indigo} small />
          <Num label="5-Year Total" value={fmt(savingsTrajectory[60]?.total || 0)} color={C.text} small />
        </div>
      </Card>
    </div>
  );

  const renderFire = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
      <Card style={{ gridColumn: "1 / -1" }}>
        <Lbl icon="🔥">FIRE Projection</Lbl>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
          <Num label="Annual Expenses" value={fmt(fireData.annualExpenses)} color={C.cyan} />
          <Num label="FIRE Number (25×)" value={fmt(fireData.fireNumber)} color={C.amber} />
          <Num label="Lean FIRE (17.5×)" value={fmt(fireData.leanFire)} color={C.teal} />
          <Num label="Lean FIRE Age" value={fireData.leanFireYear ? `${profile.age + fireData.leanFireYear}` : "—"} color={C.green} />
          <Num label="Full FIRE Age" value={fireData.fireYear ? `${profile.age + fireData.fireYear}` : "—"} color={C.amber} />
        </div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={fireData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gNw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.2} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="age" tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} axisLine={false} tickLine={false} label={{ value: "Age", position: "insideBottomRight", fill: C.dim, fontSize: 8, fontFamily: mono }} />
              <YAxis tick={{ fill: C.dim, fontSize: 8, fontFamily: mono }} tickFormatter={v => `₱${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
              <Tooltip content={<TT />} />
              <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke={C.cyan} fill="url(#gNw)" strokeWidth={2.5} />
              <Line type="monotone" dataKey="fire" name="FIRE Target" stroke={C.amber} strokeDasharray="6 3" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="leanFire" name="Lean FIRE" stroke={C.teal} strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              <Legend wrapperStyle={{ fontFamily: mono, fontSize: 8, color: C.dim }} iconType="line" iconSize={10} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <Lbl icon="📐">FIRE Assumptions (edit in Budget tab)</Lbl>
        {[
          { l: "Current Age", v: `${profile.age}` },
          { l: "Monthly Savings + Invest", v: fmt(fireData.monthlySavInvest) },
          { l: "Current Net Worth", v: fmt(profile.netWorth) },
          { l: "Real Return (after inflation)", v: "5.0% p.a." },
          { l: "Safe Withdrawal Rate", v: "4% (standard FIRE)" },
          { l: "Lean FIRE multiplier", v: "17.5× (70% expenses)" },
          { l: "Monthly Spending", v: fmt(totalBudgetSpending) },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: body, fontSize: 11, color: C.muted }}>{r.l}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: C.text, fontWeight: 600 }}>{r.v}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: "10px 12px", background: C.greenDim, borderRadius: 8 }}>
          <div style={{ fontFamily: mono, fontSize: 8, color: C.green, fontWeight: 600, letterSpacing: "0.1em" }}>KEY INSIGHT</div>
          <div style={{ fontFamily: body, fontSize: 11, color: C.muted, marginTop: 4 }}>
            {fireData.leanFireYear ? `At current rates, you could reach Lean FIRE by age ${profile.age + fireData.leanFireYear}. ` : ""}
            {fireData.fireYear ? `Full FIRE by age ${profile.age + fireData.fireYear}. ` : ""}
            Every ₱1,000/mo increase in savings shaves ~1–2 years off your FIRE date.
          </div>
        </div>
      </Card>

      <Card>
        <Lbl icon="🎯">Milestones</Lbl>
        {[
          { label: "₱2M Net Worth", target: 2000000 },
          { label: "₱5M Net Worth", target: 5000000 },
          { label: "₱10M Net Worth", target: 10000000 },
          { label: "Lean FIRE", target: fireData.leanFire },
          { label: "Full FIRE", target: fireData.fireNumber },
        ].map((m, i) => {
          const yearHit = fireData.data.find(d => d.netWorth >= m.target);
          return (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <div>
                <div style={{ fontFamily: body, fontSize: 12, color: C.text }}>{m.label}</div>
                <div style={{ fontFamily: mono, fontSize: 9, color: C.dim }}>{fmt(m.target)}</div>
              </div>
              <div style={{ padding: "3px 10px", background: yearHit ? C.greenDim : C.amberDim, borderRadius: 6, border: `1px solid ${yearHit ? C.green : C.amber}20` }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: yearHit ? C.green : C.amber, fontWeight: 600 }}>
                  {yearHit ? `Age ${yearHit.age}` : "35+ yrs"}
                </span>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: body }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <h1 style={{ fontFamily: head, fontSize: 22, fontWeight: 800, margin: 0, color: C.text }}>
              <span style={{ color: C.cyan }}>₱</span> YOUHEI AND KAORI FUNDS DASHBOARD
            </h1>
            <span style={{ fontFamily: mono, fontSize: 8, color: C.dim, background: C.cyanDim, padding: "2px 6px", borderRadius: 4 }}>v7 LIVE</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.dim, marginTop: 2 }}> BBhubby and BBwaif Finances · {monthName.toUpperCase()} · BASE PAY ONLY</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 14, background: C.card, borderRadius: 8, padding: 2, border: `1px solid ${C.border}`, width: "fit-content" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: mono, fontSize: 9, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
              background: tab === t ? C.cyan + "15" : "transparent",
              color: tab === t ? C.cyan : C.dim, transition: "all 0.15s",
            }}>{t}</button>
          ))}
        </div>

        {tab === "Dashboard" && renderDashboard()}
        {tab === "Log" && renderLog()}
        {tab === "Budget" && renderBudget()}
        {tab === "Analytics" && renderAnalytics()}
        {tab === "FIRE" && renderFire()}
      </div>
    </div>
  );
}