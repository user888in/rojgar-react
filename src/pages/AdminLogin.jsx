import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import rojgar_shine_logo from "../assets/images/Rojgarshine White Logo-01.png"

import {
  ShieldCheck,
  ShieldOff,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

// ── Animated counter (same as UserLogin / RecruiterLogin) ──
function useAnimatedCount(target, duration = 1300) {
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (!target || target <= 0) {
      setDisplay("0");
      return;
    }
    const fmt = (n) => {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M+";
      if (n >= 1_000)
        return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K+";
      return n + "+";
    };
    const steps = 45,
      stepTime = duration / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += target / steps;
      if (cur >= target) {
        clearInterval(timer);
        setDisplay(fmt(target));
      } else setDisplay(fmt(Math.floor(cur)));
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return display;
}

function StatItem({ value, label }) {
  const display = useAnimatedCount(value);
  return (
    <div>
      <div className="text-[26px] font-bold text-white leading-none">
        {display}
      </div>
      <div className="text-[12px] text-white/40 mt-1 tracking-wide">
        {label}
      </div>
    </div>
  );
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    jobs: 0,
    recruiters: 0,
    seekers: 0,
    companies: 0,
  });

  // ── Check existing session ─────────────────────────────
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
          if (user.role === "ADMIN" || user.role === "SUB_ADMIN") {
            login(user.token ?? "", user);
            navigate("/admin/dashboard", { replace: true });
            return;
          }
        }
      } catch (_) {}
      setChecking(false);
    })();
  }, []);

  // ── Load stats — both endpoints exactly like login.html ──
  useEffect(() => {
    Promise.allSettled([
      fetch(`${API_BASE_URL}/public/jobcompanyjobseeker`).then((r) =>
        r.ok ? r.json() : null,
      ),
      fetch(`${API_BASE_URL}/public/alljobsrecruiterusers`).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([res1, res2]) => {
        const d1 = res1.status === "fulfilled" ? res1.value : null;
        const d2 = res2.status === "fulfilled" ? res2.value : null;
        setStats({
          jobs: d1?.activeJobs ?? 0,
          recruiters: d2?.recruiters ?? 0,
          seekers: d1?.totalJobSeekers ?? 0,
          companies: d1?.totalCompanies ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  // ── BFCache guard ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.persisted) {
        fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((user) => {
            if (user?.role === "ADMIN" || user?.role === "SUB_ADMIN")
              navigate("/admin/dashboard", { replace: true });
          })
          .catch(() => {});
      }
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Submit ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
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
        body: JSON.stringify({
          usernameOrEmail: form.email.trim(), // admin page uses email field, mapped to usernameOrEmail
          password: form.password, // NOT trimmed
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        setError("Server returned an unexpected response.");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      const actualRole = data.role;

      // ── Role guard — only ADMIN / SUB_ADMIN may use this page ──
      const isAdminRole = actualRole === "ADMIN" || actualRole === "SUB_ADMIN";
      if (!isAdminRole) {
        // Silent server-side logout
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});

        // Generic error — never reveal which credentials are valid
        setError("Invalid credentials.");
        return;
      }

      login(data.accessToken ?? "", data);

      const returnUrl = sessionStorage.getItem("redirectAfterLogin");
      if (returnUrl) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(returnUrl, { replace: true });
        return;
      }
      navigate(searchParams.get("return") || "/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      if (err.name === "TypeError")
        setError("Cannot reach server — check your connection.");
      else setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Session check spinner ──────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
        <div className="w-8 h-8 border-4 border-[#091d33] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div className="flex min-h-screen">
        {/* ════════ LEFT PANEL — teal rings ════════ */}
        <div className="hidden lg:flex w-1/2 bg-[#091d33] flex-col justify-start px-14 py-16 relative overflow-hidden">
          {/* Teal decorative rings — mirrors .login-left.teal-rings */}
          <div className="absolute w-[420px] h-[420px] rounded-full border border-[#18a99c]/15 -top-24 -right-24 pointer-events-none" />
          <div className="absolute w-[260px] h-[260px] rounded-full bg-[#18a99c]/[0.06] -bottom-14 -left-14 pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <a href="/" className="block mb-8">
              <img
                src={rojgar_shine_logo}
                alt="RojgarShine"
                className="h-[100px] w-auto object-contain"
              />
            </a>

            {/* Headline — teal em */}
            <h1
              className="text-white  leading-[1.15] tracking-tight mb-5 ps-12"
              style={{ fontSize: "clamp(32px, 3.5vw, 48px)" }}
            >
              Admin
              <br />
              <em className="not-italic text-[#18a99c]">Control Center</em>
              <br />
              for RojgarShine.
            </h1>

            {/* Sub */}
            <p className="text-white/50 text-[15px] leading-relaxed max-w-[320px] mb-12 ps-12">
              Manage jobs, recruiters, users, and platform settings — all from
              one secure dashboard.
            </p>

            {/* 4 stats: Total Jobs | Recruiters | Job Seekers | Companies */}
            <div className="flex items-stretch gap-7 ps-12">
              <StatItem value={stats.jobs} label="Total Jobs" />
              <div className="w-px bg-white/10 self-stretch" />
              <StatItem value={stats.recruiters} label="Recruiters" />
              <div className="w-px bg-white/10 self-stretch" />
              <StatItem value={stats.seekers} label="Job Seekers" />
              <div className="w-px bg-white/10 self-stretch" />
              <StatItem value={stats.companies} label="Companies" />
            </div>
          </div>
        </div>

        {/*  RIGHT PANEL — white bg, max-w-[380px] inner  */}
        <div className="flex-1 bg-white flex flex-col justify-center px-16 py-16 relative">
          <div
            className="max-w-[380px] w-full mx-auto"
            style={{ animation: "fadeUp .5s ease both" }}
          >
            {/* Eyebrow — teal */}
            <div className="text-[11px] font-bold tracking-[2.5px] uppercase text-[#18a99c] mb-1">
              Restricted Access
            </div>

            {/* Title */}
            <h2 className="text-[30px] font-bold text-[#091d33] tracking-[-0.5px] mb-1.5">
              Admin Sign In
            </h2>

            {/* Sub */}
            <p className="text-[14px] text-[#64748b] mb-10">
              Enter your admin credentials to continue
            </p>

            {/* Admin badge — teal pill, matches .admin-badge */}
            <div className="inline-flex items-center gap-1.5 bg-[#18a99c]/10 border border-[#18a99c]/25 rounded-[20px] px-3.5 py-[5px] text-[12px] font-semibold text-[#18a99c] mb-7">
              <ShieldOff size={13} />
              Admin &amp; Sub-Admin Access Only
            </div>

            {/* Error */}
            {error && (
              <div
                className="text-[13px] px-3.5 py-2.5 rounded-[10px] mb-5 bg-[#fff5f5] border border-[#fecaca] text-[#991b1b] leading-snug"
                dangerouslySetInnerHTML={{ __html: error }}
              />
            )}

            <form id="loginForm" onSubmit={handleSubmit} autoComplete="off">
              {/* Email — admin uses email field, not username */}
              <div className="flex flex-col mb-5">
                <label
                  htmlFor="email"
                  className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px]"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="Admin Email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        e.currentTarget.form.requestSubmit();
                    }}
                    className="w-full h-[48px] border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#18a99c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,169,156,0.10)] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col mb-5">
                <label
                  htmlFor="password"
                  className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px]"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                    <Lock size={14} />
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        e.currentTarget.form.requestSubmit();
                    }}
                    className="w-full h-[48px] border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl pl-10 pr-12 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#18a99c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,169,156,0.10)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#091d33] transition-colors p-1 flex items-center"
                  >
                    {showPwd ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              {/* field-options — forgot link on the right */}
              <div className="flex justify-start mb-7">
                <Link
                  to="/forgot-password"
                  className="text-[13px] font-medium text-[#18a99c] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit — teal hover, shield icon */}
              <button
                type="submit"
                id="loginBtn"
                disabled={loading}
                className="w-full h-[50px] bg-[#091d33] text-white border-0 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#18a99c] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-5"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Sign In Securely
                  </>
                )}
              </button>
            </form>

            {/* back-row — back to main site */}
            <div className="text-center mt-3.5">
              <Link
                to="/"
                className="text-[13px] text-[#64748b] inline-flex items-center gap-1.5 hover:text-[#18a99c] transition-colors"
              >
                <ArrowLeft size={13} />
                Back to main site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
