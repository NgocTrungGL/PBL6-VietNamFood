import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  FlatList,
  Modal,
  Share, // 👈 Thêm cái này
  Alert, // 👈 Thêm cái này (nếu chưa có)
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { FoodDetails } from "../../components/FoodCard/FoodCard";
import { API_HOME_URL } from "@env";
import { useAuth } from "../../app/context/AuthContext";

interface Review {
  review_id: number;
  user_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user_name: string;
  user_avatar: string;
}

interface FoodImage {
  image_id: number;
  image_data: string;
  caption: string | null;
}

type RootStackParamList = {
  FoodDetailScreen: { foodData: FoodDetails };
  RecipeDetailScreen: { foodId: number };
};

type FoodDetailRouteProp = RouteProp<RootStackParamList, "FoodDetailScreen">;

const { width: screenWidth } = Dimensions.get("window");
const HEADER_HEIGHT = 350;

const FoodDetailScreen: React.FC = () => {
  const route = useRoute<FoodDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { foodData } = route.params;
  const BASE_URL = API_HOME_URL || "http://192.168.1.5:5000/api";
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isWannaTry, setIsWannaTry] = useState(false);
  const [gallery, setGallery] = useState<FoodImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const flatListRef = useRef<FlatList>(null);
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${BASE_URL}/favorites/check?user_id=${user.user_id}&food_id=${foodData.food_id}`);
        const data = await res.json();
        setIsWannaTry(data.is_favorite);
      } catch (error) {
        console.error("Check favorite error:", error);
      }
    };
    checkFavoriteStatus();
  }, [user, foodData.food_id]);

  // --- 2. XỬ LÝ NÚT TIM (WANNA TRY) ---
  const handleToggleWannaTry = async () => {
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để lưu món ăn!");
      return;
    }

    // UI Optimistic Update: Đổi màu ngay cho mượt, nếu lỗi thì đổi lại sau
    const previousState = isWannaTry;
    setIsWannaTry(!isWannaTry);

    try {
      if (previousState) {
        // Đang like -> Bấm vào -> UNLIKE (DELETE)
        await fetch(`${BASE_URL}/favorites?user_id=${user.user_id}&food_id=${foodData.food_id}`, {
          method: "DELETE",
        });
      } else {
        // Chưa like -> Bấm vào -> LIKE (POST)
        await fetch(`${BASE_URL}/favorites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_id,
            food_id: Number(foodData.food_id),
          }),
        });
      }
    } catch (error) {
      console.error("Favorite toggle error:", error);
      setIsWannaTry(previousState); // Revert nếu lỗi
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái yêu thích.");
    }
  };

  // --- 3. XỬ LÝ GỬI ĐÁNH GIÁ (REVIEW) ---
  const handleSubmitReview = async () => {
    if (!user) {
        Alert.alert("Yêu cầu", "Bạn cần đăng nhập để viết đánh giá.");
        return;
    }
    if (userRating === 0) {
        Alert.alert("Thông báo", "Vui lòng chọn số sao đánh giá.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user.user_id,
                food_id: Number(foodData.food_id),
                rating: userRating,
                comment: userComment
            }),
        });

        const data = await response.json();

        if (response.ok) {
            Alert.alert("Thành công", "Cảm ơn đánh giá của bạn!");
            setShowReviewModal(false);

            // Cập nhật list review ngay lập tức (Fake update để không cần gọi lại API)
            const newReview: Review = {
                review_id: Date.now(), // ID tạm
                user_id: user.user_id,
                rating: userRating,
                comment: userComment,
                created_at: new Date().toISOString(),
                user_name: user.full_name || user.username,
                user_avatar: user.avatar || "",
            };
            setReviews([newReview, ...reviews]); // Thêm lên đầu

            // Reset form
            setUserRating(0);
            setUserComment("");
        } else {
            Alert.alert("Lỗi", data.error || "Không thể gửi đánh giá.");
        }
    } catch (error) {
        console.error("Submit review error:", error);
        Alert.alert("Lỗi", "Lỗi kết nối đến server.");
    }
  };
  const handleShare = async () => {
    try {
      // Tạo nội dung tin nhắn muốn chia sẻ
      const message = `🍕 Mời bạn đi ăn món ngon này nè!\n\n` +
                      `🇻🇳 Tên món: ${foodData.name}\n` +
                      `📍 Vùng miền: ${foodData.region_name}\n\n` +
                      `"${(foodData as any).description || "Hương vị tuyệt vời!"}"\n\n` +
                      `👉 Xem chi tiết tại VN Food App`
                      ;

      const result = await Share.share({
        message: message,
        title: `Chia sẻ món ${foodData.name}`, // Tiêu đề (chủ yếu hiện trên Android)
        // url: ... (Nếu bạn có website thì điền link web vào đây, iOS sẽ hiển thị preview đẹp hơn)
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Đã chia sẻ qua một app cụ thể (iOS)
          console.log("Shared via", result.activityType);
        } else {
          // Đã chia sẻ thành công
          console.log("Shared success");
        }
      } else if (result.action === Share.dismissedAction) {
        // Người dùng bấm hủy
        console.log("Dismissed");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };
  const displayImages = gallery.length > 0
    ? gallery
    : [{
        image_id: -1,
        image_data: typeof foodData.main_image === "object" ? foodData.main_image.uri : String(foodData.main_image),
        caption: ''
      }];
  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [reviewsRes, imgRes] = await Promise.all([
          fetch(`${BASE_URL}/reviews/${foodData.food_id}`),
          fetch(`${BASE_URL}/food_images/${foodData.food_id}`)
        ]);

        const reviewsData = await reviewsRes.json();
        const imgData = await imgRes.json();

        if (Array.isArray(reviewsData)) setReviews(reviewsData);

        if (Array.isArray(imgData) && imgData.length > 0) {
          setGallery(imgData);
        } else {
          setGallery([{
            image_id: 0,
            image_data: typeof foodData.main_image === "object" ? foodData.main_image.uri : String(foodData.main_image),
            caption: foodData.name
          }]);
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết:", error);
      }
    };
    fetchDetails();
  }, [foodData.food_id]);

  // Auto scroll
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const intervalId = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displayImages.length;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
      }
      setActiveIndex(nextIndex);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeIndex, displayImages.length]);

  const getFoodImageUri = (imagePath: string) => {
    if (!imagePath) return "https://cdn-icons-png.flaticon.com/512/135/135161.png";
    if (imagePath.startsWith("http") || imagePath.startsWith("file") || imagePath.startsWith("data:")) {
      return imagePath;
    }
    return `data:image/jpeg;base64,${imagePath}`;
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) setActiveIndex(roundIndex);
  };

  const onScrollToIndexFailed = (info: any) => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
    }, 500);
  };

  const handleGoToRecipes = () => {
    // navigation.navigate("RecipeDetailScreen", { foodId: Number(foodData.food_id) });
    navigation.navigate("RecipeDetailScreen", { foodData: foodData });
  };

  // const handleToggleWannaTry = () => setIsWannaTry(!isWannaTry);
  // 👇 HÀM MỚI: Xử lý đi ăn ngay
  const handleGoEat = () => {
    // Điều hướng sang MapScreen và truyền tên món ăn làm từ khóa tìm kiếm
    navigation.navigate("MainTabs", {
      screen: "Map", // Nếu Map nằm trong BottomTab, phải trỏ đúng đường dẫn
      params: { searchQuery: foodData.name }
    });

    // ⚠️ LƯU Ý: Nếu MapScreen KHÔNG nằm trong Tab mà nằm ngoài Stack,
    // thì dùng: navigation.navigate("MapScreen", { searchQuery: foodData.name });
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} bounces={false}>
        {/* Slider */}
        <View style={styles.sliderContainer}>
          <FlatList
            ref={flatListRef}
            data={displayImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            onScroll={handleScroll}
            onScrollToIndexFailed={onScrollToIndexFailed}
            renderItem={({ item }) => (
              <View style={styles.slideItem}>
                <Image source={{ uri: getFoodImageUri(item.image_data) }} style={styles.mainImage} resizeMode="cover" />
                {item.caption && (
                  <View style={styles.captionContainer}>
                    <Text style={styles.captionText}>{item.caption}</Text>
                  </View>
                )}
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageOverlay} pointerEvents="none" />
              </View>
            )}
          />
          {/* Top Buttons */}
          <View style={styles.topButtons}>
            <TouchableOpacity style={styles.circleBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Header Info */}
          <View style={styles.headerInfo}>
            <View style={styles.badgeContainer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{foodData.category_name}</Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: "#FFC107" }]}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={[styles.categoryText, { marginLeft: 4 }]}>
                  {foodData.avg_rating ? Number(foodData.avg_rating).toFixed(1) : "New"}
                </Text>
              </View>
            </View>
            <Text style={styles.foodNameTitle}>{foodData.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={16} color="#ddd" />
              <Text style={styles.locationText}>{foodData.region_name}</Text>
            </View>
          </View>
        </View>

        {/* Body */}
        <View style={styles.bodyContainer}>
          {/* ACTION BAR */}
        <View style={styles.actionBar}>
             {/* Bên trái: Thông tin phổ biến */}
             <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Độ phổ biến</Text>
                <Text style={styles.priceValue}>{foodData.most_popular ? "🔥 Rất cao" : "⭐ Bình thường"}</Text>
             </View>

             {/* Bên phải: 2 Nút hành động */}
             <View style={styles.buttonsGroup}>
                {/* 👇 NÚT MỚI: GO EAT */}
                <TouchableOpacity style={styles.goEatBtn} onPress={handleGoEat}>
                    <Ionicons name="navigate-circle" size={20} color="#fff" />
                    <Text style={styles.goEatText}>Go Eat</Text>
                </TouchableOpacity>

                {/* Nút Wanna Try Cũ */}
                <TouchableOpacity style={styles.wannaTryBtn} onPress={handleToggleWannaTry}>
                    <Ionicons
                        name={isWannaTry ? "heart" : "heart-outline"}
                        size={22}
                        color={isWannaTry ? "#FF5252" : "#444"}
                    />
                    {/* Ẩn text trên màn hình nhỏ nếu cần, hoặc để ngắn gọn */}
                    {/* <Text style={[styles.wannaTryText, isWannaTry && { color: "#FF5252" }]}>
                        {isWannaTry ? "Đã lưu" : "Lưu"}
                    </Text> */}
                </TouchableOpacity>
             </View>
        </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Giới thiệu</Text>
          <Text style={styles.descriptionText}>{(foodData as any).description || "Đang cập nhật mô tả..."}</Text>

          {(foodData as any).nutrition_info && (
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Ionicons name="nutrition-outline" size={20} color="#2E7D32" />
                <Text style={styles.infoBoxTitle}>Giá trị dinh dưỡng</Text>
              </View>
              <Text style={styles.infoBoxContent}>{(foodData as any).nutrition_info}</Text>
            </View>
          )}

          {(foodData as any).ingredients && (
            <View style={[styles.infoBox, { backgroundColor: "#FFF3E0" }]}>
              <View style={styles.infoBoxHeader}>
                <Ionicons name="basket-outline" size={20} color="#E65100" />
                <Text style={[styles.infoBoxTitle, { color: "#E65100" }]}>Thành phần chính</Text>
              </View>
              <Text style={[styles.infoBoxContent, { color: "#BF360C" }]}>{(foodData as any).ingredients}</Text>
            </View>
          )}

          {/* User Rating Section */}
          <View style={styles.userRatingSection}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
              <TouchableOpacity style={styles.writeReviewBtnCompact} onPress={() => setShowReviewModal(true)}>
                <Ionicons name="create-outline" size={18} color="#66BB6A" />
                <Text style={styles.writeReviewTextCompact}>Viết đánh giá</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reviews List */}
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            reviews.map((item) => (
              <View key={item.review_id} style={styles.reviewItem}>
                <Image
                  source={item.user_avatar ? { uri: item.user_avatar } : { uri: "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.reviewName}>{item.user_name || "Ẩn danh"}</Text>
                    <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString("vi-VN")}</Text>
                  </View>
                  <View style={{ flexDirection: "row", marginBottom: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons key={i} name={i < item.rating ? "star" : "star-outline"} size={12} color="#FFC107" />
                    ))}
                  </View>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: "center", color: "#888", fontStyle: "italic", marginBottom: 20 }}>
              Chưa có đánh giá nào.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Recipe Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.recipeBtn} onPress={handleGoToRecipes}>
          <LinearGradient colors={["#66BB6A", "#43A047"]} style={styles.gradientBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="restaurant" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.recipeBtnText}>Xem Công Thức Nấu Ăn</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        {/* 👇 BỌC BẰNG KEYBOARD AVOIDING VIEW */}
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
            {/* Lớp nền tối để bấm ra ngoài thì đóng */}
            <TouchableOpacity
                style={styles.modalBackdrop}
                activeOpacity={1}
                onPress={() => setShowReviewModal(false)}
            />

            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Đánh giá món ăn</Text>
                    <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                        <Ionicons name="close" size={24} color="#888" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Bạn cảm thấy thế nào?</Text>
                <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setUserRating(star)} activeOpacity={0.7}>
                            <Ionicons
                                name={star <= userRating ? "star" : "star-outline"}
                                size={40}
                                color={star <= userRating ? "#FFC107" : "#ddd"}
                                style={{ marginHorizontal: 5 }}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.modalLabel}>Chia sẻ cảm nhận của bạn</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Món này ngon không?..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        value={userComment}
                        onChangeText={setUserComment}
                        // 👇 Thêm dòng này để nút Done tắt bàn phím
                        returnKeyType="done"
                        blurOnSubmit={true}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, userRating === 0 && { backgroundColor: "#ccc" }]}
                    disabled={userRating === 0}
                    onPress={handleSubmitReview}
                >
                    <Text style={styles.submitBtnText}>Gửi đánh giá</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  sliderContainer: { height: HEADER_HEIGHT, width: "100%", position: "relative" },
  slideItem: { width: screenWidth, height: HEADER_HEIGHT },
  mainImage: { width: "100%", height: "100%" },
  captionContainer: { position: "absolute", top: 100, right: 20, backgroundColor: "rgba(0,0,0,0.5)", padding: 5, borderRadius: 5, zIndex: 5 },
  captionText: { color: "#fff", fontSize: 12 },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  topButtons: { position: "absolute", top: Platform.OS === "ios" ? 50 : 40, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  headerInfo: { position: "absolute", bottom: 40, left: 20, right: 20, zIndex: 10 },
  badgeContainer: { flexDirection: "row", marginBottom: 8 },
  categoryBadge: { backgroundColor: "#66BB6A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 8, flexDirection: "row", alignItems: "center" },
  categoryText: { color: "#fff", fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  foodNameTitle: { color: "#fff", fontSize: 32, fontWeight: "800", marginBottom: 4, textShadowColor: "rgba(0, 0, 0, 0.75)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 },
  locationRow: { flexDirection: "row", alignItems: "center" },
  locationText: { color: "#eee", fontSize: 14, marginLeft: 4 },
  bodyContainer: { flex: 1, backgroundColor: "#fff", marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 25 },
  priceLabel: { color: "#888", fontSize: 13 },
  priceValue: { color: "#333", fontSize: 18, fontWeight: "bold", marginTop: 2 },
  wannaTryText: { marginLeft: 6, fontWeight: "600", color: "#444" },
  divider: { height: 1, backgroundColor: "#eee", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#222", marginBottom: 10 },
  descriptionText: { fontSize: 15, color: "#555", lineHeight: 24, marginBottom: 20 },
  infoBox: { backgroundColor: "#E8F5E9", padding: 15, borderRadius: 12, marginBottom: 15 },
  infoBoxHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoBoxTitle: { fontSize: 15, fontWeight: "bold", color: "#2E7D32", marginLeft: 8 },
  infoBoxContent: { fontSize: 14, color: "#1B5E20", lineHeight: 22 },
  reviewSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 15 },
  seeAllText: { color: "#66BB6A", fontWeight: "600" },
  reviewItem: { flexDirection: "row", marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#f9f9f9", paddingBottom: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: "#eee" },
  reviewName: { fontSize: 14, fontWeight: "bold", color: "#333" },
  reviewDate: { fontSize: 12, color: "#999" },
  reviewComment: { fontSize: 14, color: "#555", marginTop: 4, lineHeight: 20 },
  bottomContainer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 20, borderTopWidth: 1, borderTopColor: "#f0f0f0", shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 10 },
  recipeBtn: { width: "100%", height: 50, borderRadius: 25, overflow: "hidden" },
  gradientBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" },
  recipeBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 },
  userRatingSection: { marginBottom: 20 },
  writeReviewBtnCompact: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F8E9", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  writeReviewTextCompact: { color: "#66BB6A", fontWeight: "600", fontSize: 13, marginLeft: 4 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  modalLabel: { fontSize: 14, color: "#666", marginBottom: 10, marginTop: 5 },
  starsContainer: { flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  inputContainer: { backgroundColor: "#f9f9f9", borderRadius: 12, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: "#eee" },
  textInput: { height: 100, textAlignVertical: "top", fontSize: 15, color: "#333" },
  submitBtn: { backgroundColor: "#66BB6A", paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  priceBox: {
    flex: 1, // Chiếm phần không gian còn lại bên trái
    justifyContent: 'center',
  },

  // Container chứa 2 nút bên phải
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // Khoảng cách giữa 2 nút (nếu React Native > 0.71), nếu lỗi dùng marginLeft ở nút sau
  },

  // Style nút Wanna Try (Giữ nguyên hoặc chỉnh nhỏ lại xíu)
  wannaTryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
  },

  // 👇 STYLE NÚT GO EAT (MỚI)
  goEatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#66BB6A', // Màu xanh chủ đạo
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    // Shadow nhẹ
    elevation: 3,
    shadowColor: "#66BB6A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  goEatText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center", // Căn giữa màn hình
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Nền tối
    padding: 20, // Khoảng cách lề
  },

  // 👇 THÊM STYLE CHO LỚP NỀN (Để bấm ra ngoài đóng modal)
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject, // Phủ kín màn hình
    zIndex: -1, // Nằm dưới modalContent
  },

  modalContent: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default FoodDetailScreen;
