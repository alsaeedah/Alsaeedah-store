let Preferences = null;

const ensurePreferences = async () => {
  if (!Preferences) {
    try {
      const module = await import('@capacitor/preferences');
      Preferences = module.Preferences;
    } catch (e) {
      console.error('[CapacitorStorage] Failed to dynamically load @capacitor/preferences:', e);
      throw e;
    }
  }
};

export const capacitorStorage = {
  get: async ({ key }) => {
    try {
      await ensurePreferences();
      return await Preferences.get({ key });
    } catch (e) {
      console.error('[CapacitorStorage] Get failed:', e);
      return { value: null };
    }
  },
  set: async ({ key, value }) => {
    try {
      await ensurePreferences();
      await Preferences.set({ key, value });
    } catch (e) {
      console.error('[CapacitorStorage] Set failed:', e);
    }
  },
  remove: async ({ key }) => {
    try {
      await ensurePreferences();
      await Preferences.remove({ key });
    } catch (e) {
      console.error('[CapacitorStorage] Remove failed:', e);
    }
  },
  clear: async () => {
    try {
      await ensurePreferences();
      await Preferences.clear();
    } catch (e) {
      console.error('[CapacitorStorage] Clear failed:', e);
    }
  }
};
