import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_CHATBOX_URL } from "@env";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
}

export default function ChatboxScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
        id: "welcome",
        role: "bot",
        text: "Xin chào! Tôi là trợ lý ẩm thực ảo. Bạn muốn hỏi về món ăn nào hôm nay? 🍜"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Ref để tự động scroll xuống cuối
  const flatListRef = useRef<FlatList>(null);

  // LOGIC GIỮ NGUYÊN
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Thay IP của bạn vào đây nếu chưa dùng env
      const response = await fetch(API_CHATBOX_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.text,
          k: 5
        }),
      });

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: data.answer || "Xin lỗi, tôi không hiểu câu hỏi của bạn.",
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        text: "Có lỗi kết nối server. Vui lòng kiểm tra lại mạng.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Tự động scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // --- RENDER ITEM ---
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.messageRow, isUser ? styles.rowReverse : styles.rowLeft]}>
        {/* Avatar Bot */}
        {!isUser && (
            <View style={styles.botAvatarContainer}>
                <Image
                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png" }} // Icon Robot/Chef
                    style={styles.botAvatar}
                />
            </View>
        )}

        {/* Bubble */}
        <View style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.botBubble
        ]}>
            <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                {item.text}
            </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#66BB6A" />

              {/* Header Logo */}
              <View style={styles.headerContainer}>
                <Image
                  source={require('../../assets/logo.jpg')}
                  style={styles.logoBanner}
                />
              </View>

      {/* CHAT LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* INPUT AREA */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Nhập câu hỏi của bạn..."
                placeholderTextColor="#999"
                multiline
                editable={!loading}
            />

            <TouchableOpacity
                style={[styles.sendButton, (!input.trim() && !loading) && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={loading || !input.trim()}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Ionicons name="send" size={20} color="#fff" style={{marginLeft: 2}} />
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F6F2", // Nền xanh rất nhạt
  },

  // --- HEADER ---
  header: {
    backgroundColor: "#66BB6A",
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 2,
  },

  // --- LIST ---
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  rowReverse: {
    justifyContent: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },

  // --- AVATAR ---
  botAvatarContainer: {
    marginRight: 8,
    marginBottom: 2,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
  },

  // --- BUBBLES ---
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  userBubble: {
    backgroundColor: "#66BB6A", // Xanh chủ đạo
    borderBottomRightRadius: 4, // Hiệu ứng đuôi bubble
  },
  botBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4, // Hiệu ứng đuôi bubble
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },

  // --- TEXT ---
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#333",
  },

  // --- INPUT ---
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    alignItems: 'flex-end', // Căn đáy nếu input nhiều dòng
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12, // Tăng padding dọc
    fontSize: 16,
    maxHeight: 100, // Giới hạn chiều cao khi gõ nhiều
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: "#66BB6A",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2, // Căn chỉnh với input
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#CCC",
  },
    headerContainer: {
    width: "100%",
    height: 90,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  logoBanner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
