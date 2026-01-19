export const saveKey = (userId, gameId) => `save:${userId ?? 'anon'}:${gameId}`;

export const saveToLocal = (userId, gameId, session) => {
  try {
    localStorage.setItem(saveKey(userId, gameId), JSON.stringify(session));
    return true;
  } catch (e) {
    console.error('localStorage save error', e);
    return false;
  }
};

export const loadFromLocal = (userId, gameId) => {
  try {
    const raw = localStorage.getItem(saveKey(userId, gameId));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('localStorage load error', e);
    return null;
  }
};

export const deleteLocal = (userId, gameId) => {
  try {
    localStorage.removeItem(saveKey(userId, gameId));
    return true;
  } catch (e) {
    console.error('localStorage delete error', e);
    return false;
  }
};