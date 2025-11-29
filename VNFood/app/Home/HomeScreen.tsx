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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Banner from "../../components/Banner/Banner";
import FoodCard, { FoodDetails } from "../../components/FoodCard/FoodCard";
import { useNavigation } from "@react-navigation/native";
import { useFood } from "../context/FoodContext";

// --- INTERFACES ---

interface Category {
  category_id: number;
  category_name: string;
  description: string | null;
  image: string | null;
}

// 👇 SỬA LỖI Ở ĐÂY: Thêm dấu ? vào các trường có thể thiếu
interface Region {
  region_id: number;
  region_name: string;
  description: string | null;
  region_image: string | null;
  parent_image?: string | null;      // Thêm dấu ?
  parent_region_id?: number | null;  // Thêm dấu ?
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
  // 1. Lấy dữ liệu từ Context (Đã clean code phần gọi API cũ)
  const { foods, categories, regions, loading } = useFood();

  // State UI
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [randomCategory, setRandomCategory] = useState<Category | null>(null);

  // 2. Logic Random Category
  useEffect(() => {
    if (categories.length > 0 && !randomCategory) {
      const nonDrink = categories.filter(
        (c) =>
          c.category_name &&
          !c.category_name.includes("Chè") &&
          !c.category_name.toLowerCase().includes("drink")
      );

      if (nonDrink.length > 0) {
        const random = Math.floor(Math.random() * nonDrink.length);
        setRandomCategory(nonDrink[random]);
      }
    }
  }, [categories]);

  // 3. Logic Filter
  const mostPopularFoods = useMemo(
    () => foods.filter((f) => f.most_popular),
    [foods]
  );

  const mostPopularDrinks = useMemo(
    () =>
      foods.filter(
        (f) =>
          f.category_name.toLowerCase().includes("drink") ||
          f.category_name.toLowerCase().includes("thức uống") ||
          f.category_name.includes("Chè")
      ),
    [foods]
  );

  const randomCategoryFoods = useMemo(() => {
    if (!randomCategory) return [];
    return foods.filter(
      (f) => f.category_name === randomCategory.category_name
    );
  }, [randomCategory, foods]);

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion(region);
    setShowLocationModal(false);
    // TODO: Có thể thêm logic navigate hoặc filter khi chọn vùng miền tại đây
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logoBanner}
          />
        </View>

        {/* Carousel Banner */}
        <Banner />

        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Where to eat local?</Text>
          <Text style={styles.welcomeSubtitle}>
            The best traditional places in Vietnam, recommended by food professionals.
          </Text>
        </View>

        {/* Main Content with Background */}
        <ImageBackground
          source={require("../../assets/bgimg.jpg")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            {/* Filter Chips */}
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

            {/* Food Lists */}
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

            <View style={{ height: 80 }} />
          </View>
        </ImageBackground>
      </ScrollView>

      {/* Modal Location */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Region</Text>
            <ScrollView style={{ maxHeight: 300 }}>
                {regions.map((region) => (
                <TouchableOpacity
                    key={region.region_id}
                    style={styles.regionItem}
                    onPress={() => handleSelectRegion(region)}
                >
                    <Text style={styles.regionText}>{region.region_name}</Text>
                </TouchableOpacity>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- STYLES (Giữ nguyên như cũ) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
  },
  welcomeContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 20,
  },
  background: {
    flex: 1,
    width: "100%",
    minHeight: 500,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  filterContainer: {
    flexDirection: "row",
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1}
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  sectionContainer: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginHorizontal: 20,
    marginBottom: 15,
    color: "#2E3A59",
    letterSpacing: 0.5,
  },
  foodList: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  noDataText: {
    margin: 20,
    color: "#888",
    textAlign: "center",
    fontStyle: 'italic'
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
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333"
  },
  regionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  regionText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#66BB6A",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HomeScreen;
