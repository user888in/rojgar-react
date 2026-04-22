const StatCard = ({
  tone,
  iconClass,
  iconStyle,
  label,
  value,
  subLabel,
  progress,
  onClick,
  valueClassName = '',
}) => {
  return (
    <button className={`stat-card ${tone || ''}`} onClick={onClick} type="button">
      <div className="stat-top">
        <div>
          <div className="stat-label">{label}</div>
          <div className={`stat-value ${valueClassName}`}>{value}</div>
          {subLabel ? <div className="stat-sub">{subLabel}</div> : null}
        </div>
        <div className="stat-icon" style={iconStyle}>
          <i className={`bi ${iconClass}`} />
        </div>
      </div>
      {progress ? (
        <div className="stat-progress">
          <div className="stat-progress-bar" style={progress} />
        </div>
      ) : null}
    </button>
  );
};

export default StatCard;
