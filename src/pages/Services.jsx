import {
  MapPin,
  Compass,
  Grid,
  Search,
  UserCheck,
  Building,
  TrendingUp,
  Bell,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Mail,
} from "lucide-react";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import services_hero from "../assets/images/hero-services.jpg";
import EyebrowBadge from "../components/ui/EyebrowBadge";
import SectionTag from "../components/ui/SectionTag";

const Services = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    agree: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "", message: "" });
  const toastTimeoutRef = useRef(null);

  const showToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ show: false, type: "", message: "" });
    }, 5000);
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, email, message, agree } = formData;

    if (!firstName || !lastName || !email || !message) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("error", "Please enter a valid email address.");
      return;
    }
    if (!agree) {
      showToast("error", "Please accept the Terms and Conditions.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/public/contactus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || `Request failed (${response.status})`,
        );
      }

      showToast("success", "Message sent! We'll get back to you soon.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        message: "",
        agree: false,
      });
    } catch (err) {
      showToast(
        "error",
        err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Services data
  const services = [
    {
      icon: Search,
      title: "Smart Job Search",
      desc: "Advanced filters and AI-matched results help candidates find the perfect role faster than ever.",
      delay: "",
    },
    {
      icon: UserCheck,
      title: "Resume Builder",
      desc: "Create professional, ATS-friendly resumes using customizable templates in minutes.",
      delay: "delay-1",
    },
    {
      icon: Building,
      title: "Employer Dashboard",
      desc: "Manage job postings, review applicants, and track your entire hiring pipeline in one view.",
      delay: "delay-2",
    },
    {
      icon: TrendingUp,
      title: "Career Guidance",
      desc: "Professional career advice, skill assessments, and interview preparation tailored to you.",
      delay: "delay-3",
    },
    {
      icon: Bell,
      title: "Job Alerts",
      desc: "Stay ahead with real-time, personalized job alerts delivered straight to your inbox daily.",
      delay: "delay-4",
    },
    {
      icon: Shield,
      title: "Verified Employers",
      desc: "Every company is verified before posting — so you only connect with trusted, legitimate employers.",
      delay: "delay-5",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Create Your Account",
      desc: "Sign up in seconds — no credit card needed. Complete your profile to unlock all features.",
    },
    {
      num: "02",
      title: "Discover Opportunities",
      desc: "Browse thousands of verified job listings filtered to match your skills and preferences.",
    },
    {
      num: "03",
      title: "Apply with One Click",
      desc: "Submit polished applications instantly and track every response from your personal dashboard.",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section
        className="relative min-h-[82vh] flex items-center justify-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${services_hero})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,29,51,0.92)] to-[rgba(24,169,156,0.4)] z-10"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:56px_56px] z-10"></div>

        <div className="relative z-20 text-center px-4 animate-[heroFadeUp_0.9s_cubic-bezier(0.4,0,0.2,1)_both]">
          <EyebrowBadge text={"What We Offer"} />
          <h1 className=" text-6xl font-semibold text-white leading-[1.05] tracking-[-2px] mb-5">
            Powering Every
            <br />
            Step of <span className="text-[#18a99c]">Your Career</span>
          </h1>
          <p className="text-[clamp(1rem,2.2vw,1.15rem)] text-white/65 max-w-[480px] mx-auto leading-[1.8] font-light mb-9">
            Smart tools and dedicated support — built for job seekers and
            recruiters alike.
          </p>
          <a
            href="#services"
            className="inline-flex items-center gap-2.5 bg-[#18a99c] text-white border-2 border-[#18a99c] rounded-full py-3 px-8 text-[0.9rem] font-bold transition-all hover:bg-[#14958a] hover:-translate-y-0.5"
          >
            <Grid size={18} /> Explore Services
          </a>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-24 bg-white" id="services">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <SectionTag text={"Our Services"} />
            <h2 className="text-5xl font-extrabold text-[#091d33] leading-[1.1] mb-3">
              Everything you need,
              <br />
              <span className="text-[#18a99c]">all in one place</span>
            </h2>
            <p className="text-[#64748b] max-w-[440px] mx-auto leading-relaxed">
              Comprehensive recruitment solutions for job seekers and employers
              — designed to make the process effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1160px] mx-auto">
            {services.map((service, idx) => (
              <div
                key={idx}
                className="bg-white border border-[rgba(9,29,51,0.07)] rounded-2xl pt-8 pb-10 px-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-[rgba(24,169,156,0.25)] relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#18a99c] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="w-13 h-13 bg-[#e6f7f6] rounded-xl flex items-center justify-center text-[1.3rem] text-[#18a99c] mb-5 transition-all duration-300 group-hover:bg-[#18a99c] group-hover:text-white">
                  <service.icon size={24} />
                </div>
                <h3 className="text-base font-bold text-[#091d33] mb-2.5">
                  {service.title}
                </h3>
                <p className="text-[0.865rem] text-[#64748b] leading-relaxed">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-24 bg-[#091d33] overflow-hidden">
        <div className="absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.1)_0%,transparent_70%)] pointer-events-none"></div>
        <div className="container mx-auto px-4 max-w-[1160px]">
          <div className="text-center mb-14">
            <SectionTag text={"Simple Process"} />
            <h2 className="text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold text-white leading-[1.1]">
              How it <span className="text-[#18a99c]">works</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-9 pb-8 text-center transition-all duration-300 hover:bg-[rgba(24,169,156,0.1)] hover:border-[rgba(24,169,156,0.28)] hover:-translate-y-1"
              >
                <div className="w-13 h-13 bg-[#18a99c] rounded-full flex items-center justify-center text-[1.1rem] font-extrabold text-white mx-auto mb-5 relative z-10">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-white mb-2.5">
                  {step.title}
                </h3>
                <p className="text-[0.85rem] text-white/50 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 bg-[#f1f5f9]">
        <div className="container mx-auto px-4 max-w-[1100px]">
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-2">
            {/* Form Side */}
            <div className="bg-[#091d33] p-12 lg:p-14">
              <div className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase text-[rgba(94,232,220,0.85)] mb-4">
                <span className="w-7 h-0.5 bg-[rgba(94,232,220,0.5)] rounded-full"></span>
                Get in Touch
              </div>
              <h2 className="text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold text-white leading-[1.1] mb-2">
                Send us a <span className="text-[#18a99c]">message</span>
              </h2>
              <p className="text-white/50 mb-8">
                Have a question or just want to say hello? We'd love to hear
                from you.
              </p>

              {/* Toast Message */}
              {toast.show && (
                <div
                  className={`flex items-center gap-2.5 p-3.5 rounded-lg mb-5 animate-[fadeUp_0.3s_ease] ${toast.type === "success" ? "bg-[rgba(24,169,156,0.15)] text-[#5ee8dc] border border-[rgba(24,169,156,0.3)]" : "bg-[rgba(220,60,40,0.12)] text-[#f87171] border border-[rgba(220,60,40,0.28)]"}`}
                >
                  {toast.type === "success" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <span className="text-sm">{toast.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-5">
                    <label className="block text-[0.72rem] font-bold tracking-[1px] uppercase text-white/45 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full bg-white/6 border border-white/12 rounded-lg p-3 text-white text-[0.9rem] outline-none transition-all focus:border-[#18a99c] focus:bg-[rgba(24,169,156,0.06)]"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-[0.72rem] font-bold tracking-[1px] uppercase text-white/45 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full bg-white/6 border border-white/12 rounded-lg p-3 text-white text-[0.9rem] outline-none transition-all focus:border-[#18a99c] focus:bg-[rgba(24,169,156,0.06)]"
                      placeholder="Last Name"
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-[0.72rem] font-bold tracking-[1px] uppercase text-white/45 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white/6 border border-white/12 rounded-lg p-3 text-white text-[0.9rem] outline-none transition-all focus:border-[#18a99c] focus:bg-[rgba(24,169,156,0.06)]"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="mb-5">
                  <label className="block text-[0.72rem] font-bold tracking-[1px] uppercase text-white/45 mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white/6 border border-white/12 rounded-lg p-3 text-white text-[0.9rem] outline-none transition-all focus:border-[#18a99c] focus:bg-[rgba(24,169,156,0.06)] resize-none"
                    placeholder="Write your message here…"
                  />
                </div>
                <div className="flex items-start gap-2.5 mb-6">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={formData.agree}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border border-white/30 bg-transparent appearance-none cursor-pointer mt-0.5 checked:bg-[#18a99c] checked:border-[#18a99c]"
                  />
                  <span className="text-[0.82rem] text-white/50">
                    I agree to the{" "}
                    <Link to="/terms" className="text-[#18a99c] no-underline hover:underline">
                      Terms and Conditions
                    </Link>{" "}
                    and Privacy Policy.
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#18a99c] text-white border-none rounded-full py-3.5 text-[0.9rem] font-bold tracking-[1px] cursor-pointer transition-all hover:bg-[#14958a] hover:-translate-y-px disabled:opacity-65 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Message →</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Image Side */}
            <div className="relative min-h-[300px] lg:min-h-full">
              <img
                src="/assets/images/service-contactUs.jpg"
                alt="Contact RojgarShine"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = services_hero;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[rgba(9,29,51,0.2)] to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-[680px] mx-auto">
          <SectionTag text={"Get started today"} />
          <h2 className="text-[clamp(2rem,4vw,2.8rem)] font-extrabold text-[#091d33] mb-4">
            Ready to find your{" "}
            <span className="text-[#18a99c]">next opportunity?</span>
          </h2>
          <p className="text-[#64748b] leading-relaxed mb-9">
            Join thousands of job seekers and top employers already using
            RojgarShine to make great matches.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-[#091d33] text-white border-2 border-[#091d33] rounded-full py-3.5 px-8 text-[0.88rem] font-bold transition-all hover:bg-[#18a99c] hover:border-[#18a99c]"
            >
              <UserCheck size={18} /> Create Free Account
            </Link>
            <Link
              to="/recruiter/post-job"
              className="inline-flex items-center gap-2 bg-transparent text-[#091d33] border-2 border-[rgba(9,29,51,0.2)] rounded-full py-3.5 px-8 text-[0.88rem] font-bold transition-all hover:border-[#091d33] hover:bg-[#f1f5f9]"
            >
              <Building size={18} /> Post a Job
            </Link>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-24 bg-[#f1f5f9]">
        <div className="container mx-auto px-4 max-w-[1160px]">
          <div className="text-center mb-13">
            <SectionTag text={"Find Us"} />
            <h2 className="text-[clamp(1.9rem,4vw,2.7rem)] font-extrabold text-[#091d33] leading-[1.1]">
              Our <span className="text-[#18a99c]">Head Office</span>
            </h2>
            <p className="text-[#64748b] max-w-[440px] mx-auto leading-relaxed mt-2">
              We're based in the heart of Lucknow — come say hello or reach us
              anytime online.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-7">
            {/* Map */}
            <iframe
              className="w-full h-full min-h-[380px] rounded-2xl border-0 shadow-md"
              src="https://www.google.com/maps?q=Chinhat,Lucknow,Uttar+Pradesh&output=embed"
              allowFullScreen
              loading="lazy"
              title="Office Location Map"
            ></iframe>

            {/* Office Card */}
            <div className="bg-[#091d33] rounded-2xl p-10 lg:p-9 flex flex-col justify-between relative overflow-hidden h-full">
              <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.14)_0%,transparent_70%)] pointer-events-none"></div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[2px] uppercase text-[#18a99c] mb-4">
                  <MapPin size={16} /> Location
                </div>
                <div className="text-[1.5rem] font-extrabold text-white mb-7">
                  RojgarShine
                  <br />
                  Head Office
                </div>
                <ul className="list-none mb-8">
                  <li className="flex items-start gap-3 py-3 border-b border-white/7">
                    <div className="w-8.5 h-8.5 bg-[rgba(24,169,156,0.15)] rounded-lg flex items-center justify-center text-[#18a99c] text-sm flex-shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <strong className="block text-[0.72rem] font-bold tracking-[1px] uppercase text-white/40 mb-0.5">
                        Address
                      </strong>
                      <span className="text-[0.9rem] text-white/85">
                        2/90, Vastu Khand Gomti Nagar Lucknow 226010
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 py-3 border-b border-white/7">
                    <div className="w-8.5 h-8.5 bg-[rgba(24,169,156,0.15)] rounded-lg flex items-center justify-center text-[#18a99c] text-sm flex-shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <strong className="block text-[0.72rem] font-bold tracking-[1px] uppercase text-white/40 mb-0.5">
                        Email
                      </strong>
                      <span className="text-[0.9rem] text-white/85">
                        support@rojgarshine.com
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
              <a
                href="https://www.google.com/maps?q=Chinhat,Lucknow,Uttar+Pradesh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#18a99c] text-white rounded-full py-3 px-6.5 text-[0.85rem] font-bold transition-all hover:bg-[#14958a] self-start"
              >
                <Compass size={16} /> Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(28px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        .bg-white\\/6 {
          background-color: rgba(255, 255, 255, 0.06);
        }
        .border-white\\/12 {
          border-color: rgba(255, 255, 255, 0.12);
        }
        .border-white\\/30 {
          border-color: rgba(255, 255, 255, 0.3);
        }
        .border-white\\/7 {
          border-color: rgba(255, 255, 255, 0.07);
        }
        .text-white\\/45 {
          color: rgba(255, 255, 255, 0.45);
        }
        .text-white\\/50 {
          color: rgba(255, 255, 255, 0.5);
        }
        .text-white\\/65 {
          color: rgba(255, 255, 255, 0.65);
        }
        .text-white\\/85 {
          color: rgba(255, 255, 255, 0.85);
        }
        .bg-white\\/6\\:focus {
          background-color: rgba(255, 255, 255, 0.06);
        }
        .focus\\:bg-\\[rgba\\(24\\,169\\,156\\,0\\.06\\)\\]:focus {
          background-color: rgba(24, 169, 156, 0.06);
        }
      `}</style>
    </>
  );
};

export default Services;
