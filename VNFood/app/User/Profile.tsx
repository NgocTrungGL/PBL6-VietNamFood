import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Pencil } from "lucide-react-native"; // Icon cây bút ✏️

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  // Dữ liệu mẫu (sau này bạn sẽ lấy từ API)
  const user = {
    username: "ngoctung",
    email: "ngoctung@example.com",
    full_name: "Ngọc Tùng",
    avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // ảnh avatar mẫu
  };

  return (
    <View style={styles.container}>
      {/* Header với nút Edit */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ cá nhân</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("Update", { user })}
        >
          <Pencil size={22} color="#007BFF" />
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>

      {/* Thông tin người dùng */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Tên người dùng</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Họ và tên</Text>
          <Text style={styles.value}>{user.full_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  editButton: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 5,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#007BFF",
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  infoRow: {
    marginBottom: 15,
  },
  label: {
    color: "#888",
    fontSize: 14,
  },
  value: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
});
