export const STATUS_ORDER = [
  'departed_ningbo',
  'at_sea',
  'arrived_aqaba',
  'customs_clearance',
  'ready_for_delivery',
  'delivered',
];

export const STATUS_ICONS = {
  departed_ningbo: '🚢',
  at_sea: '🌊',
  arrived_aqaba: '⚓',
  customs_clearance: '📋',
  ready_for_delivery: '📦',
  delivered: '✅',
};

export const getStatusIndex = (status) => STATUS_ORDER.indexOf(status);

export const isStatusDone = (itemStatus, currentStatus) =>
  STATUS_ORDER.indexOf(itemStatus) <= STATUS_ORDER.indexOf(currentStatus);

export const isStatusActive = (itemStatus, currentStatus) =>
  itemStatus === currentStatus;

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ar-JO', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch { return dateStr; }
};

export const formatDatetime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('ar-JO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateStr; }
};

export const formatDateEN = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch { return dateStr; }
};

export const getStatusBadgeClass = (status) => {
  const map = {
    departed_ningbo: 'badge-blue',
    at_sea: 'badge-blue',
    arrived_aqaba: 'badge-green',
    customs_clearance: 'badge-yellow',
    ready_for_delivery: 'badge-yellow',
    delivered: 'badge-green',
  };
  return map[status] || 'badge-gray';
};
