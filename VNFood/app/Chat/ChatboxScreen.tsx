import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";

export default function ChatboxScreen() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
    []
  );
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // thêm tin nhắn user vào UI
    const newMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);

    try {
      const response = await fetch("https://api.coze.com/open_api/v2/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "pat_d22m8fNQ3qEl80tesgJRZVNWnbK8PmHrnWWf5sFa8n2qC69sFyrJ1f7lKjzGbEMC", // 🔑 thay bằng Personal Access Token thật của bạn
        },
        body: JSON.stringify({
          bot_id: "7500488605043933191", // 🔑 bot_id của bạn
          user: "user_123", // bạn tự đặt ID cho user, có thể dùng uuid
          query: input, // nội dung người dùng nhập
        }),
      });

      const data = await response.json();

      // ✅ tuỳ vào format JSON của Coze, lấy text từ bot
      const botReply =
        data?.messages?.[0]?.content?.[0]?.text ?? "Bot không trả lời";

      setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "❌ Lỗi gọi API" }]);
    }

    setInput("");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.message,
              item.role === "user" ? styles.userMsg : styles.botMsg,
            ]}
          >
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn..."
        />
        <TouchableOpacity style={styles.button} onPress={sendMessage}>
          <Text style={{ color: "#fff" }}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#fff" },
  message: { padding: 10, marginVertical: 5, borderRadius: 8 },
  userMsg: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  botMsg: { alignSelf: "flex-start", backgroundColor: "#EEE" },
  text: { fontSize: 16 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
});
