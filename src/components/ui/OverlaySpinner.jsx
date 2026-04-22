const OverlaySpinner = ({ show }) => {
  return (
    <div className={`spinner-overlay ${show ? 'show' : ''}`} role="status" aria-live="polite">
      <div className="rd-spinner" />
    </div>
  );
};

export default OverlaySpinner;
