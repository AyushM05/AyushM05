import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/Themed';

// Placeholder Result screen for navigation expansion (optional use later)
export default function ResultScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Result</Text>
      <Text>After scan, show detailed breakdown here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
});
