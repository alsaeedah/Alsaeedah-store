let Preferences = null;

const getPreferences = async () => {
  if (!Preferences) {
    try {
      const module = await import('@capacitor/preferences');
      Preferences = module.Preferences;
    } catch (e) {
      console.error('[CapacitorStorage] Failed to dynamically load @capacitor/preferences:', e);
      throw e;
    }
  }
  return Preferences;
};

export const capacitorStorage = {
  get: async ({ key }) => {
    try {
      const prefs = await getPreferences();
      return await prefs.get({ key });
    } catch (e) {
      console.error('[CapacitorStorage] Get failed:', e);
      return { value: null };
    }
  },
  set: async ({ key, value }) => {
    try {
      const prefs = await getPreferences();
      await prefs.set({ key, value });
    } catch (e) {
      console.error('[CapacitorStorage] Set failed:', e);
    }
  },
  remove: async ({ key }) => {
    try {
      const prefs = await getPreferences();
      await prefs.remove({ key });
    } catch (e) {
      console.error('[CapacitorStorage] Remove failed:', e);
    }
  },
  clear: async () => {
    try {
      const prefs = await getPreferences();
      await prefs.clear();
    } catch (e) {
      console.error('[CapacitorStorage] Clear failed:', e);
    }
  }
};
