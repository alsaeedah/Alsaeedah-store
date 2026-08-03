export const browserStorage = {
  get: async ({ key }) => {
    try {
      const value = localStorage.getItem(key);
      return { value };
    } catch (e) {
      console.error('[BrowserStorage] Get failed:', e);
      return { value: null };
    }
  },
  set: async ({ key, value }) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('[BrowserStorage] Set failed:', e);
    }
  },
  remove: async ({ key }) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[BrowserStorage] Remove failed:', e);
    }
  },
  clear: async () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('[BrowserStorage] Clear failed:', e);
    }
  }
};
