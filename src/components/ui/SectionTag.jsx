export default function SectionTag({
  text,
  colorClass = "text-[#18a99c] before:bg-[#18a99c]",
  className = "",
}) {
  return (
    <div
      className={`inline-flex items-center gap-[7px] text-[0.7rem] font-bold uppercase mb-4 before:content-[''] before:w-7 before:h-[2px] before:rounded-sm ${colorClass} ${className}`.trim()}
    >
      {text}
    </div>
  );
}
