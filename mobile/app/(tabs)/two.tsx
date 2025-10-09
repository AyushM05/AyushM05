import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, Button } from 'react-native';
import { Text, View } from '@/components/Themed';
import { addFavorite, loadFavorites, loadScans, type FavoriteItem, type ScanRecord } from '@/utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

type Alternative = { name: string; reason: string; score: number };

export default function AlternativesScreen() {
  const [items, setItems] = useState<Alternative[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API_URL}/alternatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: 'Sample Bar' }),
      });
      const data = await res.json();
      setItems(data.items || []);
    };
    load();
    loadFavorites().then(setFavorites);
    loadScans().then(setHistory);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Healthier Alternatives</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.name}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <Text>{item.reason}</Text>
            <Text style={styles.score}>Score: {item.score}/10</Text>
            <Button title="Favorite" onPress={async () => {
              await addFavorite(item);
              const next = await loadFavorites();
              setFavorites(next);
            }} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingVertical: 12 }}
      />
      {history.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.title}>Recent Scans</Text>
          {history.map((h) => (
            <View key={h.id} style={styles.card}>
              <Text style={styles.itemTitle}>{new Date(h.timestamp).toLocaleString()}</Text>
              <Text numberOfLines={2}>{h.ocrText}</Text>
              <Text style={styles.score}>Score: {h.analysis.score}/10</Text>
            </View>
          ))}
        </View>
      )}

      {favorites.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.title}>Favorites</Text>
          {favorites.map((f) => (
            <View key={f.name} style={styles.card}>
              <Text style={styles.itemTitle}>{f.name}</Text>
              <Text>{f.reason}</Text>
              <Text style={styles.score}>Score: {f.score}/10</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  itemTitle: { fontSize: 18, fontWeight: '600' },
  score: { marginTop: 6 },
});
