import RecruiterBackToTop from '../../components/recruiter/RecruiterBackToTop';
import RecruiterCTA from '../../components/recruiter/RecruiterCTA';
import RecruiterHero from '../../components/recruiter/RecruiterHero';
import RecruiterHowItWorks from '../../components/recruiter/RecruiterHowItWorks';
import RecruiterMetrics from '../../components/recruiter/RecruiterMetrics';
import RecruiterTestimonials from '../../components/recruiter/RecruiterTestimonials';
import RecruiterWhyChoose from '../../components/recruiter/RecruiterWhyChoose';
import useRecruiterStats from '../../components/recruiter/useRecruiterStats';

const Home = () => {
  const { stats } = useRecruiterStats();

  return (
    <div className="bg-[#f4f6f9] text-[#111] font-['DM Sans'] overflow-x-hidden">
     
      <main>
        <RecruiterHero stats={stats} />
        <RecruiterHowItWorks />
        <RecruiterMetrics stats={stats} />
        <RecruiterWhyChoose stats={stats} />
        <RecruiterTestimonials />
        <RecruiterCTA stats={stats} />
      </main>
      <RecruiterBackToTop />
    </div>
  );
};

export default Home;
