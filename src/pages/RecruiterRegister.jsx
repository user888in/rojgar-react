import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api"
import rojgar_shine_logo from "../assets/images/Rojgarshine White Logo-01.png"

import {
  User, AtSign, Mail, Phone, Lock, Eye, EyeOff,
  Building2, Search, HelpCircle, MessageSquare,
  Shield, X, Image, BuildingIcon, UserPlus,
  Home, MailCheck, Hourglass, ChevronDown,
} from "lucide-react";

//  CONSTANTS

const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const COMPANY_NAME_PATTERN = /^[a-zA-Z0-9 .,&'\-]+$/;

const STRENGTH_LEVELS = [
  { pct: "25%",  color: "#ef4444", label: "Weak"   },
  { pct: "50%",  color: "#f97316", label: "Fair"   },
  { pct: "75%",  color: "#eab308", label: "Good"   },
  { pct: "100%", color: "#22c55e", label: "Strong" },
];

const BACKEND_FIELD_MAP = {
  email:    "email",
  username: "username",
  phone:    "phone",
  mobile:   "phone",
};

function getStrength(val) {
  if (!val) return null;
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return STRENGTH_LEVELS[score - 1] || STRENGTH_LEVELS[0];
}

function getInitials(name) {
  return (name || "?").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
}

//  TOAST
function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-[11000] flex flex-col gap-2.5 pointer-events-none max-w-[360px] w-[calc(100%-32px)] sm:w-auto">
      {toasts.map(t => (
        <div key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 bg-[#1e293b] text-[#f1f5f9] rounded-xl px-4 py-3.5 text-[13px] leading-relaxed shadow-2xl border-l-4 animate-[toastIn_.35s_cubic-bezier(.34,1.56,.64,1)_both] ${
            t.type === "success" ? "border-green-500" : t.type === "warning" ? "border-amber-500" : "border-red-500"
          }`}
        >
          <span className={`flex-shrink-0 mt-0.5 ${t.type === "success" ? "text-green-500" : t.type === "warning" ? "text-amber-500" : "text-red-500"}`}>
            {t.type === "success"
              ? <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              : t.type === "warning"
              ? <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              : <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            }
          </span>
          <span className="flex-1" dangerouslySetInnerHTML={{ __html: t.text }} />
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors ml-1 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  );
}

//  SUCCESS PANEL
function SuccessPanel({ email, onResend }) {
  const [resending,  setResending]  = useState(false);
  const [resendText, setResendText] = useState("Resend");

  const handleResend = async () => {
    setResending(true);
    setResendText("Sending…");
    await onResend();
    setResendText("Sent! (wait 30s)");
    setTimeout(() => { setResending(false); setResendText("Resend"); }, 30000);
  };

  return (
    <div className="text-center py-8">
      {/* Icon */}
      <div className="w-[72px] h-[72px] bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-5">
        <MailCheck size={32} className="text-[#16a34a]" />
      </div>

      <h4 className="text-[#091d33] text-[22px] font-bold tracking-tight mb-2">Check your inbox</h4>
      <p className="text-[#64748b] text-[14px] max-w-[380px] mx-auto mb-6 leading-relaxed">
        We've sent a verification link to <strong className="text-[#091d33]">{email}</strong>.
        Click the link to verify your email address.
      </p>

      {/* Awaiting admin approval box */}
      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4 max-w-[420px] mx-auto mb-7 text-left">
        <div className="flex gap-2.5 items-start">
          <Hourglass size={18} className="text-[#d97706] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-[#92400e] mb-1">Awaiting admin approval</div>
            <div className="text-[13px] text-[#a16207] leading-[1.55]">
              After email verification, your company account and recruiter ID will be reviewed
              by our admin team. You'll receive a confirmation email once approved —
              this usually takes <strong>1–2 business days</strong>.
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 h-11 px-6 bg-[#091d33] text-white rounded-[10px] text-[14px] font-semibold hover:bg-[#d97706] transition-colors no-underline"
        >
          <Home size={15} /> Back to Home
        </Link>
        <span className="text-[12px] text-[#94a3b8]">
          Didn't receive the email?{" "}
          <button
            onClick={handleResend}
            disabled={resending}
            className="bg-transparent border-none text-[#d97706] text-[12px] font-semibold cursor-pointer p-0 underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendText}
          </button>
        </span>
      </div>
    </div>
  );
}

//  SECURITY QUESTION PAIR — 
function SecurityPair({ num, questions, selectedIds, value, answer, onQuestionChange, onAnswerChange, errors = {} }) {
  return (
    <div className="col-span-2 bg-[#f8fafc] border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-[14px] px-5 pb-[18px] pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative mt-2">
      {/* Amber badge — top-left floating */}
      <span className="absolute -top-3 left-4 bg-[#f59e0b] text-white text-[10px] font-bold uppercase tracking-[1px] px-3.5 py-[3px] rounded-full whitespace-nowrap">
        Question {num}
      </span>

      {/* Question select */}
      <div className="flex flex-col gap-[7px]">
        <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">Security Question</label>
        <div className="relative">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"><HelpCircle size={14} /></span>
          <select
            value={value}
            onChange={onQuestionChange}
            required
            disabled={questions.length === 0}
            className={`w-full h-[46px] border-[1.5px] rounded-[11px] pl-10 pr-9 text-[14px] text-[#091d33] bg-[#f1f5f9] outline-none appearance-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${errors.question ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"}`}
          >
            <option value="" disabled>{questions.length === 0 ? "Loading questions…" : "— Select a security question —"}</option>
            {questions.map(q => {
              const id   = String(q.questionId ?? q.id ?? "");
              const text = q.questionText || q.question || q.text || "";
              return <option key={id} value={id} disabled={selectedIds.includes(id) && id !== value}>{text}</option>;
            })}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#94a3b8]"><ChevronDown size={12} /></span>
        </div>
        {errors.question && <span className="text-[11px] text-red-500 mt-1">{errors.question}</span>}
      </div>

      {/* Answer input */}
      <div className="flex flex-col gap-[7px]">
        <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">Your Answer</label>
        <div className="relative">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"><MessageSquare size={14} /></span>
          <input
            type="text" value={answer} onChange={onAnswerChange}
            placeholder="Answer (case-insensitive)" required autoComplete="off"
            className={`w-full h-[46px] border-[1.5px] rounded-[11px] pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all ${errors.answer ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"}`}
          />
        </div>
        {errors.answer && <span className="text-[11px] text-red-500 mt-1">{errors.answer}</span>}
      </div>
    </div>
  );
}

//  SECTION LABEL — matches .form-section-label CSS exactly
function SectionLabel({ children }) {
  return (
    <div className="col-span-2 flex items-center gap-2.5 mt-5 mb-3.5">
      <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#94a3b8] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-[rgba(9,29,51,0.12)]" />
    </div>
  );
}

//  FIELD — shared wrapper
function Field({ label, icon, error, children, full = false }) {
  return (
    <div className={`flex flex-col gap-[7px] ${full ? "col-span-2" : ""}`}>
      <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">{icon}</span>}
        {children}
      </div>
      {error && <span className="text-[11px] text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}

//  INPUT CLASS helper
const inputCls = (hasErr, extra = "") =>
  `w-full h-[48px] border-[1.5px] rounded-xl pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all ${hasErr ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"} ${extra}`;

//  MAIN COMPONENT
const RecruiterRegister = () => {
  const navigate = useNavigate();

  // ── Form state 
  const [form, setForm] = useState({
    recruiterName: "", username: "", email: "", phone: "",
    companyName: "", companyDescription: "",
    companyType: "", companySize: "", foundedYear: "",
    industry: "", headquarters: "", websiteUrl: "",
  });
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd,         setShowPwd]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [strength,        setStrength]        = useState(null);
  const [companyMode,     setCompanyMode]     = useState("new"); // "new" | "existing"
  const [logoFile,        setLogoFile]        = useState(null);
  const [logoPreview,     setLogoPreview]     = useState(null);
  const [dragOver,        setDragOver]        = useState(false);

  // Enums
  const [companyTypes, setCompanyTypes] = useState([]);
  const [companySizes, setCompanySizes] = useState([]);
  const [enumsLoading, setEnumsLoading] = useState(true);

  // Existing company search
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchResults,    setSearchResults]    = useState([]);
  const [searchLoading,    setSearchLoading]    = useState(false);
  const [dropdownOpen,     setDropdownOpen]     = useState(false);
  const [selectedCompany,  setSelectedCompany]  = useState(null); // { id, name, logoUrl }
  const searchTimeout = useRef(null);
  const searchWrapRef = useRef(null);

  // Security questions
  const [questions,  setQuestions]  = useState([]);
  const [secPairs,   setSecPairs]   = useState([
    { questionId: "", answer: "" },
    { questionId: "", answer: "" },
    { questionId: "", answer: "" },
  ]);

  // UI state
  const [fieldErrors, setFieldErrors] = useState({});
  const [secErrors,   setSecErrors]   = useState([{}, {}, {}]);
  const [toasts,      setToasts]      = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [regEmail,    setRegEmail]    = useState("");
  const toastCounter = useRef(0);

  // ── Toasts ─────────────────────────────────────────────
  const showToast = useCallback((text, type = "danger") => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Load enums & security questions ─────────────────────
  useEffect(() => {
    // Security Questions
    fetch(`${API_BASE_URL}/auth/security-questions`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setQuestions(Array.isArray(data) ? data : (data.content || [])))
      .catch(() => showToast("Could not load security questions.", "danger"));

    // Company Enums
    const loadEnums = async () => {
      try {
        const [typeRes, sizeRes] = await Promise.all([
          fetch(`${API_BASE_URL}/companies/company-type`),
          fetch(`${API_BASE_URL}/companies/enums/company-size`),
        ]);
        if (typeRes.ok) {
          const data = await typeRes.json();
          setCompanyTypes(data.map(obj => ({ value: obj.value, label: obj.label || obj.value })));
        }
        if (sizeRes.ok) {
          const data = await sizeRes.json();
          setCompanySizes(data.map(obj => ({ value: obj.value, label: obj.label || obj.value })));
        }
      } catch (err) {
        console.error("Enum load error", err);
      } finally {
        setEnumsLoading(false);
      }
    };
    loadEnums();
  }, [showToast]);

  // ── Close search dropdown on outside click ──────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const clearErr = (key) => setFieldErrors(prev => ({ ...prev, [key]: "" }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    clearErr(name);
  };

  const handleFullName = (e) => {
    const v = e.target.value.replace(/\b\w/g, c => c.toUpperCase());
    setForm(prev => ({ ...prev, recruiterName: v }));
    clearErr("recruiterName");
  };

  const handlePhone = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm(prev => ({ ...prev, phone: v }));
    if (v && v.length !== 10) {
      setFieldErrors(prev => ({ ...prev, phone: "Phone number must be exactly 10 digits." }));
    } else { clearErr("phone"); }
  };

  const handleUsername = (e) => {
    const v = e.target.value;
    setForm(prev => ({ ...prev, username: v }));
    if (v && !USERNAME_PATTERN.test(v)) {
      setFieldErrors(prev => ({ ...prev, username: "Username can only contain letters, numbers and underscores." }));
    } else { clearErr("username"); }
  };

  const handlePassword = (e) => {
    const v = e.target.value;
    setPassword(v);
    setStrength(getStrength(v));
    if (v && !PASSWORD_PATTERN.test(v)) {
      setFieldErrors(prev => ({ ...prev, password: "8–20 chars, include uppercase, lowercase, number & special character." }));
    } else { clearErr("password"); }
    if (confirmPassword && v !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else { clearErr("confirmPassword"); }
  };

  const handleConfirm = (e) => {
    const v = e.target.value;
    setConfirmPassword(v);
    if (v && v !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else { clearErr("confirmPassword"); }
  };

  // ── Logo ────────────────────────────────────────────────
  const handleLogoFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Logo must be under 2 MB.", "danger"); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => { setLogoFile(null); setLogoPreview(null); };

  // ── Company search (existing mode) ──────────────────────
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSelectedCompany(null);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 2) { setDropdownOpen(false); return; }
    searchTimeout.current = setTimeout(() => searchCompanies(q.trim()), 300);
  };

  const searchCompanies = async (keyword) => {
    setSearchLoading(true);
    setDropdownOpen(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/recruiter/companies/search?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json().catch(() => []);
      setSearchResults(Array.isArray(data) ? data : (data.content || data.data || []));
    } catch {
      setSearchResults([]);
    } finally { setSearchLoading(false); }
  };

  const selectCompany = (c) => {
    setSelectedCompany({ id: c.id, name: c.companyName, logoUrl: c.companyLogo || "" });
    setSearchQuery(c.companyName);
    setDropdownOpen(false);
    clearErr("companySearch");
  };

  const clearSelectedCompany = () => {
    setSelectedCompany(null);
    setSearchQuery("");
  };

  // ── Security pairs ──────────────────────────────────────
  const updateSecPair = (idx, field, val) => {
    setSecPairs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
    setSecErrors(prev => prev.map((e, i) => i === idx ? { ...e, [field === "questionId" ? "question" : "answer"]: "" } : e));
  };
  const selectedQuestionIds = secPairs.map(p => p.questionId).filter(Boolean);

  // ── Backend error mapper ────────────────────────────────
  const applyBackendErrors = (result) => {
    let applied = false;
    const apply = (key, msg) => {
      const fk = BACKEND_FIELD_MAP[key?.toLowerCase()];
      if (fk) { setFieldErrors(prev => ({ ...prev, [fk]: msg })); applied = true; }
    };
    if (result.errors && typeof result.errors === "object" && !Array.isArray(result.errors)) {
      Object.entries(result.errors).forEach(([k, v]) => apply(k, v));
    } else if (Array.isArray(result.errors)) {
      result.errors.forEach(({ field, message }) => apply(field, message));
    } else if (result.field && result.message) {
      apply(result.field, result.message);
    } else if (result.message) {
      const msg = result.message.toLowerCase();
      for (const kw of Object.keys(BACKEND_FIELD_MAP)) {
        if (msg.includes(kw)) { apply(kw, result.message); break; }
      }
    }
    return applied;
  };

  // ── Validation ──────────────────────────────────────────
  const validate = () => {
    const fe = {};
    if (!form.recruiterName.trim()) fe.recruiterName = "Full name is required.";
    if (!form.username.trim())      fe.username = "Username is required.";
    else if (!USERNAME_PATTERN.test(form.username)) fe.username = "Username can only contain letters, numbers and underscores.";
    if (!/\S+@\S+\.\S+/.test(form.email)) fe.email = "Enter a valid email address.";
    if (!/^\d{10}$/.test(form.phone))     fe.phone = "Phone number must be exactly 10 digits.";
    if (!PASSWORD_PATTERN.test(password))  fe.password = "8–20 chars, include uppercase, lowercase, number & special character.";
    if (password !== confirmPassword)      fe.confirmPassword = "Passwords do not match.";

    if (companyMode === "new") {
      if (!form.companyName.trim()) {
        fe.companyName = "Company name is required.";
      } else if (!COMPANY_NAME_PATTERN.test(form.companyName)) {
        fe.companyName = "Company name can only contain letters, numbers, spaces and . , & ' -";
      } else if (form.companyName.length < 2 || form.companyName.length > 500) {
        fe.companyName = "Company name must be 2–500 characters.";
      }
      
      if (!form.companyType)        fe.companyType = "Company type is required.";
      if (!form.companySize)        fe.companySize = "Company size is required.";
      if (!form.foundedYear)        fe.foundedYear = "Founded year is required.";
      else if (parseInt(form.foundedYear) < 1800 || parseInt(form.foundedYear) > 2100) fe.foundedYear = "Enter valid year (1800-2100).";
    }

    if (companyMode === "existing" && !selectedCompany)    fe.companySearch = "Please select your company from search results.";

    const se = secPairs.map(p => {
      const e = {};
      if (!p.questionId)    e.question = "Please select a security question.";
      if (!p.answer.trim()) e.answer   = "Please provide an answer.";
      return e;
    });

    const ids = secPairs.map(p => p.questionId).filter(Boolean);
    const dupQ = new Set(ids).size < ids.length;

    return { fe, se, dupQ, hasErrors: Object.keys(fe).length > 0 || se.some(e => Object.keys(e).length > 0) || dupQ };
  };

  // ── Submit ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { fe, se, dupQ, hasErrors } = validate();
    if (hasErrors) {
      setFieldErrors(fe);
      setSecErrors(se);
      if (dupQ) showToast("Please select 3 different security questions.", "danger");
      return;
    }

    setLoading(true);
    const email = form.email.trim();

    const securityQuestions = secPairs.map(p => ({
      securityQuestionId: parseInt(p.questionId, 10),
      securityAnswer:     p.answer.trim(),
    }));

    try {
      const recruiterData = {
        fullname:    form.recruiterName.trim(),
        username:    form.username.trim(),
        email,
        phone:       Number(form.phone.trim()),
        password,
        company:     companyMode === "existing" 
          ? { existingCompanyId: Number(selectedCompany.id) }
          : { 
              newCompany: {
                companyName:  form.companyName.trim(),
                companyType:  form.companyType,
                companySize:  form.companySize,
                foundedYear:  parseInt(form.foundedYear, 10),
                description:  form.companyDescription.trim() || undefined,
                industry:     form.industry.trim() || undefined,
                headquarters: form.headquarters.trim() || undefined,
                websiteUrl:   form.websiteUrl.trim() || undefined,
              }
            },
        securityQuestions,
      };

      let response;
      if (companyMode === "existing") {
        response = await fetch(`${API_BASE_URL}/auth/recruiter`, {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          body:        JSON.stringify(recruiterData),
        });
      } else {
        const fd = new FormData();
        fd.append("data", new Blob([JSON.stringify(recruiterData)], { type: "application/json" }));
        if (logoFile) fd.append("logo", logoFile, logoFile.name);

        response = await fetch(`${API_BASE_URL}/auth/recruiter`, {
          method:      "POST",
          credentials: "include",
          body:        fd,
        });
      }

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        setRegEmail(email);
        setSubmitted(true);
      } else {
        const fieldApplied = applyBackendErrors(result);
        showToast(
          result.message || (fieldApplied ? "Please fix the highlighted fields." : "Registration failed. Please try again."),
          fieldApplied ? "warning" : "danger"
        );
      }
    } catch {
      showToast("Network error. Please try again.", "danger");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification ─────────────────────────────────
  const handleResend = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ email: regEmail }),
      });
      if (res.ok) { showToast("Verification email resent!", "success"); }
      else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Could not resend. Please try again.", "warning");
      }
    } catch { showToast("Network error. Please try again.", "danger"); }
  };

  
  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="flex min-h-screen">

        {/* LEFT PANEL  */}
        <div className="hidden lg:flex w-[42%] xl:w-[40%] bg-[#091d33] flex-col justify-start px-12 py-12 relative overflow-hidden sticky top-0 h-screen">

          <div className="absolute w-[380px] h-[380px] rounded-full border border-[#f59e0b]/[0.12] -top-20 -right-24 pointer-events-none" />
          <div className="absolute w-[220px] h-[220px] rounded-full bg-[#f59e0b]/[0.05] -bottom-10 -left-14 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-8">
              <Link to="/" className="flex-shrink-0">
                <img src={rojgar_shine_logo} alt="RojgarShine" className="h-[70px] w-auto object-contain" />
              </Link>
              <div className="inline-flex mt-6 items-center gap-1.5 bg-[#f59e0b]/[0.12] border border-[#f59e0b]/25 rounded-full px-3.5 py-1.5">
                <Building2 size={14} className="text-[#f59e0b] flex-shrink-0" />
                <span className="text-[11px] font-bold text-[#f59e0b] uppercase tracking-[0.8px] whitespace-nowrap">Recruiter Portal</span>
              </div>
            </div>

            <h1 className="text-white leading-[1.18] tracking-tight mb-5 ps-12 text-3xl font-bold" >
              Start hiring<br />
              <em className="not-italic text-[#f59e0b]">top talent</em><br />
              today.
            </h1>

            <p className="text-white/45 text-[14px] leading-[1.75] max-w-[320px] mb-8 ps-12">
              Register your company and get instant access to thousands of verified candidates across India.
            </p>

            <div className="flex flex-col gap-6 ps-12">
              {[
                { n: "1", title: "Create your recruiter account", desc: "Fill in your company and personal details" },
                { n: "2", title: "Post job openings",             desc: "Publish unlimited listings in minutes"      },
                { n: "3", title: "Review & hire candidates",      desc: "Manage applicants from your dashboard"      },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-[32px] h-[32px] rounded-full bg-[#f59e0b]/[0.12] border border-[#f59e0b]/28 flex items-center justify-center text-[#f59e0b] text-[13px] font-bold mt-0.5">{n}</div>
                  <div>
                    <div className="text-white/90 text-[14px] font-semibold mb-0.5">{title}</div>
                    <div className="text-white/40 text-[12px] leading-[1.5]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL  */}
        <div className="flex-1 bg-[#ffffff] overflow-y-auto">
          <div className="max-w-[750px] mx-auto px-6 py-12" style={{ animation: "fadeUp .5s ease both" }}>

            {submitted ? (
              <SuccessPanel email={regEmail} onResend={handleResend} />
            ) : (
              <>
                <div className="text-[11px] font-bold tracking-[2px] uppercase text-[#f59e0b] mb-2.5">
                  Company Registration
                </div>
                <h2 className="text-[28px] font-bold text-[#091d33] tracking-[-0.5px] mb-1.5">
                  Create your recruiter account
                </h2>
                <p className="text-[14px] text-[#64748b] mb-8">
                  Fill in the details below to get started hiring on RojgarShine.
                </p>

                <form onSubmit={handleSubmit} autoComplete="off" noValidate encType="multipart/form-data">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">

                    <SectionLabel>Personal info</SectionLabel>

                    <Field label="Full Name" icon={<User size={14} />} error={fieldErrors.recruiterName}>
                      <input type="text" name="recruiterName" value={form.recruiterName} onChange={handleFullName}
                        placeholder="Recruiter Full Name" required className={inputCls(fieldErrors.recruiterName)} />
                    </Field>

                    <Field label="Username" icon={<AtSign size={14} />} error={fieldErrors.username}>
                      <input type="text" name="username" value={form.username} onChange={handleUsername}
                        placeholder="Username" required className={inputCls(fieldErrors.username)} />
                    </Field>

                    <Field label="Official Work Email" icon={<Mail size={14} />} error={fieldErrors.email}>
                      <input type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="hr@company.com" required className={inputCls(fieldErrors.email)} />
                    </Field>

                    <Field label="Phone Number" icon={<Phone size={14} />} error={fieldErrors.phone}>
                      <input type="tel" name="phone" value={form.phone} onChange={handlePhone}
                        placeholder="Mobile Number" required inputMode="numeric" maxLength={10}
                        className={inputCls(fieldErrors.phone)} />
                    </Field>

                    <SectionLabel>Company info</SectionLabel>

                    <div className="col-span-2 flex bg-[#f1f5f9] rounded-[10px] p-1 gap-1 mb-1">
                      {[
                        { mode: "new",      icon: <BuildingIcon size={13} />, label: "Register new company" },
                        { mode: "existing", icon: <Search size={13} />,       label: "Join existing company" },
                      ].map(({ mode, icon, label }) => (
                        <button key={mode} type="button" onClick={() => setCompanyMode(mode)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-[9px] px-3 rounded-[7px] text-[13px] font-semibold cursor-pointer transition-all border-0 ${
                            companyMode === mode
                              ? "bg-white text-[#091d33] shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                              : "bg-transparent text-[#64748b] hover:text-[#091d33]"
                          }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>

                    {companyMode === "new" && (
                      <>
                        <Field label="Company Name" icon={<Building2 size={14} />} error={fieldErrors.companyName} full>
                          <input type="text" name="companyName" value={form.companyName} onChange={handleChange}
                            placeholder="e.g. Acme Technologies Pvt Ltd" className={inputCls(fieldErrors.companyName)} />
                        </Field>

                        <Field label="Company Type" icon={<Building2 size={14} />} error={fieldErrors.companyType}>
                          <select name="companyType" value={form.companyType} onChange={handleChange}
                            className={inputCls(fieldErrors.companyType, "appearance-none")}>
                            <option value="">{enumsLoading ? "Loading…" : "— Select type —"}</option>
                            {companyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                        </Field>

                        <Field label="Company Size" icon={<User size={14} />} error={fieldErrors.companySize}>
                          <select name="companySize" value={form.companySize} onChange={handleChange}
                            className={inputCls(fieldErrors.companySize, "appearance-none")}>
                            <option value="">{enumsLoading ? "Loading…" : "— Select size —"}</option>
                            {companySizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
                        </Field>

                        <Field label="Founded Year" icon={<AtSign size={14} />} error={fieldErrors.foundedYear}>
                          <input type="number" name="foundedYear" value={form.foundedYear} onChange={handleChange}
                            placeholder="e.g. 2015" min="1800" max="2100" className={inputCls(fieldErrors.foundedYear)} />
                        </Field>

                        <Field label="Industry" icon={<Building2 size={14} />} error={fieldErrors.industry}>
                          <input type="text" name="industry" value={form.industry} onChange={handleChange}
                            placeholder="e.g. IT Services" className={inputCls(fieldErrors.industry)} />
                        </Field>

                        <Field label="Headquarters" icon={<Mail size={14} />} error={fieldErrors.headquarters}>
                          <input type="text" name="headquarters" value={form.headquarters} onChange={handleChange}
                            placeholder="e.g. Delhi, India" className={inputCls(fieldErrors.headquarters)} />
                        </Field>

                        <Field label="Website URL" icon={<AtSign size={14} />} error={fieldErrors.websiteUrl}>
                          <input type="url" name="websiteUrl" value={form.websiteUrl} onChange={handleChange}
                            placeholder="https://company.com" className={inputCls(fieldErrors.websiteUrl)} />
                        </Field>

                        <div className="flex flex-col gap-[7px]">
                          <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">
                            Company Logo <span className="text-[#94a3b8] font-normal">(optional)</span>
                          </label>
                          <div
                            onClick={() => document.getElementById("companyLogo").click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault(); setDragOver(false);
                              const f = e.dataTransfer.files[0];
                              if (f?.type.startsWith("image/")) handleLogoFile(f);
                            }}
                            className={`flex items-center gap-4 p-3.5 border-2 border-dashed rounded-[10px] cursor-pointer transition-all ${
                              dragOver ? "border-[#d97706] bg-[#fffbeb]" : "border-[#e2e8f0] bg-[#fafbfc] hover:border-[#d97706] hover:bg-[#fffbeb]"
                            }`}
                          >
                            <input type="file" id="companyLogo" accept="image/*" className="hidden"
                              onChange={(e) => handleLogoFile(e.target.files[0])} />
                            <div className="w-10 h-10 rounded-[10px] border border-[#e2e8f0] bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                              {logoPreview
                                ? <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                                : <Image size={20} className="text-[#cbd5e1]" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-semibold text-[#334155]">Click to upload logo</div>
                              <div className="text-[11px] text-[#94a3b8]">PNG, JPG, SVG · max 2 MB</div>
                            </div>
                            {logoPreview && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); removeLogo(); }}
                                className="ml-auto bg-transparent border-none text-[#94a3b8] hover:text-red-500 transition-colors p-1 cursor-pointer">
                                <X size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 flex flex-col gap-[7px]">
                          <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">Company Description</label>
                          <div className="relative">
                            <span className="absolute left-[13px] top-[14px] text-[#94a3b8] pointer-events-none"><MessageSquare size={14} /></span>
                            <textarea name="companyDescription" value={form.companyDescription} onChange={handleChange}
                              placeholder="Brief description of your company culture and mission..." rows={3}
                              className="w-full border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all resize-none"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {companyMode === "existing" && (
                      <div className="col-span-2 flex flex-col gap-[7px]">
                        <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">Search your company</label>
                        <div className="relative" ref={searchWrapRef}>
                          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none z-10"><Search size={14} /></span>
                          <input type="text" value={searchQuery} onChange={handleSearchInput}
                            placeholder="Type company name to search…" autoComplete="off"
                            className="w-full h-[48px] border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all" />
                          {dropdownOpen && (
                            <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#e2e8f0] rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] z-[200] max-h-[220px] overflow-y-auto">
                              {searchLoading ? (
                                <div className="p-3 flex justify-center"><span className="w-5 h-5 border-2 border-[#94a3b8] border-t-transparent rounded-full animate-spin" /></div>
                              ) : searchResults.length === 0 ? (
                                <div className="p-3.5 text-center text-[13px] text-[#94a3b8]">No companies found</div>
                              ) : searchResults.map(c => (
                                <div key={c.id} onClick={() => selectCompany(c)} className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-b-0 transition-colors">
                                  {c.companyLogo
                                    ? <img src={c.companyLogo} alt={c.companyName} className="w-8 h-8 rounded-md object-contain border border-[#e2e8f0] bg-[#f8fafc] flex-shrink-0" />
                                    : <div className="w-8 h-8 rounded-md bg-[#e6f7f6] text-[#18a99c] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{getInitials(c.companyName)}</div>
                                  }
                                  <div>
                                    <div className="text-[13px] font-semibold text-[#0f172a]">{c.companyName}</div>
                                    {c.verificationStatus && <div className="text-[11px] text-[#94a3b8]">{c.verificationStatus}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {selectedCompany && (
                          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[10px] mt-2">
                            {selectedCompany.logoUrl
                              ? <img src={selectedCompany.logoUrl} alt={selectedCompany.name} className="w-9 h-9 rounded-[7px] object-contain border border-[#d1fae5] bg-white flex-shrink-0" />
                              : <div className="w-9 h-9 rounded-[7px] bg-[#e6f7f6] text-[#18a99c] text-[12px] font-bold flex items-center justify-center flex-shrink-0">{getInitials(selectedCompany.name)}</div>
                            }
                            <span className="flex-1 text-[13px] font-semibold text-[#065f46]">{selectedCompany.name}</span>
                            <button type="button" onClick={clearSelectedCompany} className="bg-transparent border-none text-[#6b7280] hover:text-red-500 cursor-pointer p-1 rounded text-base leading-none transition-colors"><X size={16} /></button>
                          </div>
                        )}
                        {fieldErrors.companySearch && <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.companySearch}</span>}
                      </div>
                    )}

                    <SectionLabel>Security questions</SectionLabel>

                    <div className="col-span-2 flex items-center gap-2.5 mt-2 mb-1">
                      <Shield size={12} className="text-[#94a3b8] flex-shrink-0" />
                      <span className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#94a3b8] whitespace-nowrap">Account recovery</span>
                      <div className="flex-1 h-px bg-[rgba(9,29,51,0.12)]" />
                    </div>

                    {secPairs.map((pair, idx) => (
                      <SecurityPair key={idx} num={idx + 1} questions={questions} selectedIds={selectedQuestionIds} value={pair.questionId} answer={pair.answer} onQuestionChange={(e) => updateSecPair(idx, "questionId", e.target.value)} onAnswerChange={(e)   => updateSecPair(idx, "answer",     e.target.value)} errors={secErrors[idx]} />
                    ))}

                    <SectionLabel>Set password</SectionLabel>

                    <div className="flex flex-col gap-[7px]">
                      <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">Password</label>
                      <div className="relative">
                        <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none z-10"><Lock size={14} /></span>
                        <input type={showPwd ? "text" : "password"} value={password} onChange={handlePassword} placeholder="Min. 8 characters" required className={inputCls(fieldErrors.password, "pr-11")} />
                        <button type="button" onClick={() => setShowPwd(v => !v)} tabIndex={-1} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors p-1 flex items-center">
                          {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                      {strength && (
                        <div className="mt-1">
                          <div className="h-[3px] rounded-full bg-gray-200 overflow-hidden mb-1">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.pct, background: strength.color }} />
                          </div>
                          <span className="text-[11px] font-medium" style={{ color: strength.color }}>{strength.label}</span>
                        </div>
                      )}
                      {fieldErrors.password && <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.password}</span>}
                    </div>

                    <div className="flex flex-col gap-[7px]">
                      <label className="text-[12px] font-medium text-[#091d33] tracking-[0.3px]">Confirm Password</label>
                      <div className="relative">
                        <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none z-10"><Lock size={14} strokeWidth={2.5} /></span>
                        <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={handleConfirm} placeholder="Repeat password" required className={inputCls(fieldErrors.confirmPassword, "pr-11")} />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors p-1 flex items-center">
                          {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword && <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.confirmPassword}</span>}
                    </div>

                  </div>

                  <button type="submit" disabled={loading} className="w-full h-[50px] bg-[#091d33] text-white border-0 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#d97706] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-8 mb-6">
                    {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account…</> : <><UserPlus size={16} /> Register as Recruiter</>}
                  </button>

                  <div className="text-center text-[14px] text-[#64748b]">
                    Already have an account?{" "}
                    <Link to="/recruiter/login" className="text-[#091d33] font-semibold border-b-2 border-[#f59e0b] pb-px hover:text-[#d97706] transition-colors">Sign in →</Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default RecruiterRegister;
