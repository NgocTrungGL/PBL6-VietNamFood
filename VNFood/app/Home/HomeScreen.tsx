import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Banner from "../../components/Banner/Banner";
import { LinearGradient } from "expo-linear-gradient"; // Nếu sử dụng Expo

const { width } = Dimensions.get("window");

const foods = [
  {
    id: "1",
    name: "Phở Bò",
    price: "50.000đ",
    image: require("../../assets/images/bunbo.jpg"),
    description: "Món phở truyền thống Hà Nội",
    category: "Noodles",
    rating: 4.8,
  },
  {
    id: "2",
    name: "Bún Chả",
    price: "45.000đ",
    image: require("../../assets/images/buncha.jpg"),
    description: "Đặc sản nướng than hoa",
    category: "Noodles",
    rating: 4.7,
  },
  {
    id: "3",
    name: "Bánh Mì",
    price: "20.000đ",
    image: require("../../assets/banners/banhmi.webp"),
    description: "Bánh mì thịt nguội truyền thống",
    category: "Sandwich",
    rating: 4.6,
  },
  {
    id: "4",
    name: "Cơm Tấm",
    price: "40.000đ",
    image: require("../../assets/images/comtam.jpg"),
    description: "Cơm tấm sườn nướng",
    category: "Rice",
    rating: 4.5,
  },
  {
    id: "5",
    name: "Gỏi Cuốn",
    price: "30.000đ",
    image: require("../../assets/images/goicuon.jpg"),
    description: "Gỏi cuốn tôm thịt tươi ngon",
    category: "Appetizer",
    rating: 4.4,
  },
  {
    id: "6",
    name: "Bánh Xèo",
    price: "35.000đ",
    image: require("../../assets/images/banhxeo.webp"),
    description: "Bánh xèo miền Tây giòn rụm",
    category: "Pancake",
    rating: 4.6,
  },
  {
    id: "7",
    name: "Mì Quảng",
    price: "45.000đ",
    image: require("../../assets/images/miquang.webp"),
    description: "Mì Quảng đặc sản miền Trung",
    category: "Noodles",
    rating: 4.7,
  },
  {
    id: "8",
    name: "Chả Giò",
    price: "25.000đ",
    image: require("../../assets/images/chagio.jpg"),
    description: "Chả giò chiên giòn tan",
    category: "Appetizer",
    rating: 4.3,
  },
];

const categories = [
  { id: "all", name: "Tất cả", icon: "🍽️" },
  { id: "noodles", name: "Bún/Phở", icon: "🍜" },
  { id: "rice", name: "Cơm", icon: "🍚" },
  { id: "appetizer", name: "Khai vị", icon: "🥟" },
  { id: "hotpot", name: "Lẩu", icon: "🍲" },
];

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Food {
  id: string;
  name: string;
  price: string;
  image: any;
  description: string;
  category: string;
  rating: number;
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const filteredFoods =
    selectedCategory === "all"
      ? foods
      : foods.filter(
          (food) => food.category.toLowerCase() === selectedCategory
        );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.foodImage} />
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.foodName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.foodDescription} numberOfLines={1}>
          {item.description}
        </Text>

        <View style={styles.priceContainer}>
          <Text style={styles.foodPrice}>{item.price}</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header với gradient */}
      <LinearGradient
        colors={["#FF5722", "#FF7043", "#FF8A65"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerText}>🇻🇳 Ẩm Thực Việt Nam</Text>
        <Text style={styles.headerSubtext}>Khám phá hương vị truyền thống</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <Banner />

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Chào mừng đến với</Text>
          <Text style={styles.welcomeSubtitle}>
            Thế giới ẩm thực Việt Nam! 🍲
          </Text>
        </View>

        {/* Categories */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Danh mục món ăn</Text>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Food List */}
        <View style={styles.foodSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === "all"
              ? "Tất cả món ăn"
              : `Danh sách ${categories.find((c) => c.id === selectedCategory)?.name}`}
          </Text>
          <FlatList
            data={filteredFoods}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.foodList}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

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
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
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
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  welcomeTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  categorySection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    marginHorizontal: 20,
    color: "#333",
  },
  categoryList: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 5,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    minWidth: 80,
  },
  categoryItemActive: {
    backgroundColor: "#FF5722",
    borderColor: "#FF5722",
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  categoryTextActive: {
    color: "#fff",
  },
  foodSection: {
    marginTop: 10,
  },
  foodList: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  imageContainer: {
    position: "relative",
  },
  foodImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  cardContent: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5722",
  },
  addButton: {
    backgroundColor: "#FF5722",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
