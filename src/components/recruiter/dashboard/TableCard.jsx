import { Link } from 'react-router-dom';

const TableCard = ({ title, iconClass, actionTo, actionLabel, children }) => {
  return (
    <div className="table-card">
      <div className="table-card-header">
        <span className="table-card-title">
          <i className={`bi ${iconClass}`} /> {title}
        </span>
        {actionTo ? (
          <Link to={actionTo} className="view-all-btn">
            <i className="bi bi-arrow-right" /> {actionLabel}
          </Link>
        ) : null}
      </div>
      <div className="table-responsive">{children}</div>
    </div>
  );
};

export default TableCard;
