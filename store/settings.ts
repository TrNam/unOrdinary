import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  isDarkMode: boolean;
  useMetric: boolean;
  toggleTheme: () => void;
  toggleUnit: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isDarkMode: true,
      useMetric: true,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleUnit: () => set((state) => ({ useMetric: !state.useMetric })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper functions for unit conversion
export const convertWeight = (value: number, fromMetric: boolean, toMetric: boolean): number => {
  if (fromMetric === toMetric) return value;
  return fromMetric ? value * 2.20462 : value / 2.20462;
};

export const formatWeight = (value: number, useMetric: boolean): string => {
  return useMetric ? `${value} kg` : `${value} lbs`;
}; 