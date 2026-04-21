import { Globe, Mail, MapPin, MessageCircle, Send, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import footerLogo from '../../assets/images/Rojgarshine White Logo-01.png';

const socialLinks = [
  { label: 'Facebook', href: '#', icon: Share2 },
  { label: 'Twitter', href: '#', icon: Send },
  {
    label: 'LinkedIn',
    href: 'https://in.linkedin.com/company/barrownzgroup',
    icon: Globe,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/barrownzgroup/',
    icon: MessageCircle,
  },
];

const recruiterTools = [
  { label: 'Post a Job', to: '/recruiter/post-job' },
  { label: 'Manage Jobs', to: '/recruiter/jobs' },
  { label: 'Applications', to: '/recruiter/applications' },
  { label: 'Dashboard', to: '/recruiter/dashboard' },
];

const recruiterLinks = [
  { label: 'Create Account', to: '/recruiter/register' },
  { label: 'Sign In', to: '/recruiter/login' },
  { label: 'Give Feedback', to: '/feedback' },
  { label: 'For Job Seekers', to: '/' },
];

const bottomLinks = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Cookie Policy', href: '#' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#091d33] pt-11 text-white">
      <div className="pointer-events-none absolute -right-25 -top-25 h-100 w-100 rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.12)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-15 -left-15 h-65 w-65 rounded-full bg-[radial-gradient(circle,rgba(24,169,156,0.07)_0%,transparent_70%)]" />

      <div className="relative mx-auto max-w-300 px-7">
        <div className="grid gap-10 pb-12 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] md:grid-cols-2">
          <div>
            <Link to="/recruiter" className="inline-flex items-center gap-3">
              <img
                src={footerLogo}
                alt="RojgarShine"
                className="h-18 w-auto object-contain transition duration-200 hover:scale-105"
              />
            </Link>
            <p className="mt-3 max-w-60 text-[0.875rem] leading-[1.75] text-white/50">
              The smarter hiring platform - connecting top recruiters with verified talent, faster than ever.
            </p>
            <div className="mt-5 flex gap-2">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                    aria-label={link.label}
                    className="flex h-9 w-9 items-center justify-center rounded-[9px] border border-white/10 bg-white/10 text-white/60 transition hover:-translate-y-1 hover:border-[#18a99c] hover:bg-[#18a99c] hover:text-white"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="pt-7">
            <h6 className="mb-4 text-[0.78rem] font-bold uppercase tracking-[1.5px] text-[#18a99c]">
              Recruiter Tools
            </h6>
            <ul className="space-y-3 text-[0.875rem] text-white/50">
              {recruiterTools.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="group inline-flex items-center gap-2 transition hover:gap-3 hover:text-white">
                    <span className="h-1.25 w-1.25 rounded-full border border-white/20 transition group-hover:border-[#18a99c] group-hover:bg-[#18a99c]" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-7">
            <h6 className="mb-4 text-[0.78rem] font-bold uppercase tracking-[1.5px] text-[#18a99c]">
              Recruiters
            </h6>
            <ul className="space-y-3 text-[0.875rem] text-white/50">
              {recruiterLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="group inline-flex items-center gap-2 transition hover:gap-3 hover:text-white">
                    <span className="h-1.25 w-1.25 rounded-full border border-white/20 transition group-hover:border-[#18a99c] group-hover:bg-[#18a99c]" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-7">
            <h6 className="mb-4 text-[0.78rem] font-bold uppercase tracking-[1.5px] text-[#18a99c]">
              Contact Us
            </h6>
            <div className="space-y-4 text-[0.875rem] text-white/50">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(24,169,156,0.12)] text-[#18a99c]">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>2/90, Vastu Khand Gomti Nagar Lucknow 226010</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(24,169,156,0.12)] text-[#18a99c]">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>support@rojgarshine.com</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/10" />

        <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-[0.8rem] text-white/30">
          <span>
            <a
              href="../admin/login.html"
              className="pointer-events-none text-white/30"
              aria-label="Admin login"
            >
              © 2026
            </a>{' '}
            RojgarShine. All rights reserved. Designed for recruiters who move fast.
          </span>
          <div className="flex flex-wrap gap-5">
            {bottomLinks.map((link) => (
              <a key={link.label} href={link.href} className="transition hover:text-[#18a99c]">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
