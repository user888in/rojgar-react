const RecruiterTopbar = ({ title, dateLabel, displayName, initials, onProfileOpen }) => {
  return (
    <div className="topbar">
      <div>
        <p className="topbar-title">{title}</p>
        <p className="topbar-date">{dateLabel}</p>
      </div>
      <div className="topbar-right">
        <button className="topbar-profile-btn" onClick={onProfileOpen} type="button">
          <div className="tp-avatar">{initials}</div>
          <span>{displayName}</span>
          <i className="bi bi-chevron-down" style={{ fontSize: 10, opacity: 0.5 }} />
        </button>
      </div>
    </div>
  );
};

export default RecruiterTopbar;
