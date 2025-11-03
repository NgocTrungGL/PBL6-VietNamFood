import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Banner from "../../components/Banner/Banner";
import FoodCard, { FoodDetails } from "../../components/FoodCard/FoodCard";
import { useNavigation } from "@react-navigation/native";

// ----------------- NEW API INTERFACES -----------------
// (Dựa trên JSON bạn cung cấp, bỏ qua timestamps)

interface Category {
  category_id: number;
  category_name: string;
  description: string;
  image: string; // Sẽ dùng string, nhưng mock data tạm dùng require
}

interface Region {
  region_id: number;
  region_name: string;
  description: string;
  region_image: string; // Sẽ dùng string, nhưng mock data tạm dùng require
  parent_image: string | null;
  parent_region_id: number | null;
}

// Interface cho dữ liệu Food thô từ API
interface RawFood {
  food_id: number; // API mới dùng number
  category_id: number;
  name: string;
  description: string;
  main_image: any; // Tạm dùng 'any' để chứa 'require' cho UI
  origin_region_id: number;
  avg_rating: number;
  most_popular: boolean;
}

// ----------------- MOCK DATA (THEO CẤU TRÚC API MỚI) -----------------

const mockCategories: Category[] = [
  {
    category_id: 1,
    category_name: "Noodles",
    description: "Các món mì, phở, bún",
    image: "base64-string-or-url",
  },
  {
    category_id: 2,
    category_name: "Drink",
    description: "Các loại đồ uống",
    image: "base64-string-or-url",
  },
  {
    category_id: 3,
    category_name: "Rice",
    description: "Các món cơm",
    image: "base64-string-or-url",
  },
  {
    category_id: 4,
    category_name: "Appetizer",
    description: "Các món khai vị",
    image: "base64-string-or-url",
  },
  {
    category_id: 5,
    category_name: "Pancake",
    description: "Các loại bánh xèo, bánh khọt",
    image: "base64-string-or-url",
  },
];

const mockRegions: Region[] = [
  {
    region_id: 101,
    region_name: "Hà Nội",
    description: "Ẩm thực thủ đô",
    region_image: "url-or-base64",
    parent_image: "url-or-base64",
    parent_region_id: 1, // Giả sử 1 là "Miền Bắc"
  },
  {
    region_id: 102,
    region_name: "Huế",
    description: "Ẩm thực Cố đô",
    region_image: "url-or-base64",
    parent_image: "url-or-base64",
    parent_region_id: 2, // Giả sử 2 là "Miền Trung"
  },
  {
    region_id: 103,
    region_name: "Sài Gòn",
    description: "Ẩm thực phương Nam",
    region_image: "url-or-base64",
    parent_image: "url-or-base64",
    parent_region_id: 3, // Giả sử 3 là "Miền Nam"
  },
  {
    region_id: 104,
    region_name: "Đà Nẵng",
    description: "Ẩm thực miền Trung",
    region_image: "url-or-base64",
    parent_image: "url-or-base64",
    parent_region_id: 2,
  },
  {
    region_id: 105,
    region_name: "Miền Tây",
    description: "Ẩm thực sông nước",
    region_image: "url-or-base64",
    parent_image: "url-or-base64",
    parent_region_id: 3,
  },
];

// Dữ liệu Food thô (như từ API)
const mockRawFoods: RawFood[] = [
  {
    food_id: 1,
    name: "Phở Bò",
    main_image: require("../../assets/images/bunbo.jpg"),
    avg_rating: 4.8,
    most_popular: true,
    category_id: 1, // Noodles
    origin_region_id: 101, // Hà Nội
    description: "Phở bò truyền thống Hà Nội",
  },
  {
    food_id: 2,
    name: "Bún Chả",
    main_image: require("../../assets/images/buncha.jpg"),
    avg_rating: 4.7,
    most_popular: true,
    category_id: 1, // Noodles
    origin_region_id: 101, // Hà Nội
    description: "Bún chả que tre",
  },
  {
    food_id: 3,
    name: "Cà Phê Sữa Đá",
    main_image: require("../../assets/banners/banhmi.webp"),
    avg_rating: 4.9,
    most_popular: true,
    category_id: 2, // Drink
    origin_region_id: 103, // Sài Gòn
    description: "Cà phê sữa đá Sài Gòn",
  },
  {
    food_id: 4,
    name: "Cơm Tấm Sườn Bì Chả",
    main_image: require("../../assets/images/comtam.jpg"),
    avg_rating: 4.7,
    most_popular: true,
    category_id: 3, // Rice
    origin_region_id: 103, // Sài Gòn
    description: "Cơm tấm sườn bì chả ốp la",
  },
  {
    food_id: 5,
    name: "Trà Chanh",
    main_image: require("../../assets/images/goicuon.jpg"),
    avg_rating: 4.5,
    most_popular: false,
    category_id: 2, // Drink
    origin_region_id: 101, // Hà Nội
    description: "Trà chanh vỉa hè",
  },
  {
    food_id: 6,
    name: "Bánh Xèo",
    main_image: require("../../assets/images/banhxeo.webp"),
    avg_rating: 4.6,
    most_popular: false,
    category_id: 5, // Pancake
    origin_region_id: 105, // Miền Tây
    description: "Bánh xèo miền Tây giòn rụm",
  },
  {
    food_id: 7,
    name: "Mì Quảng",
    main_image: require("../../assets/images/miquang.webp"),
    avg_rating: 4.7,
    most_popular: true,
    category_id: 1, // Noodles
    origin_region_id: 104, // Đà Nẵng
    description: "Mì Quảng ếch đặc sản",
  },
  {
    food_id: 8,
    name: "Chả Giò (Nem Rán)",
    main_image: require("../../assets/images/chagio.jpg"),
    avg_rating: 4.5,
    most_popular: false,
    category_id: 4, // Appetizer
    origin_region_id: 101, // Hà Nội
    description: "Chả giò giòn tan",
  },
];

