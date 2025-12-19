import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ImageBackground,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Banner from "../../components/Banner/Banner";
import FoodCard, { FoodDetails } from "../../components/FoodCard/FoodCard";
import { useNavigation } from "@react-navigation/native";
import { useFood } from "../context/FoodContext";
import { useAuth } from "../context/AuthContext";
import { API_HOME_URL } from "@env";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

// --- INTERFACES ---
interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
  image: string | null;
}

interface Region {
  region_id: number;
  region_name: string;
  description: string | null;
  region_image: string | null;
  parent_image?: string | null;
  parent_region_id?: number | null;
}

// --- SUB-COMPONENT: FoodSection ---
const FoodSection: React.FC<{ title: string; data: FoodDetails[] }> = ({
  title,
  data,
}) => {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <FoodCard
              food={item}
              onPress={() =>
                navigation.navigate("FoodDetailScreen", { foodData: item })
              }
            />
          )}
          keyExtractor={(item) => item.food_id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodList}
        />
      ) : (
        <Text style={styles.noDataText}>Đang cập nhật...</Text>
      )}
    </View>
  );
};

// --- MAIN COMPONENT: HomeScreen ---
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // 1. Lấy dữ liệu từ Context
  const { foods, categories, regions, loading } = useFood();
  const { user } = useAuth();

  // State UI
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 👇 THAY ĐỔI: Lưu trữ 2 danh mục Random
  const [randomSelection, setRandomSelection] = useState<Category[]>([]);

  // State cho Modal Gợi ý
  const [showRecommendationModal, setShowRecommendationModal] = useState(false);
  const [recommendedFoods, setRecommendedFoods] = useState<FoodDetails[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // --- LOGIC GỢI Ý (Giữ nguyên) ---
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      setLoadingRecommendations(true);
      const BASE_URL = API_HOME_URL || "http://192.168.1.5:5000/api";

      try {
        const response = await fetch(`${BASE_URL}/recommend/user/${user.user_id}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.recommend_foods && data.recommend_foods.length > 0) {
                setRecommendedFoods(data.recommend_foods);
                setShowRecommendationModal(true);
            }
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoadingRecommendations(false);
      }
    };
    fetchRecommendations();
  }, [user]);

  // --- 👇 LOGIC MỚI: RANDOM 2 DANH MỤC KHÁC NHAU ---
  useEffect(() => {
    // Chỉ chạy khi có categories và chưa chọn random
    if (categories.length >= 2 && randomSelection.length === 0) {
      // 1. Copy mảng categories để không ảnh hưởng dữ liệu gốc
      const shuffled = [...categories];

      // 2. Xáo trộn mảng (Fisher-Yates shuffle hoặc sort random đơn giản)
      shuffled.sort(() => 0.5 - Math.random());

      // 3. Lấy 2 phần tử đầu tiên sau khi xáo trộn
      setRandomSelection(shuffled.slice(0, 2));
    }
  }, [categories]);

  // --- FILTERS ---
  // 1. Hàng cố định: Most Popular (Giữ nguyên)
  const mostPopularFoods = useMemo(() => foods.filter((f) => f.most_popular), [foods]);

  // 👇 2. Hàng Random 1
  const randomFoods1 = useMemo(() => {
    if (!randomSelection[0]) return [];
    // Lọc món ăn theo category_id của danh mục random thứ nhất
    return foods.filter((f) => f.category_id === randomSelection[0].category_id);
  }, [randomSelection, foods]);

  // 👇 3. Hàng Random 2
  const randomFoods2 = useMemo(() => {
    if (!randomSelection[1]) return [];
    // Lọc món ăn theo category_id của danh mục random thứ hai
    return foods.filter((f) => f.category_id === randomSelection[1].category_id);
  }, [randomSelection, foods]);


  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    setShowLocationModal(false);
  };

  const handleRecommendationPress = (item: FoodDetails) => {
    setShowRecommendationModal(false);
    navigation.navigate("FoodDetailScreen", { foodData: item });
  };

  const getFoodImageUri = (image: any) => {
      if (!image) return "https://cdn-icons-png.flaticon.com/512/135/135161.png";
      if (typeof image === 'object' && image.uri) return image.uri;
      const imgString = String(image);
      if (imgString.startsWith('http') || imgString.startsWith('data:image')) return imgString;
      return `data:image/jpeg;base64,${imgString}`;
  };

  // Loading View
  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#66BB6A" />
        <Text style={{ marginTop: 10, color: "#666" }}>Đang tải tinh hoa ẩm thực...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header Logo */}
        {/* <View style={styles.headerContainer}>
          <Image source={require('../../assets/logo.jpg')} style={styles.logoBanner} />
        </View> */}

        {/* Carousel Banner */}
        <Banner />

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Where to eat local?</Text>
          <Text style={styles.welcomeSubtitle}>The best traditional places in Vietnam, recommended by food professionals.</Text>
        </View>

        {/* Main Content */}
        <ImageBackground source={require("../../assets/bgimg.jpg")} style={styles.background} resizeMode="cover">
          <View style={styles.overlay}>
            {/* Filter Chips (Tạm ẩn như code cũ của bạn) */}
             {/* <View style={styles.filterContainer}> ... </View> */}

            {/* --- SECTION 1: CỐ ĐỊNH (MOST POPULAR) --- */}
            <FoodSection title="Most popular Vietnamese food" data={mostPopularFoods} />

            {/* --- SECTION 2: RANDOM CATEGORY 1 --- */}
            {randomSelection[0] && (
              <FoodSection
                title={`Khám phá: ${randomSelection[0].category_name}`}
                data={randomFoods1}
              />
            )}

            {/* --- SECTION 3: RANDOM CATEGORY 2 --- */}
            {randomSelection[1] && (
              <FoodSection
                title={`Bạn nên thử : ${randomSelection[1].category_name}`}
                data={randomFoods2}
              />
            )}

            {/* Padding bottom để không dính BottomTab */}
            <View style={{ height: 25 }} />
          </View>
        </ImageBackground>
      </ScrollView>

      {/* Modal Location */}
      <Modal visible={showLocationModal} animationType="slide" transparent={true} onRequestClose={() => setShowLocationModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Region</Text>
            <ScrollView style={{ maxHeight: 300 }}>
                {regions.map((region) => (
                <TouchableOpacity key={region.region_id} style={styles.regionItem} onPress={() => handleSelectRegion(region)}>
                    <Text style={styles.regionText}>{region.region_name}</Text>
                </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowLocationModal(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- RECOMMENDATION MODAL --- */}
      <Modal
        visible={showRecommendationModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRecommendationModal(false)}
      >
        <View style={styles.recModalOverlay}>
          <View style={styles.recModalContent}>

            {/* Header Xanh */}
            <View style={styles.recModalHeader}>
                <View style={{flex: 1}}>
                    <Text style={styles.recModalTitle}>Gợi ý cho bạn 🌱</Text>
                    <Text style={styles.recModalSubtitle}>Dựa trên sở thích ăn uống của bạn</Text>
                </View>
                <TouchableOpacity onPress={() => setShowRecommendationModal(false)} style={styles.closeIconBtn}>
                    <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* List Món Ăn (Max 5 món) */}
            <FlatList
                data={recommendedFoods.slice(0, 5)}
                keyExtractor={(item) => item.food_id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 15 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.recItemContainer}
                        onPress={() => handleRecommendationPress(item)}
                        activeOpacity={0.8}
                    >
                        {/* 1. Main Image */}
                        <Image
                            source={{ uri: getFoodImageUri(item.main_image) }}
                            style={styles.recItemImage}
                            resizeMode="cover"
                        />

                        <View style={styles.recItemInfo}>
                            {/* 2. Tên Món */}
                            <Text style={styles.recItemName} numberOfLines={1}>{item.name}</Text>

                            {/* 3. Mô Tả */}
                            <Text style={styles.recItemDesc} numberOfLines={2}>
                                {item.description || "Món ăn truyền thống đậm đà bản sắc Việt..."}
                            </Text>

                            {/* 4. Rating */}
                            <View style={styles.recItemMeta}>
                                <View style={styles.recRating}>
                                    <Ionicons name="star" size={10} color="#fff" />
                                    <Text style={styles.recRatingText}>{item.avg_rating ? Number(item.avg_rating).toFixed(1) : "New"}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.arrowBtn}>
                            <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
                        </View>
                    </TouchableOpacity>
                )}
            />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerContainer: { width: "100%", height: 90, backgroundColor: "#fff", overflow: "hidden", elevation: 5, zIndex: 10 },
  logoBanner: { width: "100%", height: "100%", resizeMode: "cover" },
  welcomeContainer: { paddingVertical: 15, paddingHorizontal: 15, alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  welcomeTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  welcomeSubtitle: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 5, lineHeight: 20 },
  background: { flex: 1, width: "100%", minHeight: 500 },
  overlay: { flex: 1, backgroundColor: "rgba(255,255,255,0.9)" },
  filterContainer: { flexDirection: "row", paddingVertical: 15, paddingHorizontal: 15 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: "#fff", borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: "#ddd", elevation: 2 },
  filterText: { fontSize: 13, fontWeight: "600", color: "#333" },
  sectionContainer: { marginTop: 25 },
  sectionTitle: { fontSize: 19, fontWeight: "800", marginHorizontal: 20, marginBottom: 15, color: "#2E3A59", letterSpacing: 0.5 },
  foodList: { paddingHorizontal: 20, paddingBottom: 15 },
  noDataText: { margin: 20, color: "#888", textAlign: "center", fontStyle: 'italic' },
  modalContainer: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#333" },
  regionItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  regionText: { fontSize: 16, textAlign: "center", color: "#555" },
  closeButton: { marginTop: 20, backgroundColor: "#66BB6A", padding: 15, borderRadius: 12, alignItems: "center" },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // --- STYLES MODAL RECOMMENDATION ---
  recModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  recModalContent: {
    width: '100%',
    backgroundColor: "#fff",
    borderRadius: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  recModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: "#E8F5E9",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  recModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2E7D32",
  },
  recModalSubtitle: {
    fontSize: 13,
    color: "#558B2F",
    marginTop: 4,
  },
  closeIconBtn: {
    backgroundColor: "#A5D6A7",
    padding: 5,
    borderRadius: 15,
  },

  recItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F1F8E9',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  recItemImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
    marginRight: 15,
    backgroundColor: '#fff',
  },
  recItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  recItemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 4,
  },
  recItemDesc: {
    fontSize: 12,
    color: '#558B2F',
    marginBottom: 6,
    lineHeight: 16,
  },
  recItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#66BB6A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  recRatingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 3,
  },
  arrowBtn: {
    padding: 5,
  }
});

export default HomeScreen;
