const CONNECTION_HISTORY_KEY = 'connectionHistory';
const MOCK_TEST_HISTORY_KEY = 'mockTestHistory';
const CAREER_ASSESSMENT_HISTORY_KEY ='careerAssessmentHistory';

const SAVED_TEST_KEY ='savedTests';

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

export function readMockTestHistory(userId) {
  return readList(buildScopedKey(MOCK_TEST_HISTORY_KEY, userId)).sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  );
}

export function recordMockTest(userId, entry) {
  const key = buildScopedKey(MOCK_TEST_HISTORY_KEY, userId);
  const current = readList(key);
  const record = {
    id: entry.id || createId(),
    completedAt: entry.completedAt || new Date().toISOString(),
    ...entry,
  };

  writeList(key, [record, ...current]);
  return record;
}

export function readCareerAssessmentHistory(userId) {
  return readList(
    buildScopedKey(
      CAREER_ASSESSMENT_HISTORY_KEY,
      userId
    )
  ).sort(
    (left, right) =>
      new Date(right.completedAt).getTime() -
      new Date(left.completedAt).getTime()
  );
}


export function recordCareerAssessment(
  userId,
  entry
) {
  const key = buildScopedKey(
    CAREER_ASSESSMENT_HISTORY_KEY,
    userId
  );

  const current = readList(key);

  const record = {
    id: entry.id || createId(),
    completedAt:
      entry.completedAt ||
      new Date().toISOString(),
    ...entry,
  };

  writeList(
    key,
    [record, ...current]
  );

  return record;
}


export function readSavedTests(userId) {
  return readList(
    buildScopedKey(
      SAVED_TEST_KEY,
      userId
    )
  ).sort(
    (left, right) =>
      new Date(right.savedAt).getTime() -
      new Date(left.savedAt).getTime()
  );
}


export function saveTest(
  userId,
  entry
) {
  const key = buildScopedKey(
    SAVED_TEST_KEY,
    userId
  );

  const current = readList(key);

  const record = {
    id: entry.id || createId(),
    savedAt:
      entry.savedAt ||
      new Date().toISOString(),
    ...entry,
  };

  writeList(
    key,
    [record, ...current]
  );

  return record;
}


export function getSavedTest(
  userId,
  testId
) {
  const tests =
    readSavedTests(userId);

  return (
    tests.find(
      (test) =>
        String(test.id) ===
        String(testId)
    ) || null
  );
}