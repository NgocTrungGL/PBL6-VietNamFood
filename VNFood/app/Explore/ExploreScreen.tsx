import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  UIManager,
  ImageBackground,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFood } from "../context/FoodContext";
import { FoodDetails } from "../../components/FoodCard/FoodCard";
import { LinearGradient } from "expo-linear-gradient";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const PAGE_SIZE = 20;

const ExploreScreen = () => {
  const navigation = useNavigation<any>();
  const { foods, categories, regions, loading } = useFood();

  // --- STATE ---
  const [searchText, setSearchText] = useState("");

  // Quản lý Modal
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Quản lý Filter đang chọn
  const [selectedFilter, setSelectedFilter] = useState<{ type: 'region' | 'category', id: number, name: string } | null>(null);

  // Quản lý phân trang
  const [visibleFoodCount, setVisibleFoodCount] = useState(PAGE_SIZE);

  // --- RANDOM LOGIC ---
  // Chỉ lấy 5 category ngẫu nhiên để hiện ở màn hình chính
  const randomCategories = useMemo(() => {
    if (!categories.length) return [];
    return [...categories].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, [categories]);

  // --- FILTER & SORT LOGIC ---
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // 1. Search
    if (searchText) {
      result = result.filter(f => f.name.toLowerCase().includes(searchText.toLowerCase()));
    }

    // 2. Filter
    if (selectedFilter) {
      if (selectedFilter.type === 'region') {
        result = result.filter(f => f.region_name === selectedFilter.name);
      } else if (selectedFilter.type === 'category') {
        result = result.filter(f => f.category_name === selectedFilter.name);
      }
    }

    // 3. Sort Popular
    result.sort((a, b) => (Number(b.most_popular) - Number(a.most_popular)));

    return result;
  }, [foods, searchText, selectedFilter]);

  const displayFoods = useMemo(() => {
    return filteredFoods.slice(0, visibleFoodCount);
  }, [filteredFoods, visibleFoodCount]);

  // --- HANDLERS ---
  const handleLoadMore = () => setVisibleFoodCount(prev => prev + PAGE_SIZE);

  // Chọn từ Modal hoặc List
  const handleApplyFilter = (type: 'region' | 'category', item: any) => {
    setSelectedFilter({
        type,
        id: type === 'region' ? item.region_id : item.category_id,
        name: type === 'region' ? item.region_name : item.category_name
    });

    // Đóng tất cả modal
    setShowRegionModal(false);
    setShowCategoryModal(false);

    // Reset paging
    setVisibleFoodCount(PAGE_SIZE);
  };

  const getItemImage = (img: string | null) => {
    if (!img) return { uri: "https://cdn-icons-png.flaticon.com/512/135/135161.png" };
    if (img.startsWith("http") || img.startsWith("data:")) return { uri: img };
    return { uri: `data:image/jpeg;base64,${img}` };
  };

  // --- RENDER COMPONENTS ---

  // 1. Slim Food Card
  const renderSlimFoodCard = ({ item }: { item: FoodDetails }) => (
    <TouchableOpacity
      style={styles.slimCard}
      onPress={() => navigation.navigate("FoodDetailScreen", { foodData: item })}
      activeOpacity={0.8}
    >
      <Image source={item.main_image as any} style={styles.slimImage} />
      <View style={styles.slimContent}>
        <View style={styles.slimHeader}>
            <Text style={styles.slimName} numberOfLines={1}>{item.name}</Text>
            {item.most_popular && <Ionicons name="flame" size={16} color="#FF5722" />}
        </View>
        <Text style={styles.slimDesc} numberOfLines={2}>
            {item.description || "Hương vị truyền thống..."}
        </Text>
        <View style={styles.slimFooter}>
            <View style={styles.slimBadge}>
                <Text style={styles.slimBadgeText}>{item.category_name}</Text>
            </View>
            <View style={styles.ratingBox}>
                <Ionicons name="star" size={12} color="#FFC107" />
                <Text style={styles.ratingText}>{item.avg_rating?.toFixed(1)}</Text>
            </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 2. Category Circle Item (Màn hình chính)
  const renderRandomCategoryItem = (item: any) => {
    const isSelected = selectedFilter?.type === 'category' && selectedFilter.id === item.category_id;
    return (
        <TouchableOpacity
            key={item.category_id}
            style={styles.catItem}
            onPress={() => handleApplyFilter('category', item)}
        >
            <View style={[styles.catIconBox, isSelected && styles.activeItemBorder]}>
                <Image source={getItemImage(item.image)} style={styles.catImage} resizeMode="contain"/>
            </View>
            <Text style={[styles.catName, isSelected && styles.activeItemText]} numberOfLines={2}>{item.category_name}</Text>
        </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  return (
    <ImageBackground
        source={require('../../assets/explore-bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
    >
        <View style={styles.backgroundOverlay} />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

        {/* Header Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logoBanner}
          />
        </View>

            {/* SEARCH BAR */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm món ăn, hương vị..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#999"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText("")}>
                            <Ionicons name="close-circle" size={18} color="#ccc" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* FILTER CHIPS (Thanh công cụ) */}
            <View style={styles.filterRowContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: 20}}>
                    {/* Chip Location -> Open Modal */}
                    <TouchableOpacity
                        style={[styles.filterChip, selectedFilter?.type === 'region' && styles.activeFilterChip]}
                        onPress={() => setShowRegionModal(true)}
                    >
                        <Text style={[styles.filterChipText, selectedFilter?.type === 'region' && styles.activeFilterChipText]}>
                            📍 {selectedFilter?.type === 'region' ? selectedFilter.name : "Vùng miền"}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={selectedFilter?.type === 'region' ? "#fff" : "#666"} style={{marginLeft: 4}}/>
                    </TouchableOpacity>

                    {/* Chip Category -> Open Modal */}
                    <TouchableOpacity
                        style={[styles.filterChip, selectedFilter?.type === 'category' && styles.activeFilterChip]}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={[styles.filterChipText, selectedFilter?.type === 'category' && styles.activeFilterChipText]}>
                            🍽️ {selectedFilter?.type === 'category' ? selectedFilter.name : "Danh mục"}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={selectedFilter?.type === 'category' ? "#fff" : "#666"} style={{marginLeft: 4}}/>
                    </TouchableOpacity>

                    {/* Clear Filter */}
                    {selectedFilter && (
                        <TouchableOpacity style={styles.clearFilterChip} onPress={() => setSelectedFilter(null)}>
                            <Text style={styles.clearFilterText}>Xóa lọc</Text>
                            <Ionicons name="close" size={14} color="#FF5252" />
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* SECTION 1: DANH MỤC (Random 5) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Gợi Ý Danh Mục</Text>
                        <TouchableOpacity onPress={() => setShowCategoryModal(true)}>
                            <Text style={styles.seeAllText}>Xem tất cả</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.gridContainer}>
                        {randomCategories.map(renderRandomCategoryItem)}
                    </View>
                </View>

                {/* (ĐÃ XÓA SECTION VÙNG MIỀN Ở ĐÂY THEO YÊU CẦU) */}

                {/* SECTION 2: DANH SÁCH MÓN ĂN */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {selectedFilter ? `Kết quả: ${selectedFilter.name}` : "Khám Phá Món Ngon"}
                    </Text>
                    <Text style={styles.subText}>
                        Hiển thị {displayFoods.length} / {filteredFoods.length} kết quả
                    </Text>

                    <View style={styles.foodListContainer}>
                        {displayFoods.map((item) => (
                            <View key={item.food_id}>
                                {renderSlimFoodCard({ item })}
                            </View>
                        ))}
                    </View>

                    {/* Load More Button */}
                    {displayFoods.length < filteredFoods.length && (
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
                            <Text style={styles.loadMoreText}>Xem thêm món khác</Text>
                            <Ionicons name="chevron-down" size={16} color="#66BB6A" />
                        </TouchableOpacity>
                    )}

                    {filteredFoods.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="fast-food-outline" size={50} color="#ccc" />
                            <Text style={{color: '#999', marginTop: 10}}>Không tìm thấy món ăn nào.</Text>
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* --- MODAL 1: CHỌN VÙNG MIỀN --- */}
            <Modal
                visible={showRegionModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowRegionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowRegionModal(false)}/>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Chọn Vùng Miền</Text>
                        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                            {regions.map((region, index) => (
                                <TouchableOpacity
                                    key={region.region_id}
                                    style={[styles.modalItem, index === regions.length - 1 && { borderBottomWidth: 0 }]}
                                    onPress={() => handleApplyFilter('region', region)}
                                >
                                    <Text style={[
                                        styles.modalItemText,
                                        selectedFilter?.type === 'region' && selectedFilter.id === region.region_id && styles.modalActiveText
                                    ]}>
                                        {region.region_name}
                                    </Text>
                                    {selectedFilter?.type === 'region' && selectedFilter.id === region.region_id && (
                                        <Ionicons name="checkmark" size={18} color="#66BB6A" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowRegionModal(false)}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* --- MODAL 2: CHỌN DANH MỤC (Tương tự vùng miền nhưng có icon) --- */}
            <Modal
                visible={showCategoryModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowCategoryModal(false)}/>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tất Cả Danh Mục</Text>
                        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                            {categories.map((cat, index) => (
                                <TouchableOpacity
                                    key={cat.category_id}
                                    style={[styles.modalItem, index === categories.length - 1 && { borderBottomWidth: 0 }]}
                                    onPress={() => handleApplyFilter('category', cat)}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Image source={getItemImage(cat.image)} style={{width: 30, height: 30, marginRight: 15}} resizeMode="contain"/>
                                        <Text style={[
                                            styles.modalItemText,
                                            selectedFilter?.type === 'category' && selectedFilter.id === cat.category_id && styles.modalActiveText
                                        ]}>
                                            {cat.category_name}
                                        </Text>
                                    </View>
                                    {selectedFilter?.type === 'category' && selectedFilter.id === cat.category_id && (
                                        <Ionicons name="checkmark" size={18} color="#66BB6A" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowCategoryModal(false)}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
        </TouchableWithoutFeedback>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  backgroundOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.85)' },
  container: { flex: 1 },
  loadingContainer: { flex: 1, backgroundColor: "#fff" },


  searchSection: { paddingHorizontal: 20,paddingTop:20 , paddingBottom: 10 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25, paddingHorizontal: 15, height: 48, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },

  // --- FILTER CHIPS ---
  filterRowContainer: { marginBottom: 10, height: 40 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd', elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: {width: 0, height: 1} },
  activeFilterChip: { backgroundColor: '#66BB6A', borderColor: '#66BB6A' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  activeFilterChipText: { color: '#fff' },
  clearFilterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: '#FFCDD2' },
  clearFilterText: { fontSize: 13, color: '#FF5252', marginRight: 4, fontWeight: '500' },

  // --- SECTIONS ---
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2E3A59', letterSpacing: 0.5 },
  seeAllText: { fontSize: 13, color: '#66BB6A', fontWeight: '600' },
  subText: { fontSize: 13, color: '#666', marginBottom: 12, fontStyle: 'italic' },

  // --- CATEGORIES GRID (Random 5) ---
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  catItem: { width: (width - 40) / 5, alignItems: 'center', marginBottom: 15 },
  catIconBox: { width: 55, height: 55, borderRadius: 28, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 6, shadowColor: "#66BB6A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  activeItemBorder: { borderWidth: 2, borderColor: '#66BB6A', backgroundColor: '#F1F8E9' },
  activeItemText: { color: '#2E7D32', fontWeight: 'bold' },
  catImage: { width: 32, height: 32 },
  catName: { fontSize: 11, color: '#555', textAlign: 'center', fontWeight: '500' },

  // --- SLIM FOOD CARD ---
  foodListContainer: { gap: 15 },
  slimCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,1)' },
  slimImage: { width: 90, height: 90, borderRadius: 14, backgroundColor: '#eee' },
  slimContent: { flex: 1, marginLeft: 15, justifyContent: 'space-around', paddingVertical: 2 },
  slimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slimName: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 5 },
  slimDesc: { fontSize: 12, color: '#777', lineHeight: 16 },
  slimFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  slimBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  slimBadgeText: { fontSize: 10, color: '#2E7D32', fontWeight: '700', textTransform: 'uppercase' },
  ratingBox: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#FFC107', fontWeight: 'bold', marginLeft: 4 },

  loadMoreBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  loadMoreText: { color: '#66BB6A', fontWeight: '600', marginRight: 5, fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 20 },

  // --- MODAL STYLES (Organic) ---
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: { width: '85%', maxHeight: '70%', backgroundColor: "#fff", borderRadius: 25, padding: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 20, color: "#222" },
  modalList: { marginBottom: 20 },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0", flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemText: { fontSize: 16, color: "#555" },
  modalActiveText: { color: '#66BB6A', fontWeight: 'bold' },
  closeButton: { backgroundColor: "#66BB6A", paddingVertical: 15, borderRadius: 15, alignItems: "center", width: '100%' },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    headerContainer: {
    width: "100%",
    height: 90,
    backgroundColor: "#fff",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  logoBanner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  }
});

export default ExploreScreen;
