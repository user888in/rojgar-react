const shimmerClass =
  'bg-[linear-gradient(90deg,#f0f4f8_25%,#e8edf3_50%,#f0f4f8_75%)] bg-[length:200%_100%] animate-[shimmer_1.4s_infinite] rounded-[7px] mb-2.5';

export default function FeedbackSkeleton({ count = 9 }) {
  return (
    <>
      {Array.from({ length: count }, (_, idx) => (
        <div
          key={`fb-skel-${idx}`}
          className="rounded-[16px] border-[1.5px] border-[#e2e8f0] bg-white p-[22px]"
        >
          <div className="mb-3.5 flex gap-2.5">
            <div className={`${shimmerClass} mb-0 h-11 w-11 rounded-[12px]`}></div>
            <div className="flex-1">
              <div className={`${shimmerClass} h-[13px] w-[60%]`}></div>
              <div className={`${shimmerClass} h-[11px] w-[40%]`}></div>
            </div>
          </div>
          <div className={`${shimmerClass} h-[13px] w-[50%]`}></div>
          <div className={`${shimmerClass} h-[11px]`}></div>
          <div className={`${shimmerClass} h-[11px] w-[80%]`}></div>
          <div className={`${shimmerClass} h-[11px] w-[65%]`}></div>
        </div>
      ))}
    </>
  );
}
