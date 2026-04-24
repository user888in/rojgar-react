import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";


const PASSWORD_PATTERN =
  /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{8,20}$/;

const STRENGTH_LEVELS = [
  { pct: "25%",  color: "#ef4444", label: "Weak"   },
  { pct: "50%",  color: "#f97316", label: "Fair"   },
  { pct: "75%",  color: "#eab308", label: "Good"   },
  { pct: "100%", color: "#22c55e", label: "Strong" },
];

function getStrength(val) {
  if (!val) return null;
  let score = 0;
  if (val.length >= 8)          score++;
  if (/[A-Z]/.test(val))        score++;
  if (/[0-9]/.test(val))        score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return STRENGTH_LEVELS[score - 1] || STRENGTH_LEVELS[0];
}

// ══════════════════════════════════════════════════════════
//  PASSWORD TIPS — from left panel
// ══════════════════════════════════════════════════════════
const TIPS = [
  "At least 8 characters long",
  "Include uppercase letters (A–Z)",
  "Add numbers and symbols (!@#$)",
  "Avoid common words or sequences",
];

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
const ResetPassword = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  // Token from URL — exactly like resetPassword.js
  const token = searchParams.get("token");

  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [strength,        setStrength]        = useState(null);
  const [passwordError,   setPasswordError]   = useState("");
  const [confirmError,    setConfirmError]    = useState("");
  const [message,         setMessage]         = useState(null); // { text, type: "error"|"success" }
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);

  // ── No token — disable form immediately (mirrors resetPassword.js) ──
  const noToken = !token;

  // ── New password change ────────────────────────────────
  const handleNewPassword = (e) => {
    const val = e.target.value;
    setNewPassword(val);

    if (val && !PASSWORD_PATTERN.test(val)) {
      setPasswordError("8–20 chars, uppercase, lowercase, number, special character, no spaces.");
    } else {
      setPasswordError("");
    }

    setStrength(val ? getStrength(val) : null);

    // Re-validate confirm on password change
    if (confirmPassword) {
      setConfirmError(val !== confirmPassword ? "Passwords do not match" : "");
    }
  };

  // ── Confirm password change ────────────────────────────
  const handleConfirmPassword = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (!val) { setConfirmError(""); return; }
    setConfirmError(newPassword !== val ? "Passwords do not match" : "");
  };

  // ── Submit — mirrors resetPassword.js exactly ──────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // ── Client-side validation ──
    if (!PASSWORD_PATTERN.test(newPassword)) {
      setPasswordError("Password does not meet requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          token,                          // token from URL query param
          newPassword,                    // NOT trimmed — keep exact input
        }),
      });

      // API returns plain text (not JSON) — mirrors response.text() in JS
      const result = await response.text();

      if (response.ok) {
        setDone(true);
        setMessage({
          type: "success",
          text: "Password reset successful! Redirecting to login...",
        });
        // Redirect to /login after 2s — mirrors setTimeout(() => href = "/", 2000)
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else {
        setMessage({
          type: "error",
          text: result || "Reset failed. Link may have expired.",
        });
      }

    } catch {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════
  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div className="flex min-h-screen">

        {/* ════════ LEFT PANEL ════════ */}
        <div className="hidden lg:flex w-1/2 bg-[#091d33] flex-col justify-center px-14 py-16 relative overflow-hidden">

          {/* Teal rings — exact rp-left::before / ::after from inline CSS */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-[#18a99c]/[0.12] -top-20 -right-24 pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[#18a99c]/[0.06] -bottom-10 -left-12 pointer-events-none" />

          <div className="relative z-10">

            {/* Icon box — rl-icon-wrap */}
            <div className="w-[72px] h-[72px] rounded-[18px] bg-[#18a99c]/[0.12] border border-[#18a99c]/20 flex items-center justify-center mb-6">
              <KeyRound size={32} className="text-[#18a99c]" />
            </div>

            {/* Headline — rl-headline, em = teal */}
            <h1
              className="text-white font-bold leading-[1.2] tracking-normal mb-3.5 text-4xl"
            >
              Choose a<br />
              <em className="not-italic text-[#18a99c]">strong new</em><br />
              password
            </h1>

            {/* Sub — rl-sub */}
            <p className="text-white/45 text-[15px] leading-[1.75] max-w-[300px] mb-10">
              Make it unique and hard to guess. You won't have to reset it again for a long time.
            </p>

            {/* Tips card — rl-tips */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-5">
              <div className="text-[14px] font-bold text-white/50 uppercase tracking-[1px] mb-3.5">
                Password tips
              </div>
              <div className="flex flex-col gap-2.5">
                {TIPS.map((tip) => (
                  <div key={tip} className="flex items-center gap-2.5 text-[14px] text-white/50">
                    <CheckCircle2 size={14} className="text-[#18a99c] flex-shrink-0" />
                    {tip}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL   */}
        <div className="flex-1 bg-white flex flex-col justify-center px-16 py-16">
          <div
            className="max-w-[420px] w-full mx-auto"
            style={{ animation: "fadeUp .5s ease both" }}
          >

            {/* Eyebrow — rr-eyebrow, teal */}
            <div className="text-[12px] font-bold tracking-[2px] uppercase text-[#18a99c] mb-2">
              Almost done
            </div>

            {/* Title */}
            <h2 className="text-[28px] font-bold text-[#091d33]  mb-2">
              Set a new password
            </h2>

            {/* Sub */}
            <p className="text-[14px] text-[#64748b] leading-[1.6] mb-8">
              {noToken
                ? "This reset link is invalid or missing."
                : "Your reset link is valid. Enter and confirm your new password below."}
            </p>

            {/* No-token error — mirrors JS: message.textContent = "Invalid or missing reset link." */}
            {noToken && (
              <div className="flex items-start gap-2.5 text-[13px] px-3.5 py-2.5 rounded-[10px] mb-6 bg-[#fff5f5] border border-[#fecaca] text-[#991b1b]">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                Invalid or missing reset link. Please request a{" "}
                <Link to="/forgot-password" className="underline font-semibold ml-0.5">new reset link</Link>.
              </div>
            )}

            {/* Global message — error or success */}
            {message && (
              <div
                className={`text-[13px] px-3.5 py-2.5 rounded-[10px] mb-5 leading-snug ${
                  message.type === "success"
                    ? "bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534]"
                    : "bg-[#fff5f5] border border-[#fecaca] text-[#991b1b]"
                }`}
              >
                {message.text}
              </div>
            )}

            <form id="resetForm" onSubmit={handleSubmit} autoComplete="off" noValidate>

              {/* New Password */}
              <div className="mb-10">
                <label htmlFor="newPassword" className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px] block">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showNew ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={handleNewPassword}
                    placeholder="Min. 8 characters"
                    required
                    autoComplete="new-password"
                    disabled={noToken || done}
                    className={`w-full h-[48px] border-[1.5px] rounded-xl pl-10 pr-12 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#18a99c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,169,156,0.10)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      passwordError ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    tabIndex={-1}
                    disabled={noToken || done}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors p-1 flex items-center disabled:cursor-not-allowed"
                  >
                    {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>

                {/* Strength bar — pwd-strength, shown when typing */}
                {strength && !done && (
                  <div className="mt-2">
                    <div className="h-[3px] rounded-full bg-gray-200 overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: strength.pct, background: strength.color }}
                      />
                    </div>
                    <span className="text-[11px] font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}

                {/* Inline field error */}
                {passwordError && (
                  <span className="text-[11px] text-red-500 mt-1 block">{passwordError}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-7">
                <label htmlFor="confirmPassword" className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px] block">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                    <Lock size={14} strokeWidth={2.5} />
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={handleConfirmPassword}
                    placeholder="Repeat new password"
                    required
                    autoComplete="new-password"
                    disabled={noToken || done}
                    className={`w-full h-[48px] border-[1.5px] rounded-xl pl-10 pr-12 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#18a99c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,169,156,0.10)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      confirmError ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    tabIndex={-1}
                    disabled={noToken || done}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors p-1 flex items-center disabled:cursor-not-allowed"
                  >
                    {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
                {confirmError && (
                  <span className="text-[11px] text-red-500 mt-1 block">{confirmError}</span>
                )}
              </div>

              {/* Submit — btn-submit, disabled when no token or done */}
              <button
                type="submit"
                id="actionBtn"
                disabled={noToken || loading || done}
                className="w-full h-[50px] bg-[#091d33] text-white border-0 rounded-xl text-[18px] font-semibold flex items-center justify-center gap-2 hover:bg-[#18a99c] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-5"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : done ? (
                  <>
                    <CheckCircle2 size={18} />
                    Password Reset!
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Reset Password
                  </>
                )}
              </button>

              {/* back-row — Back to login link */}
              <div className="text-center text-[16px] text-[#64748b]">
                <Link
                  to="/login"
                  className="text-[#091d33] font-semibold border-b-3 border-[#18a99c] pb-px hover:text-[#18a99c] transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={18} /> Back to login
                </Link>
              </div>

            </form>
          </div>
        </div>

      </div>
    </>
  );
};

export default ResetPassword;
