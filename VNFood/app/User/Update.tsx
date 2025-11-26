import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ImageBackground,
  StatusBar,
  ActivityIndicator
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
// 👇 1. Import Context
import { useAuth } from "../context/AuthContext";
import { API_UPDATE_USER_URL } from "@env";
export default function Update() {
  const navigation = useNavigation();

  // 👇 2. Lấy user hiện tại và hàm cập nhật từ Context
  const { user, updateUser } = useAuth();

  // State lưu thông tin (Khởi tạo từ user trong Context)
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false); // Loading state khi lưu

  // Chọn ảnh
  const handleChooseAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  // Xử lý cập nhật
const handleUpdate = async () => {
    if (password && password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSaving(true);

    const formData = new FormData();

    // 👇 SỬA LỖI 1: Thêm || "" vào sau các biến state
    // Để nếu nó bị undefined thì sẽ gửi chuỗi rỗng, TypeScript sẽ không báo lỗi nữa
    formData.append('username', username || "");
    formData.append('email', email || "");
    formData.append('full_name', fullName || "");

    if (password) {
        formData.append('password', password);
    }

    // Xử lý gửi ảnh
    if (avatar && avatar !== user?.avatar) {
        // 👇 SỬA LỖI 2: Xử lý filename
        // .pop() có thể trả về undefined, nên ta cần thêm || "image.jpg" để dự phòng
        const filename = avatar.split('/').pop() || "avatar.jpg";

        // Lấy đuôi file để đoán type
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-ignore: React Native FormData cần object đặc biệt này
        formData.append('avatar', {
            uri: avatar,
            name: filename, // Bây giờ filename chắc chắn là string
            type: type,
        });
    }

    try {
        // Gọi API Update (nhớ sửa đường dẫn API cho đúng id)
        // user!.user_id có dấu chấm than để khẳng định user không null
        const res = await fetch(`${API_UPDATE_USER_URL}${user!.user_id}`, {
            method: "PUT",
            body: formData,
            headers: {
                // Một số phiên bản Android cũ yêu cầu dòng này,
                // nhưng thường thì fetch tự xử lý multipart/form-data
                "Content-Type": "multipart/form-data",
            },
        });

        const data = await res.json();

        if (res.ok) {
             // Cập nhật Context
             await updateUser(data.user);
             Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
             navigation.goBack();
        } else {
             Alert.alert("Lỗi", data.message || "Cập nhật thất bại");
        }

    } catch (error) {
        console.log(error);
        Alert.alert("Lỗi", "Không thể kết nối đến máy chủ.");
    } finally {
        setIsSaving(false);
    }
  };
  const getAvatarUri = () => {
    if (!avatar) {
        return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    // Nếu đã có prefix chuẩn (do chọn ảnh mới hoặc db chuẩn) -> dùng luôn
    if (avatar.startsWith("http") || avatar.startsWith("file") || avatar.startsWith("data:")) {
        return avatar;
    }

    // Trường hợp còn lại: Raw Base64 từ DB -> Thêm prefix
    return `data:image/jpeg;base64,${avatar}`;
  };
  return (
    <ImageBackground
      source={require("../../assets/bgimg.jpg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cập nhật hồ sơ</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Ảnh đại diện */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleChooseAvatar} activeOpacity={0.8}>
            <View style={styles.avatarWrapper}>
                <Image
                  source={
                      avatar
                      ? { uri: getAvatarUri() }
                      : { uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }
                  }
                  style={styles.avatar}
                />
            </View>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form nhập thông tin */}
        <View style={styles.form}>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#66BB6A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="text-outline" size={20} color="#66BB6A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor="#999"
                />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#66BB6A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#66BB6A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Để trống nếu không đổi"
                  placeholderTextColor="#999"
                />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#66BB6A" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#999"
                />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.updateButton, isSaving && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={isSaving}
          >
            {isSaving ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.updateButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    padding: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 8,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatarWrapper: {
    padding: 4,
    backgroundColor: "#fff",
    borderRadius: 70,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#66BB6A",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: "#fff",
  },
  form: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 10,
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: "#66BB6A",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: "#66BB6A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
