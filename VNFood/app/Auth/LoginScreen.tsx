import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_LOGIN_URL } from "@env";
// 👇 1. Import hook useAuth từ file Context
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  // 👇 2. Lấy hàm login từ Context
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrors({});
    setStatusMessage(null);
    setLoading(true);

    // --- Validation Client-side ---
    const newErrors: any = {};
    if (!email) newErrors.email = "Vui lòng nhập email";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }

    const payload = { email, password };

    try {
      const response = await fetch(`${API_LOGIN_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // 👇 3. Xử lý khi đăng nhập thành công
        setStatusMessage("🎉 Đăng nhập thành công!");

        // Chờ 1 chút cho người dùng đọc thông báo
        setTimeout(async () => {
            // Kiểm tra xem server trả về biến 'user' hay không
            // Cấu trúc kỳ vọng: { message: "...", user: { user_id: 1, ... } }
            if (data.user) {
                await login(data.user);
                // Context sẽ tự cập nhật state 'user',
                // AppNavigator sẽ tự động chuyển sang MainTabs
            } else {
                // Fallback nếu API trả về dữ liệu phẳng
                await login(data);
            }
        }, 1000);

      } else {
        const errorMessage = data.error || data.message || "Email hoặc mật khẩu không đúng";
        setStatusMessage(errorMessage);
      }

    } catch (error) {
      setStatusMessage("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ImageBackground
        source={require("../../assets/bgimg.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng nhập</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}

          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {statusMessage && (
            <Text style={[
              styles.statusText,
              { color: statusMessage.includes("thành công") ? "#28a745" : "#dc3545" }
            ]}>
              {statusMessage}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng nhập</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("RegisterScreen")}
          >
            <Text style={styles.linkText}>
              Chưa có tài khoản?
              <Text style={styles.linkHighlight}> Đăng ký ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)", // Tăng độ tối nền một chút cho chữ rõ hơn
  },
  formContainer: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 16,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 13,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: "500"
  },
  statusText: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 15,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#66BB6A", // 👉 Đổi sang màu xanh lá chủ đạo
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
    shadowColor: "#66BB6A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  linkText: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
  },
  linkHighlight: {
    color: "#66BB6A", // Màu xanh lá
    fontWeight: "700",
  },
});
