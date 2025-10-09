import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScanRecord = {
  id: string;
  timestamp: number;
  ocrText: string;
  analysis: { score: number; positives: string[]; negatives: string[]; summary: string };
  imageUri?: string | null;
};

export type FavoriteItem = { name: string; reason: string; score: number };

const KEYS = {
  scans: 'nutriscan_scans',
  favorites: 'nutriscan_favorites',
};

export async function loadScans(): Promise<ScanRecord[]> {
  const raw = await AsyncStorage.getItem(KEYS.scans);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveScan(scan: ScanRecord): Promise<void> {
  const all = await loadScans();
  const next = [scan, ...all].slice(0, 50);
  await AsyncStorage.setItem(KEYS.scans, JSON.stringify(next));
}

export async function loadFavorites(): Promise<FavoriteItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.favorites);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addFavorite(item: FavoriteItem): Promise<void> {
  const all = await loadFavorites();
  const exists = all.find((i) => i.name === item.name);
  if (exists) return;
  await AsyncStorage.setItem(KEYS.favorites, JSON.stringify([item, ...all]));
}

export async function removeFavorite(name: string): Promise<void> {
  const all = await loadFavorites();
  const next = all.filter((i) => i.name !== name);
  await AsyncStorage.setItem(KEYS.favorites, JSON.stringify(next));
}
