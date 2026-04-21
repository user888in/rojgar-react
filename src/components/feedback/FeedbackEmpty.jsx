export default function FeedbackEmpty({ icon, title, message, children }) {
  return (
    <div className="col-span-full px-5 py-16 text-center">
      <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#e6f7f6] text-[1.8rem] text-[#18a99c]">
        {icon}
      </div>
      <h5 className="mb-1.5 text-[1.1rem] font-bold text-[#091d33]">{title}</h5>
      {message ? (
        <p className="text-[0.875rem] text-[#64748b]">{message}</p>
      ) : (
        children
      )}
    </div>
  );
}
