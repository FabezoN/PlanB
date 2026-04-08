import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@planb_favorites';
const PRICE_PREFS_KEY = '@planb_price_prefs';

export interface PricePrefs {
  greenMax: number;
  redMin: number;
}

export const DEFAULT_PRICE_PREFS: PricePrefs = {
  greenMax: 4,
  redMin: 6,
};

export type PriceColor = 'green' | 'orange' | 'red';

export function useUserPrefs() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pricePrefs, setPricePrefs] = useState<PricePrefs>(DEFAULT_PRICE_PREFS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const [favsJson, prefsJson] = await Promise.all([
        AsyncStorage.getItem(FAVORITES_KEY),
        AsyncStorage.getItem(PRICE_PREFS_KEY),
      ]);
      if (favsJson) setFavorites(JSON.parse(favsJson));
      if (prefsJson) setPricePrefs(JSON.parse(prefsJson));
    } catch (_) {}
    setIsLoaded(true);
  };

  const toggleFavorite = useCallback(async (barId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(barId)
        ? prev.filter((id) => id !== barId)
        : [...prev, barId];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updatePricePrefs = useCallback(async (newPrefs: PricePrefs) => {
    setPricePrefs(newPrefs);
    await AsyncStorage.setItem(PRICE_PREFS_KEY, JSON.stringify(newPrefs));
  }, []);

  const getPriceColor = useCallback(
    (beerPrice: number): PriceColor => {
      if (beerPrice <= pricePrefs.greenMax) return 'green';
      if (beerPrice >= pricePrefs.redMin) return 'red';
      return 'orange';
    },
    [pricePrefs]
  );

  return {
    favorites,
    pricePrefs,
    isLoaded,
    toggleFavorite,
    updatePricePrefs,
    getPriceColor,
    reloadPrefs: loadPrefs,
  };
}
