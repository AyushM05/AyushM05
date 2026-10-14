import { useState } from 'react';
import { StyleSheet, TextInput, Button, FlatList } from 'react-native';
import { View, Text } from '@/components/Themed';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.reply || 'Sorry, I could not answer right now.',
      };
      setMessages((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.user : styles.assistant]}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about food, diet, ingredients..."
          style={styles.input}
        />
        <Button title={loading ? '...' : 'Send'} onPress={send} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '85%',
  },
  user: {
    alignSelf: 'flex-end',
    backgroundColor: '#d1f7c4',
  },
  assistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
});
