import { Link } from 'react-router-dom';

export default function AboutCTA() {
  return (
    <section className="bg-gradient-to-br from-teal-600 to-teal-800 py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">

        <div className="inline-block text-teal-200 text-sm font-semibold tracking-widest uppercase mb-4 border border-teal-400/40 px-4 py-1 rounded-full">
          Get Started
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
          Ready to find your{' '}
          <span className="text-teal-200">dream job?</span>
        </h2>

        <div class="inline-flex items-center gap-2 bg-teal-50 text-teal-600 px-3 py-1 rounded-full text-sm font-medium shadow-sm">
  <i class="bi bi-lightning-fill text-teal-500"></i>
  #1 Job Platform in India
</div>

        <p className="text-teal-100 text-lg mb-10 leading-relaxed">
          Join thousands of professionals who've already taken the next step in their career with RojgarShine.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/jobs"
            className="flex items-center gap-2 bg-white text-teal-700 font-semibold px-7 py-3 rounded-xl hover:bg-teal-50 transition-colors duration-200"
          >
            <i className="bi bi-search"></i> Browse Jobs
          </Link>
          <Link
            to="/recruiter/login"
            className="flex items-center gap-2 border-2 border-white text-white font-semibold px-7 py-3 rounded-xl hover:bg-white hover:text-teal-700 transition-colors duration-200"
          >
            <i className="bi bi-briefcase"></i> Post a Job
          </Link>
        </div>

      </div>
    </section>
  );
}