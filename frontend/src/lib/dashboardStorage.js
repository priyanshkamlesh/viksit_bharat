const MOCK_TEST_HISTORY_KEY = 'mockTestHistory';
const CONNECTION_HISTORY_KEY = 'connectionHistory';

const buildScopedKey = (baseKey, userId) => `${baseKey}:${userId || 'guest'}`;

const readList = (key) => {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    window.localStorage.removeItem(key);
    return [];
  }
};

const writeList = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('dashboard-change'));
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function readMockTestHistory(userId) {
  return readList(buildScopedKey(MOCK_TEST_HISTORY_KEY, userId)).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function appendMockTestHistory(userId, entry) {
  const key = buildScopedKey(MOCK_TEST_HISTORY_KEY, userId);
  const current = readList(key);
  const record = {
    id: entry.id || createId(),
    createdAt: entry.createdAt || new Date().toISOString(),
    ...entry,
  };

  writeList(key, [record, ...current]);
  return record;
}

export function readConnectionHistory(userId) {
  return readList(buildScopedKey(CONNECTION_HISTORY_KEY, userId)).sort(
    (left, right) => new Date(right.connectedAt).getTime() - new Date(left.connectedAt).getTime(),
  );
}

export function recordConnection(userId, entry) {
  const key = buildScopedKey(CONNECTION_HISTORY_KEY, userId);
  const current = readList(key);
  const record = {
    id: entry.id || createId(),
    connectedAt: entry.connectedAt || new Date().toISOString(),
    ...entry,
  };

  writeList(key, [record, ...current]);
  return record;
}

