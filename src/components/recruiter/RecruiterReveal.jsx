import { useScrollReveal } from './utils';

export default function RecruiterReveal({ children, className = '', delay = 0 }) {
  const { ref, inView } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`transition duration-700 ease-out ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
