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

// ----------------- INTERFACES -----------------
interface Category {
  category_id: number;
  category_name: string;
}

interface Region {
  region_id: number;
  region_name: string;
}

// ----------------- MOCK DATA -----------------
const mockCategories: Category[] = [
  { category_id: 1, category_name: "Noodles" },
  { category_id: 2, category_name: "Drink" },
  { category_id: 3, category_name: "Rice" },
  { category_id: 4, category_name: "Appetizer" },
  { category_id: 5, category_name: "Pancake" },
];

const mockRegions: Region[] = [
  { region_id: 101, region_name: "Hà Nội" },
  { region_id: 102, region_name: "Huế" },
  { region_id: 103, region_name: "Sài Gòn" },
  { region_id: 104, region_name: "Đà Nẵng" },
  { region_id: 105, region_name: "Miền Tây" },
];

const mockFoodDetails: FoodDetails[] = [
  {
    food_id: "1",
    name: "Phở Bò",
    main_image: require("../../assets/images/bunbo.jpg"),
    avg_rating: 4.8,
    most_popular: true,
    category_id: 1,
    category_name: "Noodles",
    region_name: "Hà Nội",
  },
  {
    food_id: "2",
    name: "Bún Chả",
    main_image: require("../../assets/images/buncha.jpg"),
    avg_rating: 4.7,
    most_popular: true,
    category_id: 1,
    category_name: "Noodles",
    region_name: "Hà Nội",
  },
  {
    food_id: "3",
    name: "Cà Phê Sữa Đá",
    main_image: require("../../assets/banners/banhmi.webp"),
    avg_rating: 4.9,
    most_popular: true,
    category_id: 2,
    category_name: "Drink",
    region_name: "Sài Gòn",
  },
  {
    food_id: "4",
    name: "Cơm Tấm Sườn Bì Chả",
    main_image: require("../../assets/images/comtam.jpg"),
    avg_rating: 4.7,
    most_popular: true,
    category_id: 3,
    category_name: "Rice",
    region_name: "Sài Gòn",
  },
  {
    food_id: "5",
    name: "Trà Chanh",
    main_image: require("../../assets/images/goicuon.jpg"),
    avg_rating: 4.5,
    most_popular: false,
    category_id: 2,
    category_name: "Drink",
    region_name: "Hà Nội",
  },
  {
    food_id: "6",
    name: "Bánh Xèo",
    main_image: require("../../assets/images/banhxeo.webp"),
    avg_rating: 4.6,
    most_popular: false,
    category_id: 5,
    category_name: "Pancake",
    region_name: "Miền Tây",
  },
  {
    food_id: "7",
    name: "Mì Quảng",
    main_image: require("../../assets/images/miquang.webp"),
    avg_rating: 4.7,
    most_popular: true,
    category_id: 1,
    category_name: "Noodles",
    region_name: "Đà Nẵng",
  },
  {
    food_id: "8",
    name: "Chả Giò (Nem Rán)",
    main_image: require("../../assets/images/chagio.jpg"),
    avg_rating: 4.5,
    most_popular: false,
    category_id: 4,
    category_name: "Appetizer",
    region_name: "Hà Nội",
  },
];

// ----------------- COMPONENT: FoodSection -----------------
interface FoodSectionProps {
  title: string;
  data: FoodDetails[];
}

const FoodSection: React.FC<FoodSectionProps> = ({ title, data }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {data.length > 0 ? (
      <FlatList
        data={data}
        renderItem={({ item }) => <FoodCard food={item} />}
        keyExtractor={(item) => item.food_id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.foodList}
      />
    ) : (
      <Text style={styles.noDataText}>Không tìm thấy món ăn phù hợp.</Text>
    )}
  </View>
);

// ----------------- COMPONENT: HomeScreen -----------------
const HomeScreen: React.FC = () => {
  const [randomCategory, setRandomCategory] = useState<Category | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  // Random category (trừ Drink)
  useEffect(() => {
    const nonDrinkCategories = mockCategories.filter(
      (c) => c.category_name.toLowerCase() !== "drink"
    );
    if (nonDrinkCategories.length > 0) {
      const randomIndex = Math.floor(Math.random() * nonDrinkCategories.length);
      setRandomCategory(nonDrinkCategories[randomIndex]);
    }
  }, []);

  const mostPopularFoods = useMemo(
    () => mockFoodDetails.filter((f) => f.most_popular),
    []
  );

  const mostPopularDrinks = useMemo(
    () =>
      mockFoodDetails.filter((f) => f.category_name.toLowerCase() === "drink"),
    []
  );

  const randomCategoryFoods = useMemo(() => {
    if (!randomCategory) return [];
    return mockFoodDetails.filter(
      (f) => f.category_id === randomCategory.category_id
    );
  }, [randomCategory]);

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

            {/* Sections */}
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
