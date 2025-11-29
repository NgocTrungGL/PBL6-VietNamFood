import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_HOME_URL } from "@env";
import YoutubePlayer from "react-native-youtube-iframe"; // 👇 Import thư viện Youtube

import { FoodDetails } from "../../components/FoodCard/FoodCard";
// 👇 Import hàm tiện ích (Hãy đảm bảo đường dẫn này đúng với file bạn đã tạo)
import { getYouTubeVideoId } from "../../helper/utils";

// Interface chỉ chứa thông tin từ bảng Recipe
interface RecipeOnly {
  recipe_id: number;
  title: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  instructions: string;
  video_url: string | null;
}

export default function RecipeDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Nhận dữ liệu từ màn hình trước
  const { foodData } = route.params as { foodData: FoodDetails };
  const BASE_URL = API_HOME_URL || "http://192.168.1.5:5000/api";

  // State
  const [recipeInfo, setRecipeInfo] = useState<RecipeOnly | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false); // State cho video player

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`${BASE_URL}/recipes/${foodData.food_id}`);

        if (response.status === 404) {
            setLoading(false);
            return;
        }

        const data = await response.json();
        setRecipeInfo(data);
      } catch (error) {
        console.error("Lỗi tải công thức:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [foodData.food_id]);

  // Hàm xử lý ảnh an toàn
  const getImageUrl = (img: any) => {
    if (!img) return "https://cdn-icons-png.flaticon.com/512/135/135161.png";
    const uri = typeof img === 'object' ? img.uri : String(img);
    if (uri.startsWith("http") || uri.startsWith("data:")) return uri;
    return `data:image/jpeg;base64,${uri}`;
  };

  // Xử lý trạng thái video
  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  // Lấy Video ID từ URL (Sử dụng hàm từ utils)
  const videoId = recipeInfo?.video_url ? getYouTubeVideoId(recipeInfo.video_url) : null;

  // Tách chuỗi dữ liệu
  const ingredientsList = ((foodData as any).ingredients || "").split("\n").filter((i: string) => i.trim() !== "");
  const instructionsList = (recipeInfo?.instructions || "").split("\n").filter((i: string) => i.trim() !== "");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* 1. Header Image */}
      <ImageBackground
        source={{ uri: getImageUrl(foodData.main_image) }}
        style={styles.headerImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
                {foodData.avg_rating ? Number(foodData.avg_rating).toFixed(1) : "N/A"}
            </Text>
          </View>
          <Text style={styles.foodName}>{foodData.name}</Text>
        </View>
      </ImageBackground>

      {/* 2. Nội dung chi tiết */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Loading State */}
        {loading ? (
            <View style={{padding: 20}}>
                <ActivityIndicator size="small" color="#66BB6A" />
                <Text style={{textAlign: 'center', color: '#888', marginTop: 10}}>Đang tải bí kíp...</Text>
            </View>
        ) : recipeInfo ? (
            <>
                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={22} color="#66BB6A" />
                        <Text style={styles.statLabel}>Chuẩn bị</Text>
                        <Text style={styles.statValue}>{recipeInfo.prep_time_minutes}p</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Ionicons name="flame-outline" size={22} color="#66BB6A" />
                        <Text style={styles.statLabel}>Nấu</Text>
                        <Text style={styles.statValue}>{recipeInfo.cook_time_minutes}p</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Ionicons name="restaurant-outline" size={22} color="#66BB6A" />
                        <Text style={styles.statLabel}>Độ khó</Text>
                        <Text style={styles.statValue}>
                            {(recipeInfo.prep_time_minutes + recipeInfo.cook_time_minutes) > 60 ? "Khó" : "Dễ"}
                        </Text>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.section}>
                    <Text style={styles.titleText}>{recipeInfo.title}</Text>
                </View>
            </>
        ) : (
            <View style={{padding: 20, alignItems: 'center'}}>
                <Ionicons name="book-outline" size={50} color="#ddd" />
                <Text style={{color: '#888', marginTop: 10}}>Chưa có hướng dẫn nấu ăn cho món này.</Text>
            </View>
        )}

        {/* Nguyên liệu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nguyên liệu</Text>
          <View style={styles.ingredientList}>
            {ingredientsList.length > 0 ? (
                ingredientsList.map((item: string, index: number) => (
                <View key={index} style={styles.ingredientItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.ingredientText}>{item}</Text>
                </View>
                ))
            ) : (
                <Text style={{color: '#888', fontStyle: 'italic'}}>Đang cập nhật nguyên liệu...</Text>
            )}
          </View>
        </View>

        {/* Cách làm (Timeline Style) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cách thực hiện</Text>
          {instructionsList.length > 0 ? (
              instructionsList.map((step, index) => {
                // Xử lý chuỗi: Xóa bỏ "1.", "2." hoặc "1)" ở đầu câu nếu có trong DB
                const cleanStep = step.replace(/^\d+[\.\)]\s*/, '').trim();

                return (
                  <View key={index} style={styles.stepWrapper}>
                    {/* Đường kẻ nối (Chỉ hiện nếu không phải bước cuối) */}
                    {index !== instructionsList.length - 1 && (
                        <View style={styles.verticalLine} />
                    )}

                    <View style={styles.stepContainer}>
                      {/* Số thứ tự */}
                      <View style={styles.stepNumberBox}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                      </View>

                      {/* Nội dung */}
                      <View style={styles.stepContent}>
                          <Text style={styles.stepText}>{cleanStep}</Text>
                      </View>
                    </View>
                  </View>
                );
              })
          ) : (
            <Text style={{color: '#888', fontStyle: 'italic'}}>Đang cập nhật hướng dẫn...</Text>
          )}
        </View>

        {/* Video Hướng Dẫn (Youtube Player) */}
        {videoId && (
            <View style={styles.videoSection}>
                <Text style={styles.sectionTitle}>Video Hướng Dẫn</Text>
                <View style={styles.videoWrapper}>
                  <YoutubePlayer
                    height={220} // Chiều cao chuẩn 16:9
                    play={playing}
                    videoId={videoId}
                    onChangeState={onStateChange}
                  />
                </View>
            </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerImage: { height: 300, width: "100%", justifyContent: "space-between" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  headerButtons: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 40 },
  iconBtn: { backgroundColor: "rgba(255,255,255,0.25)", padding: 8, borderRadius: 12 },
  headerInfo: { padding: 20, paddingBottom: 40 },
  ratingBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.6)", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  ratingText: { color: "#FFD700", fontWeight: "bold", marginLeft: 4, fontSize: 12 },
  foodName: { color: "#fff", fontSize: 28, fontWeight: "bold", textShadowColor: 'rgba(0, 0, 0, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  contentContainer: { flex: 1, backgroundColor: "#fff", marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 20, paddingTop: 25 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#F9FAFB", padding: 15, borderRadius: 15, marginBottom: 20 },
  statItem: { alignItems: "center", flex: 1 },
  divider: { width: 1, height: "100%", backgroundColor: "#E0E0E0" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 4 },
  statValue: { fontSize: 14, fontWeight: "bold", color: "#333" },
  section: { marginBottom: 25 },
  titleText: { fontSize: 15, color: "#555", lineHeight: 22, marginBottom: 10, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#333", marginBottom: 12, borderLeftWidth: 4, borderLeftColor: "#66BB6A", paddingLeft: 10 },
  ingredientList: { backgroundColor: "#FAFAFA", padding: 15, borderRadius: 12 },
  ingredientItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  bulletPoint: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#66BB6A", marginRight: 10 },
  ingredientText: { fontSize: 15, color: "#444" },

  // Styles mới cho Timeline Steps
  stepWrapper: { position: 'relative', marginBottom: 0 },
  stepContainer: { flexDirection: "row", alignItems: 'flex-start', marginBottom: 20 },
  verticalLine: { position: 'absolute', left: 14, top: 28, bottom: -10, width: 2, backgroundColor: '#E0E0E0', zIndex: -1 },
  stepNumberBox: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#66BB6A", justifyContent: "center", alignItems: "center", marginRight: 15, marginTop: 2, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1 },
  stepNumber: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  stepContent: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginTop: -8 },
  stepText: { fontSize: 15, color: "#333", lineHeight: 22 },

  // Styles cho Video Player
  videoSection: { marginTop: 10, marginBottom: 40 },
  videoWrapper: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#000', elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
});
