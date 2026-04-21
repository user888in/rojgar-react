const PageSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#e2e8f0] border-t-[#18a99c] rounded-full animate-spin" />
        <span className="text-sm text-[#64748b] font-medium">Loading...</span>
      </div>
    </div>
  );
};

export default PageSpinner;
