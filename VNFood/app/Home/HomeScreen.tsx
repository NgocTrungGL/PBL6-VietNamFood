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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Banner from "../../components/Banner/Banner";
import FoodCard, { FoodDetails } from "../../components/FoodCard/FoodCard";
import { useNavigation } from "@react-navigation/native";
import { API_HOME_URL } from "@env";

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
  parent_image: string | null;
  parent_region_id: number | null;
}

interface RawFood {
  food_id: number;
  name: string;
  description: string;
  main_image: string; // base64 từ API
  avg_rating: number;
  most_popular: number; // 0 hoặc 1
  category_id: number;
  origin_region_id: number;
}

// Component hiển thị 1 section món ăn
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
        <Text style={styles.noDataText}>Không tìm thấy món ăn phù hợp.</Text>
      )}
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const [foods, setFoods] = useState<RawFood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [randomCategory, setRandomCategory] = useState<Category | null>(null);

  // 👉 Cập nhật địa chỉ IP của bạn tại đây:
  const BASE_URL = `${API_HOME_URL}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [foodsRes, catRes, regRes] = await Promise.all([
          fetch(`${BASE_URL}/foods`),
          fetch(`${BASE_URL}/categories`),
          fetch(`${BASE_URL}/regions`),
        ]);

        const [foodsData, categoriesData, regionsData] = await Promise.all([
          foodsRes.json(),
          catRes.json(),
          regRes.json(),
        ]);

        setFoods(foodsData);
        setCategories(categoriesData);
        setRegions(regionsData);

        // Random category (trừ Drink hoặc trống)
        const nonDrink = categoriesData.filter(
          (c: Category) =>
            c.category_name &&
            !c.category_name.includes("Món kho") &&
            !c.category_name.toLowerCase().includes("Món ăn đường phố ")
        );

        if (nonDrink.length > 0) {
          const random = Math.floor(Math.random() * nonDrink.length);
          setRandomCategory(nonDrink[random]);
        }
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Xử lý dữ liệu thành FoodDetails để hiển thị
  const processedFoodDetails: FoodDetails[] = useMemo(() => {
    const catMap = new Map(
      categories.map((c) => [c.category_id, c.category_name])
    );
    const regMap = new Map(regions.map((r) => [r.region_id, r.region_name]));

    return foods.map((food) => ({
      ...food,
      food_id: food.food_id.toString(),
      avg_rating: food.avg_rating,
      most_popular: food.most_popular === 1,
      category_name: catMap.get(food.category_id) || "Unknown",
      region_name: regMap.get(food.origin_region_id) || "Unknown",
      // Chuyển ảnh base64 sang URI
      main_image: { uri: `data:image/jpeg;base64,${food.main_image}` },
    }));
  }, [foods, categories, regions]);

  const mostPopularFoods = useMemo(
    () => processedFoodDetails.filter((f) => f.most_popular),
    [processedFoodDetails]
  );

  const mostPopularDrinks = useMemo(
    () =>
      processedFoodDetails.filter(
        (f) =>
          f.category_name.toLowerCase().includes("drink") ||
          f.category_name.includes("Món kho")
      ),
    [processedFoodDetails]
  );

  const randomCategoryFoods = useMemo(() => {
    if (!randomCategory) return [];
    return processedFoodDetails.filter(
      (f) => f.category_name === randomCategory.category_name
    );
  }, [randomCategory, processedFoodDetails]);

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    setShowLocationModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ textAlign: "center", marginTop: 10 }}>
          Đang tải dữ liệu...
        </Text>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerContainer}>
          <Image
            // ✅ CÁCH VIẾT ĐÚNG CHO ẢNH LOCAL:
            source={require('../../assets/logo.jpg')}
            style={styles.logoBanner}
          />
        </View>

        <Banner />

        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Where to eat local?</Text>
          <Text style={styles.welcomeSubtitle}>
            The best traditional places in Vietnam, recommended by food
            professionals.
          </Text>
        </View>

        <ImageBackground
          source={require("../../assets/bgimg.jpg")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
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

      {/* Modal chọn vùng miền */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Region</Text>
            {regions.map((region) => (
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
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
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
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  headerContainer: {
    width: "100%",
    height: 90, // Chiều cao của banner, bạn chỉnh cho vừa mắt (thường 150-220)
    backgroundColor: "#fff", // Màu nền dự phòng
    overflow: "hidden", // Để ảnh không bị tràn ra khỏi bo góc
    elevation: 5, // Đổ bóng cho nổi
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoBanner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  }
});

export default HomeScreen;
