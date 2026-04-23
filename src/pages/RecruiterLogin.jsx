import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api"
import rojgar_shine_logo from "../assets/images/Rojgarshine White Logo-01.png"

import {
  LogIn,
  User,
  Lock,
  Eye,
  EyeOff,
  Building2,
  UserCheck,
  BriefcaseBusiness,
  Users,
  TrendingUp,
} from "lucide-react";

// ── Animated counter 
function useAnimatedCount(target, duration = 1300) {
  const [display, setDisplay] = useState("—");
  useEffect(() => {
    if (!target || target <= 0) { setDisplay("0"); return; }
    const fmt = (n) => {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M+";
      if (n >= 1_000)     return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + "K+";
      return n + "+";
    };
    const steps = 45, stepTime = duration / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += target / steps;
      if (cur >= target) { clearInterval(timer); setDisplay(fmt(target)); }
      else setDisplay(fmt(Math.floor(cur)));
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return display;
}

function StatItem({ value, label }) {
  const display = useAnimatedCount(value);
  return (
    <div>
      <div className="text-[26px] font-bold text-white leading-none">{display}</div>
      <div className="text-[12px] text-white/40 mt-1 tracking-wide">{label}</div>
    </div>
  );
}

// 
const RecruiterLogin = () => {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { login }      = useAuth();

  const [form,     setForm]     = useState({ usernameOrEmail: "", password: "" });
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState("");
  const [stats,    setStats]    = useState({
    candidates: 0, companies: 0, jobs: 0, recruiters: 0,
  });
  const getSessionToken = (user) => user?.accessToken || user?.token || "";

  // ── Check existing session
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET", credentials: "include",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const user = await res.json();
          const sessionToken = getSessionToken(user);
          if (user && user.role === "RECRUITER" && sessionToken) {
            login(sessionToken, user);
            navigate("/recruiter/dashboard", { replace: true });
            return;
          }
        }
      } catch (_) {}
      setChecking(false);
    })();

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [login, navigate]);

  // ── Load stats — both endpoints like original loginForm.html ──
  useEffect(() => {
    Promise.allSettled([
      fetch(`${API_BASE_URL}/public/jobcompanyjobseeker`).then(r => r.ok ? r.json() : null),
      fetch(`${API_BASE_URL}/public/alljobsrecruiterusers`).then(r => r.ok ? r.json() : null),
    ]).then(([res1, res2]) => {
      const d1 = res1.status === "fulfilled" ? res1.value : null;
      const d2 = res2.status === "fulfilled" ? res2.value : null;
      setStats({
        candidates : d1?.totalJobSeekers  ?? 0,
        companies  : d1?.totalCompanies   ?? 0,
        jobs       : d1?.activeJobs       ?? 0,
        recruiters : d2?.recruiters       ?? 0,
      });
    }).catch(() => {});
  }, []);

  // ── BFCache guard 
  useEffect(() => {
    const handler = (e) => {
      if (e.persisted) {
        fetch(`${API_BASE_URL}/auth/me`, { method: "GET", credentials: "include" })
          .then(r => r.ok ? r.json() : null)
          .then(user => {
            const sessionToken = getSessionToken(user);
            if (user?.role === "RECRUITER" && sessionToken) {
              login(sessionToken, user);
              navigate("/recruiter/dashboard", { replace: true });
            }
          })
          .catch(() => {});
      }
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, [login, navigate]);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Submit 
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
        body: JSON.stringify({
          usernameOrEmail: form.usernameOrEmail.trim(),
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
        setError(data.message || "Invalid username or password.");
        return;
      }

      const actualRole = data.role;

      if (actualRole !== "RECRUITER") {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST", credentials: "include",
        }).catch(() => {});

        if (actualRole === "ADMIN" || actualRole === "SUB_ADMIN") {
          setError("Invalid username/email or password.");
        } else {
          setError(
            `You are trying to log in as a <strong>Job Seeker</strong>, but this page is for <strong>Recruiter</strong>s. Please use the correct login page.`
          );
        }
        return;
      }

      login(data.accessToken ?? "", data);

      const returnUrl = sessionStorage.getItem("redirectAfterLogin");
      if (returnUrl) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(returnUrl, { replace: true });
        return;
      }
      navigate(searchParams.get("return") || "/recruiter/dashboard", { replace: true });

    } catch (err) {
      if (err.name === "TypeError") setError("Cannot reach server — check your connection.");
      else setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div className="flex min-h-screen">

        {/* LEFT PANEL  */}
        <div className="hidden lg:flex w-1/2 bg-[#091d33] flex-col justify-start px-14 py-16 relative overflow-hidden">

          {/* Amber rings */}
          <div className="absolute w-[400px] h-[400px] rounded-full border border-[#f59e0b]/[0.12] -top-24 -right-28 pointer-events-none" />
          <div className="absolute w-[240px] h-[240px] rounded-full bg-[#f59e0b]/[0.05] -bottom-16 -left-16 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">

            {/* ── Logo + badge on same row ── */}
            <div className="flex items-center gap-2 mb-8">
              <a href="/recruiter" className="flex-shrink-0">
                <img
                  src={rojgar_shine_logo}
                  alt="RojgarShine"
                  className="h-[100px] w-auto object-contain"
                />
              </a>
              <div className="inline-flex items-center gap-1.5 bg-[#f59e0b]/[0.12] border border-[#f59e0b]/25 rounded-full px-3.5 py-1.5 mt-5">
                <Building2 size={11} className="text-[#f59e0b] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#f59e0b] uppercase tracking-[0.8px] whitespace-nowrap">
                  Recruiter Portal
                </span>
              </div>
            </div>

            {/* ── Headline — amber em ── */}
            <h1
              className="text-white  leading-[1.15] tracking-tight mb-5 ps-12"
              style={{ fontSize: "clamp(32px, 3.5vw, 48px)" }}
            >
              Hire smarter.<br />
              Build your<br />
              <em className="not-italic text-[#f59e0b]">dream team.</em>
            </h1>

            {/* ── Sub ── */}
            <p className="text-white/50 text-[15px] leading-relaxed max-w-[340px] mb-12 ps-12">
              Access your recruiter dashboard, post jobs, and connect with thousands of qualified candidates.
            </p>

            {/* ── 4 stats: Candidates | Companies | Jobs | Recruiters ── */}
            <div className="flex items-stretch gap-7 ps-12 mb-12">
              <StatItem value={stats.candidates} label="Candidates"  />
              <div className="w-px bg-white/10 self-stretch" />
              <StatItem value={stats.companies}  label="Companies"   />
              <div className="w-px bg-white/10 self-stretch" />
              <StatItem value={stats.jobs}        label="Jobs"        />
              <div className="w-px bg-white/10 self-stretch" />
              <StatItem value={stats.recruiters}  label="Recruiters"  />
            </div>

            {/* ── 3 feature lines with amber icon boxes ── */}
            <div className="flex flex-col gap-3.5 ps-12">
              {[
                { icon: <BriefcaseBusiness size={13} />, text: "Post unlimited job openings"         },
                { icon: <Users            size={13} />, text: "Review and manage applicants easily"  },
                { icon: <TrendingUp       size={13} />, text: "Track hiring performance in real time" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-[13px] text-white/55">
                  <div className="w-[30px] h-[30px] rounded-lg bg-[#f59e0b]/[0.10] border border-[#f59e0b]/20 flex items-center justify-center text-[#f59e0b] flex-shrink-0">
                    {icon}
                  </div>
                  {text}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT PANEL  */}
        <div className="relative flex-1 bg-white flex flex-col justify-center px-16 py-16">
          {checking && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#091d33] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <div className="max-w-[380px] w-full mx-auto" style={{ animation: "fadeUp .5s ease both" }}>

            {/* ── Role switcher AT THE TOP — before eyebrow ── */}
            <div className="flex bg-[#f1f5f9] rounded-[10px] p-1 gap-1 mb-8">
              {/* Job Seeker — inactive tab */}
              <Link
                to="/login"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-medium text-[#64748b] hover:text-[#091d33] transition-all no-underline"
              >
                <UserCheck size={14} />
                Job Seeker
              </Link>
              {/* Recruiter — active tab */}
              <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[13px] font-medium bg-white text-[#091d33] shadow-[0_1px_4px_rgba(0,0,0,0.08)] cursor-default select-none">
                <Building2 size={14} />
                Recruiter
              </div>
            </div>

            {/* ── Eyebrow — amber, "RECRUITER ACCESS" ── */}
            <div className="text-[11px] font-bold tracking-[2px] uppercase text-[#f59e0b] mb-2.5">
              Recruiter Access
            </div>

            {/* ── Title ── */}
            <h2 className="text-[30px] font-bold text-[#091d33] tracking-[-0.5px] mb-1.5">
              Welcome back
            </h2>

            {/* ── Sub ── */}
            <p className="text-[14px] text-[#64748b] mb-9">
              Sign in to your recruiter account to manage jobs and candidates.
            </p>

            {/* ── Error ── */}
            {error && (
              <div
                className="text-[13px] px-3.5 py-2.5 rounded-[10px] mb-5 bg-[#fff5f5] border border-[#fecaca] text-[#991b1b] leading-snug"
                dangerouslySetInnerHTML={{ __html: error }}
              />
            )}

            <form id="loginForm" onSubmit={handleSubmit} autoComplete="off">

              {/* Email / Username */}
              <div className="flex flex-col mb-5">
                <label htmlFor="usernameOrEmail" className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px]">
                  Email or Username
                </label>
                <div className="relative">
                  <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    value={form.usernameOrEmail}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    placeholder="recruiter@company.com"
                    className="w-full h-[48px] border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col mb-5">
                <label htmlFor="password" className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px]">
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
                    className="w-full h-[48px] border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl pl-10 pr-12 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#f59e0b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.10)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
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
                  className="text-[13px] font-medium text-[#f59e0b] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="loginBtn"
                disabled={loading}
                className="w-full h-[50px] bg-[#091d33] text-white border-0 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#d97706] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mb-5"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </button>

              {/* or-divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-[rgba(9,29,51,0.12)]" />
                <span className="text-[12px] text-[#b0bac6] whitespace-nowrap">Don't have a recruiter account?</span>
                <div className="flex-1 h-px bg-[rgba(9,29,51,0.12)]" />
              </div>

              {/* register-row */}
              <div className="text-center text-[14px] text-[#64748b] mb-3.5">
                <Link
                  to="/recruiter/register"
                  className="text-[#091d33] font-semibold border-b-2 border-[#f59e0b] pb-px hover:text-[#d97706] transition-colors"
                >
                  Register your company →
                </Link>
              </div>

              {/* seeker-row */}
              <div className="text-center mt-3.5">
                <Link
                  to="/login"
                  className="text-[13px] text-[#64748b] inline-flex items-center gap-1.5 hover:text-[#f59e0b] transition-colors"
                >
                  <UserCheck size={13} />
                  Looking for a job? Sign in as Job Seeker
                </Link>
              </div>

            </form>
          </div>
        </div>

      </div>
    </>
  );
};

export default RecruiterLogin;
