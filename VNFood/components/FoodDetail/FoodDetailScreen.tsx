import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { FoodDetails } from "../FoodCard/FoodCard"; // Import interface từ FoodCard
import Banner from "../../components/Banner/Banner";
// ----------------- INTERFACES (Cho dữ liệu hard-code) -----------------
interface FoodImage {
  image_id: number;
  food_id: number; // Sẽ khớp với food_id từ API (là number)
  image_data: any; // Dùng 'any' để chứa 'require' cho UI dev
  caption: string;
}

interface Review {
  review_id: number;
  user_id: number;
  food_id: number;
  rating: number;
  comment: string;
  user_name: string; // Thêm tên và avatar cho UI
  user_avatar: string; // Tạm thời dùng ký tự đầu
}

interface NutritionInfo {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

// ----------------- MOCK DATA (Hard-code cho màn hình Detail) -----------------
// (Sau này sẽ fetch theo food_id)

const allMockImages: FoodImage[] = [
  // Cơm tấm (food_id: 4)
  {
    image_id: 1,
    food_id: 4,
    image_data: require("../../assets/images/comtam.jpg"),
    caption: "Cơm tấm sườn bì chả ốp la",
  },
  {
    image_id: 2,
    food_id: 4,
    image_data: require("../../assets/images/chagio.jpg"), // Ảnh minh họa
    caption: "Món ăn kèm chả giò",
  },
  // Phở Bò (food_id: 1)
  {
    image_id: 3,
    food_id: 1,
    image_data: require("../../assets/images/bunbo.jpg"),
    caption: "Tô phở bò nóng hổi",
  },
  {
    image_id: 4,
    food_id: 1,
    image_data: require("../../assets/images/buncha.jpg"), // Ảnh minh họa
    caption: "Nước lèo trong và thơm",
  },
  // Cà Phê (food_id: 3)
  {
    image_id: 5,
    food_id: 3,
    image_data: require("../../assets/banners/banhmi.webp"),
    caption: "Ly cà phê sữa đá đậm đà",
  },
  // Mì Quảng (food_id: 7)
  {
    image_id: 6,
    food_id: 7,
    image_data: require("../../assets/images/miquang.webp"),
    caption: "Mì Quảng ếch đặc sản",
  },
];

const allMockReviews: Review[] = [
  {
    review_id: 1,
    user_id: 5,
    food_id: 4, // Cơm tấm
    rating: 5,
    comment: "Cơm tấm ngon đúng chuẩn Sài Gòn, sườn mềm và thơm!",
    user_name: "Anh Tuấn",
    user_avatar: "T",
  },
  {
    review_id: 2,
    user_id: 8,
    food_id: 3, // Cà phê
    rating: 4,
    comment: "Cà phê đậm đà, nhưng hơi ngọt so với mình.",
    user_name: "Chị Lan",
    user_avatar: "L",
  },
  {
    review_id: 3,
    user_id: 9,
    food_id: 1, // Phở
    rating: 5,
    comment: "Nước phở thanh, thịt bò mềm. Tuyệt vời!",
    user_name: "Minh",
    user_avatar: "M",
  },
  {
    review_id: 4,
    user_id: 10,
    food_id: 4, // Cơm tấm
    rating: 4,
    comment: "Quán phục vụ nhanh, cơm ngon, giá hợp lý. Sẽ quay lại.",
    user_name: "Phương",
    user_avatar: "P",
  },
  {
    review_id: 5,
    user_id: 11,
    food_id: 7, // Mì Quảng
    rating: 5,
    comment: "Mì quảng ếch ở đây là số 1!",
    user_name: "Hải",
    user_avatar: "H",
  },
];

// Dinh dưỡng (Key là food_id)
const allNutrition: { [key: number]: NutritionInfo } = {
  1: { calories: "450 kcal", protein: "25g", carbs: "40g", fat: "20g" }, // Phở
  2: { calories: "500 kcal", protein: "20g", carbs: "55g", fat: "22g" }, // Bún Chả
  3: { calories: "150 kcal", protein: "3g", carbs: "20g", fat: "5g" }, // Cà Phê
  4: { calories: "600 kcal", protein: "35g", carbs: "55g", fat: "28g" }, // Cơm Tấm
  5: { calories: "120 kcal", protein: "1g", carbs: "30g", fat: "0g" }, // Trà Chanh
  6: { calories: "350 kcal", protein: "10g", carbs: "30g", fat: "20g" }, // Bánh Xèo
  7: { calories: "480 kcal", protein: "28g", carbs: "45g", fat: "20g" }, // Mì Quảng
  8: { calories: "200 kcal", protein: "8g", carbs: "15g", fat: "12g" }, // Chả Giò
};

// ----------------- TYPE DEFINITIONS (Navigation) -----------------
type RootStackParamList = {
  FoodDetail: { foodData: FoodDetails };
  // Thêm các screen khác nếu cần
};
type FoodDetailRouteProp = RouteProp<RootStackParamList, "FoodDetail">;

const { width: screenWidth } = Dimensions.get("window");

// ----------------- COMPONENT: FoodDetailScreen -----------------
const FoodDetailScreen: React.FC = () => {
  const route = useRoute<FoodDetailRouteProp>();
  const navigation = useNavigation<any>(); // Dùng 'any' cho đơn giản
  const { foodData } = route.params;

  // Lấy ID (dưới dạng số) từ foodData (dưới dạng string)
  const currentFoodId = parseInt(foodData.food_id, 10);

  // Lọc dữ liệu dựa trên ID của món ăn
  // (useMemo để tránh tính toán lại không cần thiết)
  const foodImages = useMemo(() => {
    const relatedImages = allMockImages.filter(
      (img) => img.food_id === currentFoodId
    );
    // Nếu không có ảnh phụ, dùng ảnh chính
    if (relatedImages.length === 0) {
      return [
        {
          image_id: 999,
          food_id: currentFoodId,
          image_data: foodData.main_image,
          caption: foodData.name,
        },
      ];
    }
    return relatedImages;
  }, [currentFoodId, foodData.main_image, foodData.name]);

  const reviews = useMemo(
    () => allMockReviews.filter((rev) => rev.food_id === currentFoodId),
    [currentFoodId]
  );

  const nutrition = useMemo(
    () => allNutrition[currentFoodId] || null,
    [currentFoodId]
  );

  // --- Handlers ---
  const handleGoToRecipes = () => {
    console.log("Navigate to Recipes for food_id:", currentFoodId);
    // navigation.navigate('Recipe', { foodId: currentFoodId });
  };

  const handleReview = () => {
    console.log("Open Review modal");
  };

  const handleWannaTry = () => {
    console.log("Add to 'Wanna Try' list");
  };

  // --- Render Functions ---
  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{item.user_avatar}</Text>
        </View>
        <View>
          <Text style={styles.reviewUserName}>{item.user_name}</Text>
          <Text style={styles.reviewRating}>
            {"⭐".repeat(item.rating)}
            {"☆".repeat(5 - item.rating)}
          </Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 1. Banner (FlatList) */}
        <Banner />

