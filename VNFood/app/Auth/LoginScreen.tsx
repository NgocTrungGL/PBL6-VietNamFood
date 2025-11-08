import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  // Alert, // Không cần Alert nữa, chúng ta sẽ dùng statusMessage
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator, // Thêm ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_LOGIN_URL } from "@env"; // 👉 Thêm dòng này

export default function LoginScreen({ setIsLoggedIn, ...props }: any) {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Thêm State cho xử lý lỗi và loading ---
  const [errors, setErrors] = useState<any>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // -------------------------------------------

  const handleLogin = async () => {
    setErrors({});
    setStatusMessage(null);
    setLoading(true);

    // --- 1. Client-side validation ---
    const newErrors: any = {};
    if (!email) newErrors.email = "Vui lòng nhập email";
    if (!password) newErrors.password = "Vui lòng nhập mật khẩu";

    // (Bỏ qua validation phức tạp ở login, server sẽ làm việc đó)
    // Nếu bạn VẪN MUỐN validate password phức tạp ở đây, hãy thêm lại
    // hàm validatePassword và kiểm tra

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setLoading(false);
      return;
    }
    // ---------------------------------

    const payload = {
      email,
      password,
    };

    // --- 2. Gọi API Đăng nhập ---
    try {
      // 👉 Hãy đảm bảo API_LOGIN_URL trỏ đúng đến API của bạn
      const response = await fetch(`${API_LOGIN_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Đăng nhập thành công (HTTP 200)
        // console.log("Success data:", data.user); // Lấy thông tin user nếu cần
        setStatusMessage("🎉 Đăng nhập thành công!");
        // Chờ 1s để xem tin nhắn rồi mới chuyển tab
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 1000);

      } else {
        // Xử lý lỗi từ server (400, 401, 404, 500)
        // Dựa trên code Python của bạn, lỗi có thể là 'error' hoặc 'message'
        const errorMessage = data.error || data.message || "Email hoặc mật khẩu không đúng";
        setStatusMessage(errorMessage);
        //console.error("Lỗi đăng nhập - Server:", JSON.stringify(data));
      }

    } catch (error) {
      // Lỗi mạng hoặc không thể kết nối
      //console.error("Lỗi kết nối:", error);
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
        source={require("../../assets/bgimg.jpg")} // 👉 đổi path ảnh tại đây
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
          {/* Hiển thị lỗi validation email */}
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
          {/* Hiển thị lỗi validation password */}
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}

          {/* Hiển thị lỗi từ Server */}
          {statusMessage && (
            <Text style={[
              styles.statusText,
              // Đổi màu nếu là tin nhắn thành công
              { color: statusMessage.includes("thành công") ? "green" : "red" }
            ]}>
              {statusMessage}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]} // Mờ đi khi loading
            onPress={handleLogin}
            disabled={loading} // Vô hiệu hóa nút khi loading
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

// --- Thêm 2 style 'errorText' và 'statusText' ---
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
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  formContainer: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
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
    marginBottom: 6, // Giảm margin bottom
    borderWidth: 1,
    borderColor: "#ddd",
  },
  // Style cho lỗi validation (dưới ô input)
  errorText: {
    color: "red",
    fontSize: 13,
    marginBottom: 10, // Tăng margin bottom để tách biệt với ô tiếp theo
    marginLeft: 4,
  },
  // Style cho lỗi server (trên nút đăng nhập)
  statusText: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 10,
    color: "red", // Mặc định là màu đỏ
  },
  button: {
    backgroundColor: "#007BFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10, // Thêm margin top
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  linkText: {
    textAlign: "center",
    color: "#555",
  },
  linkHighlight: {
    color: "#007BFF",
    fontWeight: "600",
  },
});
