import { ArrowUp } from 'lucide-react';
import { useBackToTop } from './utils';

export default function RecruiterBackToTop() {
  const { visible, scrollToTop } = useBackToTop();

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-7 right-7 z-100 flex h-11 w-11 items-center justify-center rounded-full bg-[#18a99c] text-white shadow-[0_4px_16px_rgba(24,169,156,0.4)] transition ${
        visible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-5'
      } hover:-translate-y-1 hover:bg-[#0fd4c4]`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
