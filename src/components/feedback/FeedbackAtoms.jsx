import { Building2, User } from 'lucide-react';
import { initials } from './feedbackUtils';

const STAR_CHAR = '\u2605';

export const FeedbackAvatar = ({ image, name, className }) => {
  const wrapperClass = `flex items-center justify-center ${className || ''}`.trim();

  if (image) {
    return (
      <div className={wrapperClass}>
        <img
          src={image}
          alt={name || ''}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  return <div className={wrapperClass}>{initials(name)}</div>;
};

export const FeedbackStars = ({
  rating = 0,
  className = '',
  filledClassName = 'text-[#f59e0b]',
  emptyClassName = 'text-[#e2e8f0]',
}) => {
  const count = Math.max(0, Math.min(5, Math.floor(Number(rating) || 0)));

  return (
    <span className={className}>
      {Array.from({ length: 5 }, (_, idx) => (
        <span key={idx} className={idx < count ? filledClassName : emptyClassName}>
          {STAR_CHAR}
        </span>
      ))}
    </span>
  );
};

export const FeedbackRolePill = ({ role, className = '' }) => {
  const baseClass =
    'inline-flex items-center gap-1 rounded-full px-[10px] py-[3px] text-[0.66rem] font-bold uppercase tracking-[0.5px]';

  if (role === 'JOB_SEEKER') {
    return (
      <span className={`${baseClass} bg-[#dcfce7] text-[#15803d] ${className}`.trim()}>
        <User className="h-3.5 w-3.5" aria-hidden="true" /> Job Seeker
      </span>
    );
  }

  if (role === 'RECRUITER') {
    return (
      <span className={`${baseClass} bg-[#dbeafe] text-[#1d4ed8] ${className}`.trim()}>
        <Building2 className="h-3.5 w-3.5" aria-hidden="true" /> Recruiter
      </span>
    );
  }

  return null;
};
