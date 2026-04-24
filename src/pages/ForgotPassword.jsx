import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  Mail, ArrowRight, ArrowLeft, Send, HelpCircle,
  ShieldCheck, ShieldOff, Key, CheckCircle2, Info,
  MessageSquare,
  BadgeQuestionMark,
} from "lucide-react";

// ══════════════════════════════════════════════════════════
//  PROGRESS DOTS  — active dot expands, done dot is teal
// ══════════════════════════════════════════════════════════
function ProgressDots({ step }) {
  // step: 1 | 2 | 3
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {[1, 2, 3].map((n) => {
        const done   = n < step;
        const active = n === step;
        return (
          <div
            key={n}
            className={`h-2 rounded-full transition-all duration-300 ${
              done   ? "w-2 bg-[#18a99c]" :
              active ? "w-6 bg-[#18a99c] rounded" :
              "w-2 bg-[#e2e8f0]"
            }`}
          />
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  MSG BOX — error / success inline message
// ══════════════════════════════════════════════════════════
function MsgBox({ msg, type = "error" }) {
  if (!msg) return null;
  return (
    <div className={`text-[13px] px-3.5 py-2.5 rounded-[10px] mb-4 leading-snug ${
      type === "error"
        ? "bg-[#fff5f5] border border-[#fecaca] text-[#991b1b]"
        : "bg-[#f0fdf4] border border-[#bbf7d0] text-[#166534]"
    }`}>
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  FIELD — label + icon input
// ══════════════════════════════════════════════════════════
function Field({ label, htmlFor, icon, error, children }) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-[7px] block">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none">{icon}</span>
        {children}
      </div>
      {error && <span className="text-[11px] text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SUBMIT BUTTON
// ══════════════════════════════════════════════════════════
function SubmitBtn({ loading, children, onClick, type = "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="w-full h-[50px] bg-[#091d33] text-white border-0 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 hover:bg-[#18a99c] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-1 mb-5"
    >
      {loading ? (
        <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Please wait...</>
      ) : children}
    </button>
  );
}

//  BACK LINK
function BackLink({ onClick, to, children }) {
  const cls = "text-[#091d33] font-semibold border-b-3 border-[#18a99c] pb-px p-3 hover:text-[#18a99c] transition-colors inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 rounded-xl font-[inherit] text-[14px]";
  if (to) return <div className="text-center text-[14px] text-[#64748b]"><Link to={to} className={cls}>{children}</Link></div>;
  return <div className="text-center text-[14px] text-[#64748b]"><button type="button" onClick={onClick} className={cls}>{children}</button></div>;
}

//  SUCCESS CARD
function SuccessCard({ icon: Icon, title, body }) {
  return (
    <div className="text-center py-6" style={{ animation: "fadeUp .4s ease both" }}>
      <div className="w-[72px] h-[72px] rounded-full bg-[#f0fdf4] border-2 border-[#bbf7d0] flex items-center justify-center mx-auto mb-5">
        <Icon size={30} className="text-[#16a34a]" />
      </div>
      <div className="text-[20px] font-bold text-[#091d33] mb-2.5">{title}</div>
      <div className="text-[13px] text-[#64748b] leading-[1.7] mb-7" dangerouslySetInnerHTML={{ __html: body }} />
      <BackLink to="/login"><ArrowLeft size={13} /> Back to login</BackLink>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
//  SKELETON LOADER (3 rows)
// ══════════════════════════════════════════════════════════
function QuestionSkeletons() {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      {[80, 65, 72].map((w, i) => (
        <div key={i} className="border-[1.5px] border-[rgba(9,29,51,0.12)] rounded-xl p-3.5 bg-[#f1f5f9] flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] rounded-lg flex-shrink-0"
            style={{ background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite" }} />
          <div className="h-3.5 rounded flex-1"
            style={{ width: `${w}%`, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.2s infinite" }} />
        </div>
      ))}
    </>
  );
}

// ══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════
const ForgotPassword = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────
  const [step,              setStep]              = useState(1);  // 1 | 2 | 3
  const [currentEmail,      setCurrentEmail]      = useState("");
  const [emailInput,        setEmailInput]        = useState("");
  const [emailError,        setEmailError]        = useState("");
  const [emailLoading,      setEmailLoading]      = useState(false);

  const [selectedMethod,    setSelectedMethod]    = useState("link"); // "link" | "question"
  const [methodMsg,         setMethodMsg]         = useState("");
  const [methodLoading,     setMethodLoading]     = useState(false);
  const [methodSuccess,     setMethodSuccess]     = useState(null); // { title, body }

  const [questions,         setQuestions]         = useState([]);   // [{ questionId, question }]
  const [questionsLoading,  setQuestionsLoading]  = useState(false);
  const [selectedQuestion,  setSelectedQuestion]  = useState(null); // { questionId, question }
  const [answer,            setAnswer]            = useState("");
  const [answerError,       setAnswerError]       = useState("");
  const [questionMsg,       setQuestionMsg]       = useState("");
  const [answerLoading,     setAnswerLoading]     = useState(false);
  const [questionSuccess,   setQuestionSuccess]   = useState(null); // { title, body }

  const answerRef = useRef(null);

  // Focus answer field when question selected
  useEffect(() => {
    if (selectedQuestion && answerRef.current) answerRef.current.focus();
  }, [selectedQuestion]);

  // ── STEP 1 — POST /auth/forgot-password ───────────────
  const submitEmail = async (e) => {
    e?.preventDefault();
    setEmailError("");

    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setEmailLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: emailInput.trim() }),
      });
      let data = {};
      try { data = await res.json(); } catch { }

      if (!res.ok) {
        const errMsg = data.message || data.error ||
          (res.status === 404 ? "No account found with this email address." :
           res.status === 400 ? "Invalid email address." :
           "Something went wrong. Please try again.");
        setEmailError(errMsg);
        return;
      }

      // Check body message for "not found" variants
      const bodyMsg = (data.message || "").toLowerCase();
      if (bodyMsg.includes("not found") || bodyMsg.includes("not registered") ||
          bodyMsg.includes("no account") || bodyMsg.includes("does not exist")) {
        setEmailError(data.message);
        return;
      }

      setCurrentEmail(emailInput.trim());
      setStep(2);

    } catch {
      setEmailError("Network error. Please check your connection.");
    } finally {
      setEmailLoading(false);
    }
  };

  // ── STEP 2 — Method selection ─────────────────────────
  const submitMethod = async () => {
    setMethodMsg("");

    if (selectedMethod === "link") {
      // POST /auth/send-resetlink
      setMethodLoading(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/auth/send-resetlink`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: currentEmail }),
        });
        let data = {};
        try { data = await res.json(); } catch { }

        if (!res.ok) {
          setMethodMsg(data.message || data.error || "Could not send reset email. Please try again.");
          return;
        }

        setMethodSuccess({
          title: "Check your inbox!",
          body: `We've sent a password reset link to<br><strong style="color:#091d33">${currentEmail}</strong>`,
        });

      } catch {
        setMethodMsg("Network error. Please check your connection.");
      } finally {
        setMethodLoading(false);
      }

    } else {
      // Security question — switch to step 3 and load questions
      setStep(3);
      setSelectedQuestion(null);
      setQuestions([]);
      setAnswer("");
      setAnswerError("");
      setQuestionMsg("");
      setQuestionSuccess(null);
      setQuestionsLoading(true);

      try {
        const res  = await fetch(`${API_BASE_URL}/auth/security-question/my`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ email: currentEmail }),
        });
        let data = {};
        try { data = await res.json(); } catch { }

        if (!res.ok) {
          setQuestionMsg(data.message || data.error || "Could not load your security questions. Please try again.");
          return;
        }

        const qs = Array.isArray(data)
          ? data
          : data.questions || data.securityQuestions || data.data || [];
        setQuestions(qs);

      } catch {
        setQuestionMsg("Network error. Could not load your security questions.");
      } finally {
        setQuestionsLoading(false);
      }
    }
  };

  // ── STEP 3 — POST /auth/verify-security-answer ────────
  const submitAnswer = async (e) => {
    e?.preventDefault();
    setQuestionMsg("");
    setAnswerError("");

    if (!selectedQuestion) {
      setQuestionMsg("Please select a security question.");
      return;
    }
    if (!answer.trim()) {
      setAnswerError("Please enter your answer.");
      return;
    }

    setAnswerLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/verify-security-answer`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          email:      currentEmail,
          questionId: selectedQuestion.questionId,
          answer:     answer.trim(),
        }),
      });
      let data = {};
      try { data = await res.json(); } catch { }

      if (!res.ok) {
        const errMsg = data.message || data.error ||
          (res.status === 401 ? "Incorrect answer. Please try again." :
           "Verification failed. Please try again.");
        setQuestionMsg(errMsg);
        return;
      }

      // API returns { resetToken: "..." }
      const resetToken = data.resetToken || data.token || data.passwordResetToken || "";

      if (resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
      } else {
        setQuestionSuccess({
          title: "Identity Verified!",
          body: data.message || "A password reset link has been sent to your email.",
        });
      }

    } catch {
      setQuestionMsg("Network error. Please check your connection.");
    } finally {
      setAnswerLoading(false);
    }
  };

  // 
  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div className="flex min-h-screen">

        {/*  LEFT PANEL  */}
        <div className="hidden lg:flex w-1/2 bg-[#091d33] flex-col justify-center px-14 py-16 relative overflow-hidden">

          {/* Teal rings */}
          <div className="absolute w-[360px] h-[360px] rounded-full border border-[#18a99c]/[0.12] -top-20 -right-24 pointer-events-none" />
          <div className="absolute w-[200px] h-[200px] rounded-full bg-[#18a99c]/[0.06] -bottom-10 -left-12 pointer-events-none" />

          <div className="relative z-10">
            {/* Shield icon box */}
            <div className="w-20 h-20 rounded-[20px] bg-[#18a99c]/[0.12] border border-[#18a99c]/20 flex items-center justify-center mb-7">
              <ShieldOff size={36} className="text-[#18a99c]" />
            </div>

            {/* Headline */}
            <h1 className="text-white font-bold leading-[1.2] tracking-[-0.8px] mb-4" style={{ fontSize: "clamp(28px, 2.8vw, 40px)" }}>
              Secure your<br />account with a<br />
              <em className="not-italic text-[#18a99c]">new password</em>
            </h1>

            {/* Sub */}
            <p className="text-white/45 text-[14px] leading-[1.75] max-w-[300px] mb-11">
              We take your account security seriously. Choose a recovery method that suits you best.
            </p>

            {/* Steps */}
            <div className="flex flex-col gap-[18px]">
              {[
                { icon: <Mail size={15} className="text-[#18a99c]" />,       title: "Enter your email",    desc: "We'll look up your account"             },
                { icon: <CheckCircle2 size={15} className="text-[#18a99c]" />, title: "Choose a method",    desc: "Reset link or security question"        },
                { icon: <Key size={15} className="text-[#18a99c]" />,         title: "Set a new password", desc: "Choose something strong and unique"     },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="text-white/85 text-[13px] font-medium leading-none mb-0.5">{title}</div>
                    <div className="text-white/55 text-[13px] leading-[1.4]">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — white bg, max-w-[420px] inner  */}
        <div className="flex-1 bg-white flex flex-col justify-center px-16 py-16">
          <div className="max-w-[500px] w-full mx-auto" style={{ animation: "fadeUp .4s ease both" }}>

            {/* ══ STEP 1 — Email ══ */}
            {step === 1 && (
              <div style={{ animation: "fadeUp .4s ease both" }}>
                <ProgressDots step={1} />
                <div className="text-[12px] font-bold tracking-[2px] uppercase text-[#18a99c] mb-2.5">Step 1 of 3 · Password recovery</div>
                <h2 className="text-[26px] font-bold text-[#091d33] tracking-[-0.5px] mb-2">Forgot your password?</h2>
                <p className="text-[14px] text-[#64748b] leading-[1.6] mb-7">Enter your registered email address to get started.</p>

                <MsgBox msg={emailError} type="error" />

                <form onSubmit={submitEmail} autoComplete="off" noValidate>
                  <Field label="Email Address" htmlFor="email" icon={<Mail size={14} />}>
                    <input
                      type="email" id="email" value={emailInput}
                      onChange={(e) => { setEmailInput(e.target.value); setEmailError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") submitEmail(); }}
                      placeholder="you@example.com" autoComplete="email"
                      className={`w-full h-[48px] border-[1.5px] rounded-xl pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#18a99c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,169,156,0.10)] transition-all ${emailError ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"}`}
                    />
                  </Field>

                  <SubmitBtn loading={emailLoading}>
                    <ArrowRight size={16} /> Continue
                  </SubmitBtn>
                </form>

                <BackLink to="/login"><ArrowLeft size={13} /> Back to login</BackLink>
              </div>
            )}

            {/* ══ STEP 2 — Choose Method ══ */}
            {step === 2 && (
              <div style={{ animation: "fadeUp .4s ease both" }}>
                {methodSuccess ? (
                  <SuccessCard icon={CheckCircle2} title={methodSuccess.title} body={methodSuccess.body} />
                ) : (
                  <>
                    <ProgressDots step={2} />
                    <div className="text-[12px] font-bold tracking-[2px] uppercase text-[#18a99c] mb-2.5">Step 2 of 3 · Choose method</div>
                    <h2 className="text-[26px] font-bold text-[#091d33] tracking-[-0.5px] mb-2">How to recover?</h2>
                    <p className="text-[14px] text-[#64748b] leading-[1.6] mb-8">Select how you'd like to verify your identity.</p>

                    {/* Email badge */}
                    <div className="inline-flex items-center gap-1.5 bg-[#18a99c]/[0.08] border border-[#18a99c]/20 rounded-[20px] px-3 py-1 text-[12px] font-medium text-[#091d33] mb-5">
                      <CheckCircle2 size={14} className="text-[#18a99c]" />
                      {currentEmail}
                    </div>

                    <MsgBox msg={methodMsg} type="error" />

                    {/* Method cards — 2-col grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {[
                        { id: "link",     icon: <Send size={28} />,       name: "Reset Link",       desc: "We'll email you a secure reset link" },
                        { id: "question", icon: <BadgeQuestionMark size={28} />, name: "Security Question", desc: "Answer your secret security question" },
                      ].map(({ id, icon, name, desc }) => {
                        const active = selectedMethod === id;
                        return (
                          <div
                            key={id}
                            onClick={() => setSelectedMethod(id)}
                            className={`border-3 rounded-[14px] px-3.5 py-8 cursor-pointer transition-all text-center select-none relative hover:-translate-y-px ${
                              active
                                ? "border-[#18a99c] bg-[#18a99c]/[0.07]"
                                : "border-[rgba(9,29,51,0.12)] bg-[#f1f5f9] hover:border-[#18a99c]/40 hover:bg-[#18a99c]/[0.04]"
                            }`}
                          >
                            {active && (
                              <CheckCircle2 size={14} className="text-[#18a99c] absolute top-2.5 right-3" />
                            )}
                            <div className={`flex justify-center mb-2.5 transition-colors ${active ? "text-[#18a99c]" : "text-[#64748b]"}`}>
                              {icon}
                            </div>
                            <div className="text-[18px] font-semibold text-[#091d33] mb-1">{name}</div>
                            <div className="text-[12px] text-[#64748b] leading-[1.4]">{desc}</div>
                          </div>
                        );
                      })}
                    </div>

                    <SubmitBtn loading={methodLoading} onClick={submitMethod} type="button">
                      <ArrowRight size={16} /> Continue
                    </SubmitBtn>

                    <BackLink onClick={() => setStep(1)}><ArrowLeft size={13} /> Back</BackLink>
                  </>
                )}
              </div>
            )}

            {/* ══ STEP 3 — Security Question ══ */}
            {step === 3 && (
              <div style={{ animation: "fadeUp .4s ease both" }}>
                {questionSuccess ? (
                  <SuccessCard icon={ShieldCheck} title={questionSuccess.title} body={questionSuccess.body} />
                ) : (
                  <>
                    <ProgressDots step={3} />
                    <div className="text-[12px] font-semibold tracking-[2px] uppercase text-[#18a99c] mb-2.5">Step 3 of 3 · Verify identity</div>
                    <h2 className="text-[26px] font-bold text-[#091d33] tracking-[-0.5px] mb-2">Answer a question</h2>
                    <p className="text-[14px] text-[#64748b] leading-[1.6] mb-7">
                      Pick one of your security questions and type your answer below.
                    </p>

                    <MsgBox msg={questionMsg} type="error" />

                    {/* Question list */}
                    <span className="text-[12px] font-medium text-[#091d33] tracking-[0.3px] mb-2.5 block">
                      Choose a security question
                    </span>

                    <div className="flex flex-col gap-2 mb-5">
                      {questionsLoading ? (
                        <QuestionSkeletons />
                      ) : questions.length === 0 && !questionsLoading ? (
                        <p className="text-[13px] text-[#64748b] py-2">No security questions found for this account.</p>
                      ) : questions.map((q, i) => {
                        const sel = selectedQuestion?.questionId === q.questionId;
                        return (
                          <div
                            key={q.questionId ?? i}
                            onClick={() => {
                              setSelectedQuestion(q);
                              setAnswer("");
                              setAnswerError("");
                              setQuestionMsg("");
                            }}
                            className={`border-[1.5px] rounded-xl p-3 flex items-start gap-2.5 cursor-pointer select-none transition-all relative hover:-translate-y-px ${
                              sel
                                ? "border-[#18a99c] bg-[#18a99c]/[0.07]"
                                : "border-[rgba(9,29,51,0.12)] bg-[#f1f5f9] hover:border-[#18a99c]/40 hover:bg-[#18a99c]/[0.04]"
                            }`}
                          >
                            {sel && (
                              <CheckCircle2 size={14} className="text-[#18a99c] absolute top-2.5 right-3" />
                            )}
                            {/* Question icon box */}
                            <div className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                              sel ? "bg-[#18a99c]/15 text-[#18a99c]" : "bg-[rgba(9,29,51,0.06)] text-[#64748b]"
                            }`}>
                              <HelpCircle size={13} />
                            </div>
                            <div className="text-[13px] font-medium text-[#091d33] leading-[1.45] pr-5">
                              {q.question}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Answer field — shown only after question selected */}
                    {selectedQuestion && (
                      <div style={{ animation: "fadeUp .3s ease both" }}>
                        {/* Info hint */}
                        <div className="flex items-center gap-1.5 text-[12px] text-[#64748b] bg-[#f1f5f9] border border-[rgba(9,29,51,0.12)] rounded-lg px-3 py-2 mb-[18px]">
                          <Info size={13} className="text-[#18a99c] flex-shrink-0" />
                          Answers are not case-sensitive.
                        </div>

                        <form onSubmit={submitAnswer} autoComplete="off" noValidate>
                          <Field label="Your Answer" htmlFor="securityAnswer" icon={<MessageSquare size={14} />} error={answerError}>
                            <input
                              ref={answerRef}
                              type="text"
                              id="securityAnswer"
                              value={answer}
                              onChange={(e) => { setAnswer(e.target.value); setAnswerError(""); }}
                              onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(); }}
                              placeholder="Type your answer"
                              autoComplete="off"
                              className={`w-full h-[48px] border-[1.5px] rounded-xl pl-10 pr-4 text-[14px] text-[#091d33] bg-[#f1f5f9] placeholder-[#b0bac6] outline-none focus:border-[#18a99c] focus:bg-white focus:shadow-[0_0_0_3px_rgba(24,169,156,0.10)] transition-all ${answerError ? "border-red-400" : "border-[rgba(9,29,51,0.12)]"}`}
                            />
                          </Field>

                          <SubmitBtn loading={answerLoading}>
                            <ShieldCheck size={16} /> Verify &amp; Reset Password
                          </SubmitBtn>
                        </form>
                      </div>
                    )}

                    <BackLink onClick={() => { setStep(2); setSelectedQuestion(null); setAnswer(""); }}>
                      <ArrowLeft size={13} /> Back
                    </BackLink>
                  </>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </>
  );
};

export default ForgotPassword;