// ----------------- COMPONENT: FoodSection -----------------
interface FoodSectionProps {
  title: string;
  data: FoodDetails[]; // Vẫn dùng FoodDetails mà FoodCard yêu cầu
}

const FoodSection: React.FC<FoodSectionProps> = ({ title, data }) => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {data.length > 0 ? (
        <FlatList
          data={data}
          renderItem={({ item }) => (
            // *** ĐÃ CẬP NHẬT Ở ĐÂY ***
            // Sử dụng trực tiếp prop 'onPress' của FoodCard
            <FoodCard
              food={item}
              onPress={() =>
                navigation.navigate("FoodDetailScreen", { foodData: item })
              }
            />
          )}
          // API mới dùng food_id là number, keyExtractor cần convert sang string
          keyExtractor={(item) => item.food_id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.foodList}
        />
      ) : (
        <Text style={styles.noDataText}>Không tìm thấy món ăn phù hợp.</Text>
      )}
    </View>
  );
};

// ----------------- COMPONENT: HomeScreen -----------------
const HomeScreen: React.FC = () => {
  const [randomCategory, setRandomCategory] = useState<Category | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // Random category (trừ Drink) - Dùng mockCategories mới
  useEffect(() => {
    const nonDrinkCategories = mockCategories.filter(
      (c) => c.category_name.toLowerCase() !== "drink"
    );
    if (nonDrinkCategories.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonDrinkCategories.length);
      setRandomCategory(nonDrinkCategories[randomIndex]);
    }
  }, []);

  // *** LOGIC QUAN TRỌNG ***
  // Xử lý (join) dữ liệu thô để tạo ra FoodDetails mà UI cần
  // Đây là bước đệm trước khi chuyển sang API thật
  const processedFoodDetails: FoodDetails[] = useMemo(() => {
    // Tạo lookup maps để 'join' dữ liệu hiệu quả
    const categoryMap = new Map(
      mockCategories.map((c) => [c.category_id, c.category_name])
    );
    const regionMap = new Map(
      mockRegions.map((r) => [r.region_id, r.region_name])
    );

    return mockRawFoods.map((food) => ({
      ...food,
      // Chuyển đổi food_id (number) sang string để khớp với interface FoodDetails cũ
      food_id: food.food_id.toString(),

      // Thêm category_name và region_name mà FoodCard/FoodSection cần
      category_name: categoryMap.get(food.category_id) || "Unknown Category",
      region_name: regionMap.get(food.origin_region_id) || "Unknown Region",

      // Thêm các trường khác nếu FoodDetails yêu cầu
      // ví dụ: description (đã có sẵn trong RawFood)
    }));
  }, []); // Phụ thuộc rỗng vì data là mock (không đổi)

  // Các bộ lọc (useMemo) bâyG giờ sẽ dùng 'processedFoodDetails'
  const mostPopularFoods = useMemo(
    () => processedFoodDetails.filter((f) => f.most_popular),
    [processedFoodDetails]
  );

  const mostPopularDrinks = useMemo(
    () =>
      processedFoodDetails.filter(
        (f) => f.category_name.toLowerCase() === "drink"
      ),
    [processedFoodDetails]
  );

  const randomCategoryFoods = useMemo(() => {
    if (!randomCategory) return [];
    return processedFoodDetails.filter(
      (f) => f.category_id === randomCategory.category_id
    );
  }, [randomCategory, processedFoodDetails]);

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    setShowLocationModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 0,
          marginBottom: 0,
        }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#4CAF50", "#66BB6A", "#81C784"]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerText}>🇻🇳 Ẩm Thực Việt Nam</Text>
          <Text style={styles.headerSubtext}>
            Khám phá hương vị truyền thống
          </Text>
        </LinearGradient>

        {/* Banner */}
        <Banner />

        {/* Giới thiệu */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Where to eat local?</Text>
          <Text style={styles.welcomeSubtitle}>
            The best traditional places in Vietnam, recommended by food
            professionals.
          </Text>
        </View>

        {/* Ảnh nền */}
        <ImageBackground
          source={require("../../assets/bgimg.jpg")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            {/* Bộ lọc */}
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowLocationModal(true)}
              >
                <Text style={styles.filterText}>
                  📍 {selectedRegion ? selectedRegion.region_name : "Location"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>⭐ Popularity</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.filterButton}>
                <Text style={styles.filterText}>🍽️ Category</Text>
              </TouchableOpacity>
            </View>

            {/* Sections (Dùng dữ liệu đã qua xử lý) */}
            <FoodSection
              title="Most popular Vietnamese food"
              data={mostPopularFoods}
            />
            <FoodSection
              title="Most popular Vietnamese drinks"
              data={mostPopularDrinks}
            />
            {randomCategory && (
              <FoodSection
                title={`Most popular Vietnamese ${randomCategory.category_name}`}
                data={randomCategoryFoods}
              />
            )}
          </View>
        </ImageBackground>
      </ScrollView>

      {/* Modal chọn vùng miền (Dùng mockRegions mới) */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Region</Text>

            {mockRegions.map((region) => (
              <TouchableOpacity
                key={region.region_id}
                style={styles.regionItem}
                onPress={() => handleSelectRegion(region)}
              >
                <Text style={styles.regionText}>{region.region_name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingBottom: 0,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  welcomeContainer: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    marginTop: -10, // dính sát banner
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginTop: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 15,
    color: "#333",
  },
  foodList: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  noDataText: {
    margin: 20,
    color: "#888",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  regionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  regionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    marginTop: 0,
    paddingTop: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});

export default HomeScreen;
