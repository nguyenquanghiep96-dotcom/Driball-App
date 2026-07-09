import { STATUS_MAP } from '../utils/constants';

export default function StatusBadge({ status }) {
  const statusInfo = STATUS_MAP[status];
  if (!statusInfo) return null;

  return (
    <span className={`status-badge ${statusInfo.cssClass}`}>
      <span className="status-dot" />
      {statusInfo.label}
    </span>
  );
}
