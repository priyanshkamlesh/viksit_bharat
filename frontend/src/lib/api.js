export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function buildApiUrl(path = '') {
  const base = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (/^https?:\/\//i.test(base)) {
    return `${base}${normalizedPath}`;
  }

  return `${base}${normalizedPath}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export function fetchBackendHealth() {
  return request('/');
}

export function fetchDatabaseHealth() {
  return request('/health/db');
}

export function fetchAuthConfig() {
  return request('/auth/config');
}

export function fetchRecommendationUsers() {
  return request('/recommend/users');
}

export function fetchUserNotifications(userId) {
  return request(`/notifications/${userId}`);
}

export function sendConnectionInvite(senderId, recipientId) {
  return request('/notifications/send', {
    method: 'POST',
    body: JSON.stringify({
      sender_id: senderId,
      recipient_id: recipientId,
    }),
  });
}

export function acceptConnectionInvite(notificationId) {
  return request('/notifications/accept', {
    method: 'POST',
    body: JSON.stringify({
      notification_id: notificationId,
    }),
  });
}

export function declineConnectionInvite(notificationId) {
  return request('/notifications/decline', {
    method: 'POST',
    body: JSON.stringify({
      notification_id: notificationId,
    }),
  });
}

export function fetchUserById(userId) {
  return request(`/users/${userId}`);
}

export function fetchUserByEmail(email) {
  if (!email) {
    throw new Error('Email is required');
  }
  return request(`/users/by-email/${encodeURIComponent(email)}`);
}

export function registerUser(profile) {
  return request('/users/register', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function updateCollaborationProfile(userId, profile) {
  return request(`/users/${userId}/collaboration`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export function fetchRecommendations(userId) {
  return request(`/recommend/${userId}`);
}

export function fetchRecommendationsForProfile(profile) {
  return request('/recommend/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function saveCollaborationProfile(profile) {
  return request('/collaboration/profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
}

export function fetchJobRoleSpecializations(role) {
  return request('/job-role-types', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export function fetchTnpTopicMaterial(track, topic) {
  return request('/tnp/topic-material', {
    method: 'POST',
    body: JSON.stringify({ track, topic }),
  });
}

export function connectMockInterview(userId, partnerId) {
  return request('/mock-interview/connect', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      partner_id: partnerId,
    }),
  });
}

export function fetchMockInterviewSession(sessionId) {
  return request(`/mock-interview/session/${sessionId}`);
}

export function recordMockInterviewTurn(sessionId, askerId, responderId, question, answer) {
  return request('/mock-interview/turn', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      asker_id: askerId,
      responder_id: responderId,
      question,
      answer,
    }),
  });
}

export function analyzeConnectedMockInterview(sessionId) {
  return request(`/mock-interview/analyze/${sessionId}`);
}

export function startAiMockInterview(userId) {
  return request('/mock-interview/ai/start', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
    }),
  });
}

export function continueAiMockInterview(sessionId, answer) {
  return request('/mock-interview/ai/turn', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      answer,
    }),
  });
}

export function finishAiMockInterview(sessionId) {
  return request(`/mock-interview/ai/finish/${sessionId}`);
}

export function generateMockTest(category, skill, questionCount = 10) {
  return request('/mock-interview/mock-test/generate', {
    method: 'POST',
    body: JSON.stringify({
      category,
      skill,
      question_count: questionCount,
    }),
  });
}

export function fetchMockInterviewChat(sessionId) {
  return request(`/mock-interview/chat/${sessionId}`);
}

export function sendMockInterviewChatMessage(sessionId, senderId, recipientId, message) {
  return request('/mock-interview/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      sender_id: senderId,
      recipient_id: recipientId,
      message,
    }),
  });
}
