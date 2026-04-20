export default function SectionTag({ text, color = "#18a99c", className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-[7px] text-[0.7rem] font-bold uppercase mb-4 text-[var(--section-tag-color)] before:content-[''] before:w-7 before:h-[2px] before:bg-[var(--section-tag-color)] before:rounded-sm ${className}`}
      style={{ "--section-tag-color": color }}
    >
      {text}
    </div>
  );
}
