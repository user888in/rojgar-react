import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import rojgar_shine_logo from "../assets/images/Rojgarshine White Logo-01.png"


//  CONSTANTS
const PASSWORD_PATTERN = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

const STRENGTH_LEVELS = [
  { pct: "25%",  color: "#ef4444", label: "Weak"   },
  { pct: "50%",  color: "#f97316", label: "Fair"   },
  { pct: "75%",  color: "#eab308", label: "Good"   },
  { pct: "100%", color: "#22c55e", label: "Strong" },
];

// Maps backend field names → our form field keys
const BACKEND_FIELD_MAP = {
  email    : "email",
  username : "username",
  phone    : "phone",
  mobile   : "phone",
  password : "password",
  fullname : "fullName",
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

//  SVG ICONS
const IconPerson   = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const IconAt       = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/></svg>;
const IconEnvelope = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const IconPhone    = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>;
const IconLock     = ({ filled = false }) => <svg width="16" height="16" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>;
const IconQuestion = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const IconChat     = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>;
const IconShield   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>;
const IconEyeOff   = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>;
const IconEye      = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>;
const IconChevron  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>;

//  TOAST
function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-[11000] flex flex-col gap-2.5 pointer-events-none max-w-[360px] w-[calc(100%-32px)] sm:w-auto">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 bg-[#1e293b] text-[#f1f5f9] rounded-xl px-4 py-3.5 text-[13px] leading-relaxed shadow-2xl border-l-4 animate-[toastIn_.35s_cubic-bezier(.34,1.56,.64,1)_both] ${
            t.type === "success" ? "border-green-500" :
            t.type === "warning" ? "border-amber-500" : "border-red-500"
          }`}
        >
          <span className={`flex-shrink-0 mt-0.5 ${
            t.type === "success" ? "text-green-500" :
            t.type === "warning" ? "text-amber-500" : "text-red-500"
          }`}>
            {t.type === "success" ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            ) : t.type === "warning" ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
            )}
          </span>
          <span className="flex-1">{t.text}</span>
          <button onClick={() => onDismiss(t.id)} className="flex-shrink-0 text-[#94a3b8] hover:text-[#f1f5f9] transition-colors ml-1 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  );
}

//  EMAIL VERIFICATION MODAL
function EmailVerificationModal({ email, onGoLogin }) {
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown]           = useState(0);

  const handleResend = async () => {
    setResendDisabled(true);
    setCountdown(60);
    try {
      await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
    } catch (err) {
      console.err(err);
    }
    const interval = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) { clearInterval(interval); setResendDisabled(false); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-[#091d33]/55 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-[fadeIn_.3s_ease_both]">
      <div className="bg-white rounded-2xl p-10 max-w-[420px] w-full text-center shadow-2xl animate-[slideUp_.35s_cubic-bezier(.34,1.56,.64,1)_both]">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6 text-[16px] font-semibold text-[#091d33]">
          <div className="w-2 h-2 bg-[#18a99c] rounded-full" />
          Rojgar<span className="text-[#18a99c]">Shine</span>
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 mb-7">
          <div className="w-2 h-2 rounded-full border-[1.5px] border-[#18a99c] bg-[#18a99c]" />
          <div className="w-7 h-[1.5px] rounded-full bg-[#18a99c]" />
          <div className="w-2 h-2 rounded-full border-[1.5px] border-[#18a99c] bg-[#18a99c]" />
          <div className="w-7 h-[1.5px] rounded-full bg-[#e1f5ee]" />
          <div className="w-2 h-2 rounded-full border-[1.5px] border-[#18a99c] bg-[#e1f5ee]" />
        </div>

        {/* Animated icon */}
        <div className="w-[76px] h-[76px] rounded-full bg-[#e1f5ee] flex items-center justify-center mx-auto mb-5 animate-[evPulse_2.4s_ease-in-out_infinite]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="2.5" fill="#18a99c" opacity="0.15"/>
            <rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#18a99c" strokeWidth="1.6"/>
            <path d="M2 8l10 7 10-7" stroke="#18a99c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="17.5" cy="16.5" r="4" fill="#18a99c"/>
            <path d="M15.5 16.5l1.3 1.3 2.2-2.2" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="text-[22px] font-bold text-[#091d33] tracking-tight mb-2.5">Check your email</h2>
        <p className="text-[14px] text-[#64748b] leading-relaxed mb-7">
          We've sent a verification link to<br />
          <strong className="text-[#091d33] font-semibold">{email}</strong><br />
          Click the link to verify your account.
        </p>

        <button
          onClick={onGoLogin}
          className="block w-full py-3.5 bg-[#091d33] text-white rounded-xl text-[15px] font-semibold hover:bg-[#18a99c] active:scale-[0.99] transition-all mb-4 cursor-pointer"
        >
          Go to Login
        </button>

        <p className="text-[13px] text-[#94a3b8]">
          Didn't receive the email?{" "}
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="font-semibold text-[#18a99c] border-b border-[#18a99c]/35 hover:text-[#0d8a7e] disabled:text-[#94a3b8] disabled:border-transparent disabled:cursor-not-allowed transition-colors bg-transparent"
          >
            Resend it
          </button>
          {countdown > 0 && (
            <span className="inline-block text-[11px] font-semibold text-[#64748b] bg-[#f1f5f9] rounded-full px-2.5 py-0.5 ml-1.5">
              {countdown}s
            </span>
          )}
        </p>

        <div className="h-px bg-[rgba(9,29,51,0.08)] my-5" />
        <p className="text-[12px] text-[#b0bac6] leading-relaxed">
          Check your spam or junk folder if you don't see it within a few minutes.
        </p>
      </div>
    </div>
  );
}


//  SECURITY QUESTION PAIR

function SecurityPair({ num, questions, selectedIds, value, answer, onQuestionChange, onAnswerChange, errors = {} }) {
  return (
    <div className="relative border border-[rgba(9,29,51,0.1)] rounded-2xl p-5 pt-7 bg-[#F8FAFC] flex flex-col gap-4">
      <span className="absolute -top-3 left-5 text-[10px] font-bold text-white uppercase tracking-widest bg-[#18a99c] rounded-full px-3 py-1 shadow">
        Question {num}
      </span>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[13px] font-medium text-[#091d33]">Security Question</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
              <IconQuestion />
            </span>
            <select
              value={value}
              onChange={onQuestionChange}
              required
              disabled={questions.length === 0}
              className={`w-full pl-10 pr-8 py-3 border rounded-xl text-sm text-[#091d33] bg-[#F1F5F9] focus:bg-white outline-none focus:border-[#18a99c] focus:ring-2 focus:ring-[#18a99c]/15 transition appearance-none disabled:opacity-60 disabled:cursor-not-allowed ${errors.question ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"}`}
            >
              <option value="" disabled>
                {questions.length === 0 ? "Loading questions…" : "— Select a security question —"}
              </option>
              {questions.map((q) => {
                const id   = String(q.questionId ?? q.id ?? "");
                const text = q.questionText || q.question || q.text || "";
                const used = selectedIds.includes(id) && id !== value;
                return <option key={id} value={id} disabled={used}>{text}</option>;
              })}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#94a3b8]">
              <IconChevron />
            </span>
          </div>
          {errors.question && <span className="text-[12px] text-red-500">{errors.question}</span>}
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[13px] font-medium text-[#091d33]">Your Answer</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
              <IconChat />
            </span>
            <input
              type="text"
              value={answer}
              onChange={onAnswerChange}
              placeholder="Answer (case-insensitive)"
              required
              autoComplete="off"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm text-[#091d33] bg-[#F1F5F9] focus:bg-white placeholder-[#94a3b8] outline-none focus:border-[#18a99c] focus:ring-2 focus:ring-[#18a99c]/15 transition ${errors.answer ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"}`}
            />
          </div>
          {errors.answer && <span className="text-[12px] text-red-500">{errors.answer}</span>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullName: "", username: "", email: "", phone: "", password: "", confirmPassword: "",
  });

  const [secPairs, setSecPairs] = useState([
    { questionId: "", answer: "" },
    { questionId: "", answer: "" },
    { questionId: "", answer: "" },
  ]);

  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength,    setStrength]    = useState(null);
  const [questions,   setQuestions]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [secErrors,   setSecErrors]   = useState([{}, {}, {}]);
  const [toasts,      setToasts]      = useState([]);
  const [showModal,   setShowModal]   = useState(false);
  const [regEmail,    setRegEmail]    = useState("");
  const toastCounter = useRef(0);

  // ── Toast helpers ──────────────────────────────────────
  const showToast = (text, type = "danger") => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };
  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // ── Load security questions ────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/security-questions`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setQuestions(Array.isArray(data) ? data : (data.content || [])))
      .catch(() => showToast("Could not load security questions. Please refresh the page.", "danger"));
  }, []);

  // ── Field change handlers ──────────────────────────────
  const clearErr = (key) => setFieldErrors((prev) => ({ ...prev, [key]: "" }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearErr(name);
  };

  const handleFullName = (e) => {
    const v = e.target.value.replace(/\b\w/g, (c) => c.toUpperCase());
    setForm((prev) => ({ ...prev, fullName: v }));
    clearErr("fullName");
  };

  const handlePhone = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 10);
    setForm((prev) => ({ ...prev, phone: v }));
    if (v && !/^\d{10}$/.test(v)) {
      setFieldErrors((prev) => ({ ...prev, phone: "Enter 10-digit number only, without country code" }));
    } else {
      clearErr("phone");
    }
  };

  const handleUsername = (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, username: v }));
    if (v && !USERNAME_PATTERN.test(v)) {
      setFieldErrors((prev) => ({ ...prev, username: "Only letters, numbers, dot (.), underscore (_) and hyphen (-) allowed" }));
    } else {
      clearErr("username");
    }
  };

  const handlePassword = (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, password: v }));
    setStrength(getStrength(v));
    if (v && !PASSWORD_PATTERN.test(v)) {
      setFieldErrors((prev) => ({ ...prev, password: "8–20 chars, must include uppercase, lowercase, number & special character (@#$%^&+=!)" }));
    } else {
      clearErr("password");
    }
    if (form.confirmPassword && v !== form.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      clearErr("confirmPassword");
    }
  };

  const handleConfirm = (e) => {
    const v = e.target.value;
    setForm((prev) => ({ ...prev, confirmPassword: v }));
    if (v && v !== form.password) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else {
      clearErr("confirmPassword");
    }
  };

  const updateSecPair = (idx, field, val) => {
    setSecPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
    setSecErrors((prev) => prev.map((e, i) =>
      i === idx ? { ...e, [field === "questionId" ? "question" : "answer"]: "" } : e
    ));
  };

  const selectedQuestionIds = secPairs.map((p) => p.questionId).filter(Boolean);

  // ── Apply backend field errors ─────────────────────────
  const applyBackendErrors = (result) => {
    const data = result.data || {};
    let applied = false;

    const apply = (key, msg) => {
      const fieldKey = BACKEND_FIELD_MAP[key?.toLowerCase()];
      if (fieldKey) {
        setFieldErrors((prev) => ({ ...prev, [fieldKey]: msg }));
        applied = true;
      }
    };

    if (data.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
      Object.entries(data.errors).forEach(([k, v]) => apply(k, v));
    } else if (Array.isArray(data.errors)) {
      data.errors.forEach(({ field, message }) => apply(field, message));
    } else if (data.field && data.message) {
      apply(data.field, data.message);
    } else if (result.message) {
      const msg = result.message.toLowerCase();
      for (const keyword of Object.keys(BACKEND_FIELD_MAP)) {
        if (msg.includes(keyword)) { apply(keyword, result.message); break; }
      }
    }

    return applied;
  };

  // ── Validate ───────────────────────────────────────────
  const validate = () => {
    const fe = {};
    const track = (key, msg) => { if (!fe[key]) fe[key] = msg; };

    if (!form.fullName.trim())                        track("fullName",        "Full name is required.");
    if (!form.username.trim())                        track("username",        "Username is required.");
    else if (!USERNAME_PATTERN.test(form.username))   track("username",        "Only letters, numbers, dot (.), underscore (_) and hyphen (-) allowed");
    if (!/\S+@\S+\.\S+/.test(form.email))            track("email",           "Enter a valid email address.");
    if (!/^\d{10}$/.test(form.phone))                track("phone",           "Enter a valid 10-digit phone number without country code.");
    if (!PASSWORD_PATTERN.test(form.password))        track("password",        "8–20 chars, must include uppercase, lowercase, number & special character (@#$%^&+=!)");
    if (form.password !== form.confirmPassword)       track("confirmPassword", "Passwords do not match.");

    const se = secPairs.map((p) => {
      const e = {};
      if (!p.questionId)    e.question = "Please select a security question.";
      if (!p.answer.trim()) e.answer   = "Please provide an answer.";
      return e;
    });

    const ids = secPairs.map((p) => p.questionId).filter(Boolean);
    const dupQuestions = new Set(ids).size < ids.length;

    return {
      fe, se, dupQuestions,
      hasErrors: Object.keys(fe).length > 0 || se.some((e) => Object.keys(e).length > 0) || dupQuestions,
    };
  };

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { fe, se, dupQuestions, hasErrors } = validate();
    if (hasErrors) {
      setFieldErrors(fe);
      setSecErrors(se);
      if (dupQuestions) showToast("Please select 3 different security questions.", "danger");
      return;
    }

    setLoading(true);

    const payload = {
      fullname : form.fullName.trim(),
      username : form.username.trim(),
      email    : form.email.trim(),
      phone    : form.phone.trim(),
      password : form.password,
      role     : "JOB_SEEKER",
      securityQuestions: secPairs.map((p) => ({
        securityQuestionId : parseInt(p.questionId, 10),
        securityAnswer     : p.answer.trim(),
      })),
    };

    try {
      const res  = await fetch(`${API_BASE_URL}/auth/register`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        // Auto-login if token returned
        if (data.token && data.user) {
          login(data.token, data.user);
          navigate("/dashboard", { replace: true });
          return;
        }
        // Otherwise show email verification modal
        setRegEmail(form.email.trim());
        setShowModal(true);
        setForm({ fullName: "", username: "", email: "", phone: "", password: "", confirmPassword: "" });
        setSecPairs([{ questionId: "", answer: "" }, { questionId: "", answer: "" }, { questionId: "", answer: "" }]);
        setStrength(null);
      } else {
        const result = { ok: false, message: data.message || "Registration failed.", data };
        const fieldApplied = applyBackendErrors(result);
        showToast(
          data.message || (fieldApplied ? "Please fix the highlighted fields below." : "Registration failed. Please try again."),
          fieldApplied ? "warning" : "danger"
        );
      }
    } catch (err) {
      showToast(
        err.name === "TypeError" ? "Network error. Please check your connection." : (err.message || "Something went wrong."),
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Input class helper ─────────────────────────────────
  const inputCls = (key, extra = "") =>
    `w-full pl-10 pr-4 py-3 border rounded-xl text-sm text-[#091d33] bg-white placeholder-[#94a3b8] outline-none focus:border-[#18a99c] focus:ring-2 focus:ring-[#18a99c]/15 transition ${
      fieldErrors[key] ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"
    } ${extra}`;

  // ══════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes evPulse { 0%,100% { box-shadow:0 0 0 0 rgba(24,169,156,.25); } 50% { box-shadow:0 0 0 12px rgba(24,169,156,0); } }
      `}</style>

      <div className="flex min-h-screen">

        {/* ══════════ LEFT PANEL ══════════ */}
        <div className="hidden lg:flex w-[42%] xl:w-[42%] bg-[#091d33] flex-col justify-start px-12 py-16 relative overflow-hidden sticky top-0 h-screen">
          <div className="absolute w-[380px] h-[380px] rounded-full border border-[#18a99c]/[0.12] -top-20 -right-24 pointer-events-none" />
          <div className="absolute w-[220px] h-[220px] rounded-full bg-[#18a99c]/[0.06] -bottom-10 -left-14 pointer-events-none" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-[#18a99c]/[0.08] top-1/2 -left-14 -translate-y-1/2 pointer-events-none" />

          <div className="relative z-10">
            <a href="/" className="block mb-8">
              <img src={rojgar_shine_logo} alt="RojgarShine" className="h-[100px] w-auto object-contain" />
            </a>
            <h1 className="text-white font-semibold leading-[1.18] tracking-normal mb-5 ps-12 text-3xl">
              Join thousands<br />finding their<br />
              <em className="not-italic text-[#18a99c]">dream jobs</em>
            </h1>
            <p className="text-white/45 text-[14px] leading-[1.75] max-w-[320px] mb-5 ps-12">
              Create your free account and get matched with verified jobs from top companies in minutes.
            </p>
            <div className="flex flex-col gap-3 ps-12">
              {[
                { n: "1", title: "Create your profile",   desc: "Add your skills, experience and resume"     },
                { n: "2", title: "Explore opportunities", desc: "Browse thousands of verified job openings"  },
                { n: "3", title: "Get hired fast",        desc: "Apply in one click with your saved profile" },
              ].map(({ n, title, desc }) => (
                <div key={n} className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#18a99c]/15 border border-[#18a99c]/30 flex items-center justify-center text-[#18a99c] text-[13px] font-bold">{n}</div>
                  <div>
                    <div className="text-white text-[13px] font-semibold leading-tight">{title}</div>
                    <div className="text-white/40 text-[10px] mt-0.5 leading-snug">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 bg-[#ffffff] overflow-y-auto">
          <div className="max-w-[700px] mx-auto px-6 py-12">

            <p className="text-[#18a99c] text-xs font-bold uppercase tracking-widest mb-2">Get started free</p>
            <h2 className="text-[#091d33] text-[28px] font-bold leading-tight tracking-tight mb-1">Create your account</h2>
            <p className="text-[#64748b] text-sm mb-8">Fill in the details below to join RojgarShine</p>

            <form onSubmit={handleSubmit} autoComplete="off" noValidate>

              {/* ── 2-col grid ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5 mb-5">

                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fullName" className="text-[13px] font-medium text-[#091d33]">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"><IconPerson /></span>
                    <input type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleFullName}
                      placeholder="Full Name" required autoComplete="name" className={inputCls("fullName")} />
                  </div>
                  {fieldErrors.fullName && <span className="text-[12px] text-red-500">{fieldErrors.fullName}</span>}
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className="text-[13px] font-medium text-[#091d33]">Username</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"><IconAt /></span>
                    <input type="text" id="username" name="username" value={form.username} onChange={handleUsername}
                      placeholder="Username" required autoComplete="username" className={inputCls("username")} />
                  </div>
                  {fieldErrors.username && <span className="text-[12px] text-red-500">{fieldErrors.username}</span>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[13px] font-medium text-[#091d33]">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"><IconEnvelope /></span>
                    <input type="email" id="email" name="email" value={form.email} onChange={handleChange}
                      placeholder="you@example.com" required autoComplete="email" className={inputCls("email")} />
                  </div>
                  {fieldErrors.email && <span className="text-[12px] text-red-500">{fieldErrors.email}</span>}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-[13px] font-medium text-[#091d33]">Phone Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"><IconPhone /></span>
                    <input type="tel" id="phone" name="phone" value={form.phone} onChange={handlePhone}
                      placeholder="Mobile Number" required autoComplete="tel" inputMode="numeric" maxLength={10}
                      className={inputCls("phone")} />
                  </div>
                  {fieldErrors.phone && <span className="text-[12px] text-red-500">{fieldErrors.phone}</span>}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-[13px] font-medium text-[#091d33]">Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none z-10"><IconLock /></span>
                    <input 
                      type={showPwd ? "text" : "password"} id="password" name="password"
                      value={form.password} onChange={handlePassword}
                      placeholder="Min. 8 characters" required autoComplete="new-password"
                      className={inputCls("password", "pr-11")}
                    />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors">
                      {showPwd ? <IconEye /> : <IconEyeOff />}
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
                  {fieldErrors.password && <span className="text-[12px] text-red-500">{fieldErrors.password}</span>}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#091d33]">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none z-10"><IconLock filled /></span>
                    <input
                      type={showConfirm ? "text" : "password"} id="confirmPassword" name="confirmPassword"
                      value={form.confirmPassword} onChange={handleConfirm}
                      placeholder="Repeat password" required autoComplete="new-password"
                      className={inputCls("confirmPassword", "pr-11")}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors">
                      {showConfirm ? <IconEye /> : <IconEyeOff />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && <span className="text-[12px] text-red-500">{fieldErrors.confirmPassword}</span>}
                </div>

              </div>{/* /grid */}

              {/* ── Security Questions ── */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1.5 text-[#64748b] text-[12px] font-semibold uppercase tracking-wider whitespace-nowrap">
                    <IconShield /> Security Questions
                  </div>
                  <div className="flex-1 h-px bg-[rgba(9,29,51,0.1)]" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {secPairs.map((pair, idx) => (
                    <SecurityPair
                      key={idx}
                      num={idx + 1}
                      questions={questions}
                      selectedIds={selectedQuestionIds}
                      value={pair.questionId}
                      answer={pair.answer}
                      onQuestionChange={(e) => updateSecPair(idx, "questionId", e.target.value)}
                      onAnswerChange={(e)   => updateSecPair(idx, "answer",     e.target.value)}
                      errors={secErrors[idx]}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                className="w-full h-[50px] bg-[#091d33] text-white rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#18a99c] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-5"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating account…</>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                    </svg>
                    Create Account
                  </>
                )}
              </button>

              <div className="text-center text-sm text-[#64748b]">
                Already have an account?{" "}
                <Link to="/login" className="text-[#091d33] font-semibold border-b-2 border-[#18a99c] pb-px hover:text-[#18a99c] transition-colors">
                  Sign in →
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Email verification modal */}
      {showModal && (
        <EmailVerificationModal
          email={regEmail}
          onGoLogin={() => navigate("/login", { replace: true })}
        />
      )}
    </>
  );
};

export default Register;
