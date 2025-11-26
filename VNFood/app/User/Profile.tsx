import React, { useEffect } from "react"; // Thêm useEffect để debug nếu cần
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  // Dữ liệu giả lập favorites
  const recentFavorites = [
    { id: 1, img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Pho_xe_lua.jpg/640px-Pho_xe_lua.jpg" },
    { id: 2, img: "https://cdn.tgdd.vn/Files/2022/01/25/1412805/cach-nau-bun-bo-hue-ngon-chuan-vi-hue-tai-nha-202201250230038502.jpg" },
    { id: 3, img: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Banh_mi_thit_nuong.jpg" },
  ];

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", style: "destructive", onPress: () => logout() }
    ]);
  };

  // Debug: Kiểm tra xem user.avatar có thay đổi không khi quay lại màn hình này
  // useEffect(() => {
  //   console.log("Profile Avatar Updated:", user?.avatar ? "Has Data" : "Null");
  // }, [user?.avatar]);

  if (!user) return null;
  const getAvatarUri = () => {
    const avatar = user.avatar;

    // 1. Nếu không có avatar -> Trả về ảnh mặc định
    if (!avatar) {
        return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    }

    // 2. Nếu là link ảnh online (http...) -> Dùng luôn
    if (avatar.startsWith("http")) {
        return avatar;
    }

    // 3. Nếu là Base64 nhưng ĐÃ CÓ prefix -> Dùng luôn
    if (avatar.startsWith("data:image")) {
        return avatar;
    }

    // 4. TRƯỜNG HỢP CỦA BẠN: Base64 thiếu prefix -> Cộng chuỗi vào
    return `data:image/jpeg;base64,${avatar}`;
  };
  // 👇 SỬA LỖI: Tạo đường dẫn ảnh an toàn
  // Nếu user.avatar có dữ liệu (base64 hoặc url) thì dùng, không thì dùng ảnh mặc định
  const avatarSource = { uri: getAvatarUri() };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={require("../../assets/bgimg.jpg")}
        style={styles.headerBackground}
      >
        <View style={styles.headerOverlay} />

        <View style={styles.topHeader}>
          <Text style={styles.screenTitle}>Hồ sơ của tôi</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("Update", { user })}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {/* 👇 QUAN TRỌNG: Thêm prop `key` */}
            <Image
              key={user.avatar} // Khi avatar string thay đổi, key thay đổi -> React xóa ảnh cũ, vẽ ảnh mới ngay lập tức
              source={avatarSource}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
               <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          </View>

          <Text style={styles.fullName}>{user.full_name || "Người dùng"}</Text>
          <Text style={styles.username}>@{user.username}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{(user as any).favorites_count || 0}</Text>
              <Text style={styles.statLabel}>Món yêu thích</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {(user as any).created_at
                    ? new Date((user as any).created_at).toLocaleDateString('vi-VN')
                    : "Mới tham gia"}
              </Text>
              <Text style={styles.statLabel}>Ngày tham gia</Text>
            </View>
          </View>
        </View>

        {/* ... Các phần khác giữ nguyên ... */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
                <Ionicons name="mail" size={20} color="#66BB6A" />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.iconBox}>
                <Ionicons name="call" size={20} color="#66BB6A" />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.label}>Số điện thoại</Text>
                <Text style={styles.value}>
                    {(user as any).phone || "Chưa cập nhật"}
                </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Món ngon đã lưu</Text>
            <TouchableOpacity>
                <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.favoriteList}>
            {recentFavorites.map((food) => (
                <Image
                    key={food.id}
                    source={{ uri: food.img }}
                    style={styles.favoriteImg}
                />
            ))}
            <View style={styles.moreFavorites}>
                <Text style={styles.moreText}>+12</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{marginRight: 8}} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ... (Styles giữ nguyên như cũ)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerBackground: {
    height: 220,
    width: "100%",
    justifyContent: "flex-start",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  editButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
  },
  contentContainer: {
    flex: 1,
    marginTop: -60,
  },
  profileCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#66BB6A",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  fullName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  username: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#66BB6A",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  verticalDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#F0F0F0",
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#888",
  },
  value: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  seeAll: {
    color: "#66BB6A",
    fontSize: 13,
    fontWeight: "600",
  },
  favoriteList: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  favoriteImg: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
  },
  moreFavorites: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: "#888",
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#FFF5F5",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },
  logoutText: {
    color: "#FF6B6B",
    fontWeight: "bold",
    fontSize: 16,
  },
});
