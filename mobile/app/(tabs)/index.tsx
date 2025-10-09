import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, StyleSheet, Button, ActivityIndicator, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { saveScan, type ScanRecord } from '@/utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

type Analysis = {
  score: number;
  positives: string[];
  negatives: string[];
  summary: string;
};

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri ?? null);
      if (asset.base64) {
        await runPipeline(asset.base64);
      }
    }
  };

  const runPipeline = async (imageBase64: string) => {
    setLoading(true);
    setOcrText('');
    setAnalysis(null);
    try {
      const ocrRes = await fetch(`${API_URL}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const ocrData = await ocrRes.json();
      setOcrText(ocrData.text || '');

      const analyzeRes = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ocrData.text || '' }),
      });
      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData);
      const record: ScanRecord = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ocrText: ocrData.text || '',
        analysis: {
          score: analyzeData.score,
          positives: analyzeData.positives || [],
          negatives: analyzeData.negatives || [],
          summary: analyzeData.summary || '',
        },
        imageUri,
      };
      await saveScan(record);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scan Food Label</Text>
      <Button title="Capture" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      {ocrText ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>OCR Text</Text>
          <Text>{ocrText}</Text>
        </View>
      ) : null}

      {analysis ? (
        <View style={styles.card}>
          <Text style={styles.subtitle}>Summary</Text>
          <Text>{analysis.summary}</Text>
          <Text style={{ marginTop: 8 }}>Score: {analysis.score}/10</Text>
          <View style={{ marginTop: 8 }}>
            <Text>Good: {analysis.positives.join(', ') || '—'}</Text>
            <Text>Bad: {analysis.negatives.join(', ') || '—'}</Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
});
