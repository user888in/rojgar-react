export default function EyebrowBadge({
  text,
  showPulse = true,
  icon = null,
  className = "",
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 tracking-[2px] bg-[rgba(24,169,156,0.2)] border border-[rgba(24,169,156,0.4)] text-[#5ee8dc] text-[0.72rem] font-bold uppercase px-[18px] py-[7px] rounded-full mb-7 backdrop-blur-sm ${className}`.trim()}
    >
      {showPulse && (
        <span className="w-[6px] h-[6px] rounded-full bg-[#18a99c] animate-pulse" />
      )}
      {icon ? (
        <span className="flex items-center text-[#18a99c]">{icon}</span>
      ) : null}
      {text}
    </div>
  );
}
