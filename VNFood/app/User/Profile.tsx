import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StatusBar,
  Alert,
  Modal, // 👇 Import Modal
  FlatList,
  ActivityIndicator,
  Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { API_HOME_URL } from "@env";
import { FoodDetails } from "../../components/FoodCard/FoodCard";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  // State lưu danh sách yêu thích thật từ API
  const [favorites, setFavorites] = useState<FoodDetails[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(true);

  // State hiển thị Modal
  const [showFavModal, setShowFavModal] = useState(false);

  const BASE_URL = API_HOME_URL || "http://192.168.1.5:5000/api";

  // --- 1. GỌI API LẤY DANH SÁCH YÊU THÍCH ---
  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        // Giả định API: GET /favorites/user/{user_id}
        // Bạn cần đảm bảo Backend có endpoint này trả về danh sách món ăn
        const res = await fetch(`${BASE_URL}/favorites/${user.user_id}`);
        const data = await res.json();

        if (Array.isArray(data)) {
            setFavorites(data);
        }
      } catch (error) {
        console.error("Lỗi tải danh sách yêu thích:", error);
      } finally {
        setLoadingFavs(false);
      }
    };

    fetchFavorites();
  }, [user]);

  // --- HELPER: Xử lý ảnh (Giống các trang khác) ---
  const getAvatarUri = () => {
    const avatar = user?.avatar;
    if (!avatar) return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
    if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
    return `data:image/jpeg;base64,${avatar}`;
  };

  const getFoodImage = (img: any) => {
    if (!img) return { uri: "https://cdn-icons-png.flaticon.com/512/135/135161.png" };
    const uri = typeof img === 'object' ? img.uri : String(img);
    if (uri.startsWith("http") || uri.startsWith("data:")) return { uri };
    return { uri: `data:image/jpeg;base64,${uri}` };
  };

  // --- HANDLERS ---
  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đồng ý", style: "destructive", onPress: () => logout() }
    ]);
  };

  const handleOpenFood = (item: FoodDetails) => {
      setShowFavModal(false); // Đóng modal trước
      navigation.navigate("FoodDetailScreen", { foodData: item });
  };

  // Tính toán hiển thị: Lấy tối đa 3 món để hiện thumbnail
  const displayedFavorites = favorites.slice(0, 3);
  const remainingCount = favorites.length > 3 ? favorites.length - 3 : 0;

  if (!user) return null;

  const avatarSource = { uri: getAvatarUri() };

  // --- RENDER MODAL ITEM ---
  const renderFavItem = ({ item }: { item: FoodDetails }) => (
    <TouchableOpacity
        style={styles.modalItem}
        onPress={() => handleOpenFood(item)}
    >
        <Image source={getFoodImage(item.main_image)} style={styles.modalItemImg} />
        <View style={{flex: 1}}>
            <Text style={styles.modalItemName}>{item.name}</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Ionicons name="star" size={12} color="#FFC107" />
                <Text style={styles.modalItemRating}> {item.avg_rating?.toFixed(1) || "N/A"}</Text>
            </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

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
            <Image
              key={user.avatar}
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
              {/* 👇 Cập nhật số lượng thật */}
              <Text style={styles.statNumber}>{favorites.length}</Text>
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

        {/* Thông tin cá nhân (Giữ nguyên) */}
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

        {/* 👇 CẬP NHẬT PHẦN YÊU THÍCH (REAL DATA) */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Món yêu thích</Text>
            <TouchableOpacity onPress={() => setShowFavModal(true)}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {loadingFavs ? (
              <ActivityIndicator size="small" color="#66BB6A" />
          ) : favorites.length > 0 ? (
              <View style={styles.favoriteList}>
                {/* Render tối đa 3 ảnh đầu tiên */}
                {displayedFavorites.map((food) => (
                    <TouchableOpacity
                        key={food.food_id}
                        onPress={() => navigation.navigate("FoodDetailScreen", { foodData: food })}
                    >
                        <Image
                            source={getFoodImage(food.main_image)}
                            style={styles.favoriteImg}
                        />
                    </TouchableOpacity>
                ))}

                {/* Ô hiển thị số lượng còn lại (nếu có) */}
                {remainingCount > 0 && (
                    <TouchableOpacity
                        style={styles.moreFavorites}
                        onPress={() => setShowFavModal(true)} // Bấm vào +... thì mở modal luôn
                    >
                        <Text style={styles.moreText}>+{remainingCount}</Text>
                    </TouchableOpacity>
                )}
              </View>
          ) : (
              <Text style={{color: '#999', fontStyle: 'italic'}}>Bạn chưa lưu món ăn nào.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{marginRight: 8}} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 👇 MODAL DANH SÁCH YÊU THÍCH */}
      <Modal
        visible={showFavModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFavModal(false)}
      >
        <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowFavModal(false)} />

            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Danh sách yêu thích ({favorites.length})</Text>
                    <TouchableOpacity onPress={() => setShowFavModal(false)}>
                        <Ionicons name="close-circle" size={28} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.food_id.toString()}
                    renderItem={renderFavItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Giữ nguyên các style cũ)
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerBackground: { height: 220, width: "100%", justifyContent: "flex-start" },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  topHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  screenTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  editButton: { backgroundColor: "rgba(255,255,255,0.2)", padding: 8, borderRadius: 12 },
  contentContainer: { flex: 1, marginTop: -60 },
  profileCard: { backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 24, paddingVertical: 30, paddingHorizontal: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, marginBottom: 20 },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: "#fff" },
  verifiedBadge: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#66BB6A", width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  fullName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  username: { fontSize: 14, color: "#888", marginBottom: 20 },
  statsContainer: { flexDirection: "row", width: "100%", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 20 },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "bold", color: "#66BB6A" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  verticalDivider: { width: 1, height: "80%", backgroundColor: "#F0F0F0" },
  section: { backgroundColor: "#fff", marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 15 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  iconBox: { width: 40, height: 40, backgroundColor: "#E8F5E9", borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 15 },
  infoContent: { flex: 1 },
  label: { fontSize: 12, color: "#888" },
  value: { fontSize: 15, color: "#333", fontWeight: "500" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  seeAll: { color: "#66BB6A", fontSize: 13, fontWeight: "600" },
  favoriteList: { flexDirection: "row", justifyContent: "flex-start" },
  favoriteImg: { width: 60, height: 60, borderRadius: 12, marginRight: 10 },
  moreFavorites: { width: 60, height: 60, borderRadius: 12, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center" },
  moreText: { color: "#888", fontWeight: "bold" },
  logoutButton: { flexDirection: "row", backgroundColor: "#FFF5F5", marginHorizontal: 20, paddingVertical: 15, borderRadius: 15, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#FFE0E0" },
  logoutText: { color: "#FF6B6B", fontWeight: "bold", fontSize: 16 },

  // 👇 STYLES MỚI CHO MODAL
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12 },
  modalItemImg: { width: 60, height: 60, borderRadius: 10, marginRight: 15 },
  modalItemName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  modalItemRating: { fontSize: 13, color: '#666', fontWeight: '600' },
});
