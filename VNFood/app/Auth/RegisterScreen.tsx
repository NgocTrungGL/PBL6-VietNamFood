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
import { API_USER_URL } from "@env";
// 👇 1. Import Context
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();

  // 👇 2. Lấy hàm login từ Context
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [errors, setErrors] = useState<any>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusColor, setStatusColor] = useState<string>("red");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(
      password
    );

  const handleRegister = async () => {
    setStatusMessage(null);
    setStatusColor("red");
    setLoading(true);

    // --- Validation (Giữ nguyên logic cũ của bạn) ---
    const newErrors: any = {};
    if (!username) newErrors.username = "Vui lòng nhập tên người dùng";
    if (!fullName) newErrors.fullName = "Vui lòng nhập họ và tên";
    if (!email) newErrors.email = "Vui lòng nhập email";
    else if (!validateEmail(email)) newErrors.email = "Email không hợp lệ";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (!validatePassword(password))
      newErrors.password = "Mật khẩu phải ≥8 ký tự, chữ hoa, số, ký tự đặc biệt";
    if (!passwordConfirmation)
      newErrors.passwordConfirmation = "Vui lòng nhập lại mật khẩu";
    else if (password !== passwordConfirmation)
      newErrors.passwordConfirmation = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }

    const payload = {
      email,
      full_name: fullName,
      username,
      password,
      password_confirmation: passwordConfirmation,
    };

try {
      const response = await fetch(`${API_USER_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // --- KIỂM TRA KẾT QUẢ ---
      if (response.ok) {
        // 1. Thành công: Thông báo màu xanh
        setStatusColor("green");
        setStatusMessage("🎉 Đăng ký thành công!");

        // 2. Đợi 1.2s rồi TỰ ĐỘNG ĐĂNG NHẬP để vào MainTabs
        setTimeout(async () => {
          // Nếu Server trả về thông tin user (giống api login)
          if (data.user) {
            await login(data.user);
            // 🚀 Dòng này chạy xong -> App tự động chuyển sang MainTabs ngay lập tức
          } else {
            // Nếu Server chỉ báo OK mà không trả về data user thì đành về Login
            console.log("Server không trả về user object, chuyển về Login");
            navigation.navigate("LoginScreen");
          }
        }, 1200);

      } else {
        // 3. Thất bại: Thông báo màu đỏ
        setStatusColor("red");
        const errorMessage = data.error || data.message || (data.errors ? "Dữ liệu không hợp lệ" : "Đăng ký thất bại!");
        setStatusMessage(errorMessage);
      }

    } catch (error) {
      // 4. Lỗi mạng
      setStatusColor("red");
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
          <Text style={styles.title}>Đăng ký tài khoản</Text>

          <TextInput
            placeholder="Tên người dùng (username)"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
          />
          {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

          <TextInput
            placeholder="Họ và tên"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TextInput
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#999"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            style={styles.input}
          />
          {errors.passwordConfirmation && <Text style={styles.errorText}>{errors.passwordConfirmation}</Text>}

          {statusMessage && (
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusMessage}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Đăng ký</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
            <Text style={styles.linkText}>
              Đã có tài khoản?
              <Text style={styles.linkHighlight}> Đăng nhập ngay</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, justifyContent: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  formContainer: {
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.95)",
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
    marginBottom: 25,
    color: "#333",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 15,
  },
  errorText: { color: "#dc3545", fontSize: 12, marginBottom: 8, marginLeft: 4 },
  statusText: { textAlign: "center", fontWeight: "600", marginBottom: 10 },
  button: {
    backgroundColor: "#66BB6A", // Màu xanh lá
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#66BB6A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  linkText: { textAlign: "center", color: "#666" },
  linkHighlight: { color: "#66BB6A", fontWeight: "700" },
});
