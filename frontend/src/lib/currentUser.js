const CURRENT_USER_KEY = 'currentUser';
const REGISTERED_USERS_KEY = 'registeredUsers';

export function readCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

export function saveCurrentUser(user) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change'));
}

export function readRegisteredUsers() {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(REGISTERED_USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    window.localStorage.removeItem(REGISTERED_USERS_KEY);
    return [];
  }
}

export function saveRegisteredUsers(users) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

export function clearCurrentUser() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new Event('auth-change'));
}
