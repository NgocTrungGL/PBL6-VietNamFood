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

export default function RegisterScreen({ setIsLoggedIn }: any) {
  const navigation = useNavigation<any>();

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

    const newErrors: any = {};
    if (!username) newErrors.username = "Vui lòng nhập tên người dùng";
    if (!fullName) newErrors.fullName = "Vui lòng nhập họ và tên";

    if (!email) newErrors.email = "Vui lòng nhập email";
    else if (!validateEmail(email)) newErrors.email = "Email không hợp lệ";

    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (!validatePassword(password))
      newErrors.password =
        "Mật khẩu phải ≥8 ký tự, gồm chữ hoa, số và ký tự đặc biệt";

    if (!passwordConfirmation)
      newErrors.passwordConfirmation = "Vui lòng nhập lại mật khẩu";
    else if (password !== passwordConfirmation)
      newErrors.passwordConfirmation = "Mật khẩu xác nhận không trùng khớp";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }

    // *** SỬA LỖI Ở ĐÂY ***
    const payload = {
      email,
      full_name: fullName,
      username,
      password,
      password_confirmation: passwordConfirmation, // Đã sửa từ 'passwordconfirmation'
    };
    // *********************

    try {
      const response = await fetch(`${API_USER_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusColor("green");
        setStatusMessage("🎉 Đăng ký thành công!");
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 1200);
      } else {
        // Ghi log lỗi chi tiết để debug
        // console.error("Lỗi đăng ký - Chi tiết từ server:", JSON.stringify(data, null, 2));

        // Hiển thị lỗi chi tiết hơn (nếu server có trả về 'errors')
        const errorMessage = data.error || data.message || (data.errors ? "Dữ liệu không hợp lệ" : "Đăng ký thất bại!");
        setStatusMessage(errorMessage);
      }
    } catch (error) {
      // console.error("Lỗi kết nối:", error);
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
        source={require("../../assets/bgimg.jpg")} // Đảm bảo bạn có ảnh này trong assets
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
          {errors.username && (
            <Text style={styles.errorText}>{errors.username}</Text>
          )}

          <TextInput
            placeholder="Họ và tên"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
          {errors.fullName && (
            <Text style={styles.errorText}>{errors.fullName}</Text>
          )}

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
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          <TextInput
            placeholder="Xác nhận mật khẩu"
            placeholderTextColor="#999"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            style={styles.input}
          />
          {errors.passwordConfirmation && (
            <Text style={styles.errorText}>
              {errors.passwordConfirmation}
            </Text>
          )}

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
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  formContainer: {
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 15,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  errorText: { color: "red", fontSize: 13, marginBottom: 8, marginLeft: 4 },
  statusText: { textAlign: "center", fontWeight: "600", marginBottom: 10 },
  button: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkText: { textAlign: "center", color: "#555" },
  linkHighlight: { color: "#28a745", fontWeight: "600" },
});
