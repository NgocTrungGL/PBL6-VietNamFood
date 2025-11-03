import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const handleRegister = () => {
    if (!username || !email || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    // TODO: Gọi API đăng ký
    console.log("Register:", { username, email, password, fullName });
    Alert.alert("Thành công", "Đăng ký thành công!");
    navigation.navigate("LoginScreen");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ImageBackground
        source={require("../../assets/bgimg.jpg")} // 👉 thay đường dẫn ảnh nền tại đây
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

          <TextInput
            placeholder="Họ và tên"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />

          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Đăng ký</Text>
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
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)", // lớp phủ mờ để chữ rõ hơn
  },
  formContainer: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.88)", // nền trắng mờ
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#28a745",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  linkText: { textAlign: "center", color: "#555" },
  linkHighlight: { color: "#28a745", fontWeight: "600" },
});
