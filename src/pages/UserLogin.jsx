import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import rojgar_shine_logo from "../assets/images/Rojgarshine White Logo-01.png"
import { SquareArrowRightEnter } from "lucide-react";

// ── Animated counter hook ──────────────────────────────────
function useAnimatedCount(target, duration = 1300) {
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (!target || target <= 0) { setDisplay("0"); return; }
    const steps = 45;
    const stepTime = duration / steps;
    let cur = 0;
    const fmt = (n) => {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M+";
      if (n >= 1_000)     return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K+";
      return n + "+";
    };
    const timer = setInterval(() => {
      cur += target / steps;
      if (cur >= target) { clearInterval(timer); setDisplay(fmt(target)); }
      else setDisplay(fmt(Math.floor(cur)));
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return display;
}

// ── Stat item ─────────────────────────────────────────────
function StatItem({ value, label }) {
  const display = useAnimatedCount(value);
  return (
    <div>
      <div className="text-[26px] font-bold text-white leading-none">{display}</div>
      <div className="text-[12px] text-white/40 mt-1 tracking-wide">{label}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
const UserLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm]         = useState({ usernameOrEmail: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true); // checking existing session
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [stats, setStats]       = useState({ jobs: 0, companies: 0, seekers: 0 });

  // ── Check existing session on mount ─────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const user = await res.json();
          login(user.token ?? "", user);
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (_) { /* no session */ }
      setChecking(false);
    })();
  }, []);

  // ── Load live stats for left panel ──────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/public/jobcompanyjobseeker`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStats({ jobs: d.activeJobs, companies: d.totalCompanies, seekers: d.totalJobSeekers });
      })
      .catch(() => {});
  }, []);

  // ── BFCache guard ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.persisted) {
        fetch(`${API_BASE_URL}/auth/me`, { method: "GET", credentials: "include" })
          .then((r) => r.ok ? r.json() : null)
          .then((user) => { if (user) navigate("/dashboard", { replace: true }); })
          .catch(() => {});
      }
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usernameOrEmail || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usernameOrEmail: form.usernameOrEmail, password: form.password }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setError("Server returned an unexpected response.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid username or password.");
        return;
      }

      // Role guard — only JOB_SEEKER may use this page
      if (data.role && data.role !== "JOB_SEEKER") {
        // Silently logout server-side
        await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
        if (data.role === "ADMIN" || data.role === "SUB_ADMIN") {
          setError("Invalid username/email or password.");
        } else {
          setError(`You are registered as a Recruiter. Please use the Recruiter login page.`);
        }
        return;
      }

      login(data.token ?? "", data);

      const returnUrl = sessionStorage.getItem("redirectAfterLogin");
      if (returnUrl) { sessionStorage.removeItem("redirectAfterLogin"); navigate(returnUrl, { replace: true }); return; }

      const redirect = searchParams.get("return");
      navigate(redirect || "/dashboard", { replace: true });

    } catch (err) {
      if (err.name === "TypeError") setError("Cannot reach server — check your connection.");
      else setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── While session-check in flight, show nothing (or spinner) ─
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="w-8 h-8 border-4 border-[#091d33] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className="hidden lg:flex w-1/2 bg-[#091d33] flex-col justify-start px-14 py-16 relative overflow-hidden">

        {/* Decorative rings */}
        <div className="absolute w-[420px] h-[420px] rounded-full border border-[#18a99c]/15 -top-24 -right-24 pointer-events-none" />
        <div className="absolute w-[260px] h-[260px] rounded-full bg-[#18a99c]/[0.06] -bottom-16 -left-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">

          {/* Logo */}
          <a href="/" className="mb-8 block">
            <img
              src={rojgar_shine_logo}
              alt="RojgarShine"
              className="h-[100px] w-auto object-contain"
            />
          </a>

          {/* Headline */}
          <h1 className="text-white font-semibold leading-[1.15] tracking-tight mb-5 px-12"
              style={{ fontSize: "clamp(32px, 3.5vw, 48px)" }}>
            Your next<br />
            <em className="not-italic text-[#18a99c]">big opportunity</em><br />
            starts here.
          </h1>

          {/* Sub */}
          <p className="text-white/50 text-[15px] leading-relaxed max-w-[340px] mb-12 px-12">
            Thousands of verified jobs, top companies, and the tools to get you hired — fast.
          </p>

          {/* Stats */}
          <div className="flex items-stretch gap-8 px-12">
            <StatItem value={stats.jobs}      label="Live Jobs"    />
            <div className="w-px bg-white/10 self-stretch" />
            <StatItem value={stats.companies} label="Companies"    />
            <div className="w-px bg-white/10 self-stretch" />
            <StatItem value={stats.seekers}   label="Job Seekers"  />
          </div>

        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <div className="flex-1 bg-[#ffffff] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">

          <p className="text-[#18a99c] text-xs font-bold uppercase tracking-widest mb-2">
            Welcome back
          </p>
          <h2 className="text-[#091d33] text-[28px] font-bold leading-tight tracking-tight mb-1">
            Sign in to your account
          </h2>
          <p className="text-[#64748b] text-sm mb-8">Enter your credentials to continue</p>

          {/* Error */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 leading-snug"
              dangerouslySetInnerHTML={{ __html: error }}
            />
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">

            {/* Email / Username */}
            <div>
              <label htmlFor="usernameOrEmail" className="block text-[13px] font-medium text-black/80 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  value={form.usernameOrEmail}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-[rgba(9,29,51,0.12)] rounded-xl text-sm text-[#091d33] bg-white placeholder-[#94a3b8] outline-none focus:border-[#18a99c] focus:ring-2 focus:ring-[#18a99c]/15 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-black/80 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </span>
                <input
                  type={showPwd ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 border border-[rgba(9,29,51,0.12)] rounded-xl text-sm text-[#091d33] bg-white placeholder-[#94a3b8] outline-none focus:border-[#18a99c] focus:ring-2 focus:ring-[#18a99c]/15 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors"
                  tabIndex={-1}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="flex justify-start -mt-1">
              <Link to="/forgot-password" className="text-[13px] text-[#18a99c] font-medium hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || checking}
              className="w-full h-[50px] bg-[#091d33] text-white rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#18a99c] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <div className="flex items-center gap-1">
                  <SquareArrowRightEnter size={16}/>
                  Sign In
                </div>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(9,29,51,0.12)]" />
            <span className="text-[12px] text-[#b0bac6] whitespace-nowrap">Don't have an account?</span>
            <div className="flex-1 h-px bg-[rgba(9,29,51,0.12)]" />
          </div>

          {/* Register */}
          <div className="text-center text-sm text-[#64748b]">
            <Link
              to="/register"
              className="text-[#091d33] font-semibold border-b-2 border-[#18a99c] pb-px hover:text-[#18a99c] transition-colors"
            >
              Create a free account →
            </Link>
          </div>

          {/* Recruiter link */}
          <div className="text-center mt-4">
            <Link
              to="/recruiter/login"
              className="text-[13px] text-[#64748b] inline-flex items-center gap-1.5 hover:text-[#18a99c] transition-colors"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Sign in as Recruiter
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserLogin;
