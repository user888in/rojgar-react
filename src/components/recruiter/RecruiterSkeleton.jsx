export default function RecruiterSkeleton({ className = '', variant = 'dark' }) {
  const gradient =
    variant === 'light'
      ? 'bg-[linear-gradient(90deg,#e8eaed_25%,#f4f4f4_50%,#e8eaed_75%)]'
      : 'bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_25%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.08)_75%)]';

  return (
    <span
      className={`inline-block rounded ${gradient} bg-[length:200%_100%] animate-[recruiter-shimmer_1.4s_infinite] ${className}`.trim()}
    />
  );
}
