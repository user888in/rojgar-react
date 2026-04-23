const RecruiterPostJobHero = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-700 p-8 text-white shadow-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-400/20" />
      <div className="relative">
        <h4 className="text-xl font-extrabold">Post a New Job</h4>
        <p className="mt-3 max-w-2xl text-sm text-slate-200">
          Fill in the details below and publish your listing to reach thousands of qualified candidates.
        </p>
      </div>
    </div>
  );
};

export default RecruiterPostJobHero;