        {/* 2. Content */}
        <View style={styles.contentContainer}>
          {/* Category */}
          <Text style={styles.categoryName}>{foodData.category_name}</Text>

          {/* Food Name */}
          <Text style={styles.foodName}>{foodData.name}</Text>

          {/* Description (Đã có sẵn trong foodData từ HomeScreen) */}
          <Text style={styles.description}>
            {(foodData as any).description ||
              "Mô tả chi tiết cho món ăn này đang được cập nhật. Đây là một món ăn truyền thống nổi tiếng của Việt Nam."}
          </Text>

          {/* Nutrition Info */}
          {nutrition && (
            <>
              <Text style={styles.sectionTitle}>Thông tin dinh dưỡng</Text>
              <View style={styles.nutritionContainer}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                  <Text style={styles.nutritionValue}>
                    {nutrition.calories}
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                  <Text style={styles.nutritionValue}>{nutrition.protein}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                  <Text style={styles.nutritionValue}>{nutrition.carbs}</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                  <Text style={styles.nutritionValue}>{nutrition.fat}</Text>
                </View>
              </View>
            </>
          )}

          {/* Recipe Button */}
          <TouchableOpacity onPress={handleGoToRecipes}>
            <LinearGradient
              colors={["#4CAF50", "#66BB6A"]}
              style={styles.recipeButton}
            >
              <Text style={styles.recipeButtonText}>Xem công thức 🍲</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Rating & Actions */}
          <Text style={styles.sectionTitle}>Đánh giá & Phản hồi</Text>
          <View style={styles.ratingActionContainer}>
            <View style={styles.ratingBox}>
              <Text style={styles.ratingAverage}>
                {foodData.avg_rating.toFixed(1)}
              </Text>
              <Text style={styles.ratingCount}>
                ({reviews.length} đánh giá)
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={handleReview}
              >
                <Text style={styles.reviewButtonText}>Đánh giá</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.wannaTryButton]}
                onPress={handleWannaTry}
              >
                <Text style={styles.wannaTryButtonText}>Wanna Try</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments/Reviews */}
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.review_id}>
                {renderReviewItem({ item: review })}
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>Chưa có đánh giá nào.</Text>
          )}
        </View>
      </ScrollView>

      {/* Nút quay lại (Fixed) */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  bannerList: {
    width: screenWidth,
    height: 280,
    backgroundColor: "#eee",
  },
  bannerImage: {
    width: screenWidth,
    height: 280,
  },
  contentContainer: {
    padding: 20,
    marginTop: -20, // Kéo content lên trên banner một chút
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  foodName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  nutritionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recipeButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  recipeButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  ratingActionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingBox: {
    alignItems: "center",
  },
  ratingAverage: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E67E22",
  },
  ratingCount: {
    fontSize: 13,
    color: "#888",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  reviewButtonText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 14,
  },
  wannaTryButton: {
    backgroundColor: "#4CAF50",
  },
  wannaTryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  reviewAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewUserName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  reviewRating: {
    fontSize: 13,
    color: "#E67E22",
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  noReviewsText: {
    textAlign: "center",
    color: "#888",
    marginTop: 10,
  },
  backButton: {
    position: "absolute",
    top: 50, // căn theo SafeArea (có thể chỉnh 35–50 tùy máy)
    left: 15,
    backgroundColor: "rgba(0,0,0,0.35)", // nền mờ sang trọng
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4, // Android shadow
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    lineHeight: 22, // Căn chỉnh dấu "<"
  },
});

export default FoodDetailScreen;
