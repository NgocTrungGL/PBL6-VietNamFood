import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  LayoutChangeEvent,
  Dimensions,
  Alert
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { API_CAMERA_URL } from "@env";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFood } from "../context/FoodContext";
import { FoodDetails } from "../../components/FoodCard/FoodCard";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function CameraScreen() {
  const navigation = useNavigation<any>();
  const { foods } = useFood();

  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);

  const [matchedFood, setMatchedFood] = useState<FoodDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const [cameraLayout, setCameraLayout] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.textButton}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onCameraLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  // Kích thước khung vuông trên màn hình
  const SQUARE_SIZE = cameraLayout.width * 0.8;
  const overlayTop = (cameraLayout.height - SQUARE_SIZE) / 2;
  const overlaySide = (cameraLayout.width - SQUARE_SIZE) / 2;

  const toggleFacing = () => setFacing((cur) => (cur === "back" ? "front" : "back"));

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync();
      // Truyền kích thước View vào để tính toán tỷ lệ cắt
      const cropped = await cropToSquare(result.uri);
      setPhoto(cropped.uri);
      await sendToModel(cropped.uri);
    } catch (e) {
      console.log("Error taking photo", e);
    }
  };

  // --- LOGIC CẮT ẢNH CHÍNH XÁC THEO KHUNG NHÌN THẤY ---
  const cropToSquare = async (uri: string) => {
    // 1. Lấy kích thước thực tế của ảnh gốc vừa chụp
    const imageInfo = await ImageManipulator.manipulateAsync(uri, [], { base64: false });
    const { width: imgW, height: imgH } = imageInfo;

    // 2. Lấy kích thước của CameraView trên màn hình
    const { width: viewW, height: viewH } = cameraLayout;

    // 3. Tính toán tỷ lệ scale giữa Ảnh gốc và Màn hình
    // CameraView hiển thị kiểu "cover", nên ta tính tỷ lệ dựa trên cạnh nào bị zoom ít hơn (cạnh khớp với màn hình)
    // Công thức: 1 pixel màn hình = bao nhiêu pixel ảnh gốc?
    const scale = Math.min(imgW / viewW, imgH / viewH);

    // 4. Tính kích thước vùng cắt trên ảnh gốc
    // Kích thước vuông trên ảnh = Kích thước vuông màn hình * tỷ lệ
    const cropSizeOnImage = SQUARE_SIZE * scale;

    // 5. Tính tọa độ bắt đầu cắt (Canh giữa ảnh)
    const originX = (imgW - cropSizeOnImage) / 2;
    const originY = (imgH - cropSizeOnImage) / 2;

    return await ImageManipulator.manipulateAsync(
      uri,
      [{
        crop: {
          originX: Math.max(0, originX),
          originY: Math.max(0, originY),
          width: cropSizeOnImage,
          height: cropSizeOnImage
        }
      }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  const sendToModel = async (uri: string) => {
    setLoading(true);
    setMatchedFood(null);

    try {
      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      console.log("Sending to AI:", API_CAMERA_URL);
      const response = await fetch(`${API_CAMERA_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();
      console.log("AI Response:", data);

      if (data && data.class_id !== undefined) {
          const aiClassId = Number(data.class_id);

          const found = foods.find(f => {
              if (f.label_id === null || f.label_id === undefined) return false;
              return Number(f.label_id) === aiClassId;
          });

          if (found) {
              setMatchedFood(found);
          } else {
              Alert.alert(
                "Rất tiếc",
                `AI nhận diện là "${data.class_name}" nhưng món này chưa có trong dữ liệu ứng dụng.`
              );
          }
      } else {
          Alert.alert("Xin lỗi", "Không nhận diện được món ăn này.");
      }

    } catch (error) {
      console.log("Error sending image to model", error);
      Alert.alert("Lỗi kết nối", "Không thể kết nối đến server nhận diện.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDetail = () => {
      if (matchedFood) {
          setPhoto(null);
          setMatchedFood(null);
          navigation.navigate("FoodDetailScreen", { foodData: matchedFood });
      }
  };

  const getFoodImageUri = (image: any) => {
      if (!image) return "https://cdn-icons-png.flaticon.com/512/135/135161.png";
      if (typeof image === 'object' && image.uri) return image.uri;
      const imgString = String(image);
      if (imgString.startsWith('http') || imgString.startsWith('data:')) return imgString;
      return `data:image/jpeg;base64,${imgString}`;
  };

  const frameBgImage = require('../../assets/explore-bg.jpg');

  return (
    <View style={styles.container}>
      {!photo ? (
        <>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} onLayout={onCameraLayout} />
          <View style={styles.overlayContainer} pointerEvents="none">
            <Image source={frameBgImage} style={[styles.imageOverlay, { top: 0, height: overlayTop, width: cameraLayout.width }]} resizeMode="cover" />
            <Image source={frameBgImage} style={[styles.imageOverlay, { bottom: 0, height: overlayTop, width: cameraLayout.width }]} resizeMode="cover" />
            <Image source={frameBgImage} style={[styles.imageOverlay, { top: overlayTop, height: SQUARE_SIZE, left: 0, width: overlaySide }]} resizeMode="cover" />
            <Image source={frameBgImage} style={[styles.imageOverlay, { top: overlayTop, height: SQUARE_SIZE, right: 0, width: overlaySide }]} resizeMode="cover" />
            <View style={[styles.squareBox, { width: SQUARE_SIZE, height: SQUARE_SIZE, top: overlayTop, left: overlaySide }]} />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.secondaryButton} onPress={toggleFacing}>
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <View style={styles.thirddaryButton} />
          </View>
        </>
      ) : (
        // --- RESULT SCREEN ---
        <View style={styles.resultContainer}>
          <View style={styles.capturedImageContainer}>
              <Image source={{ uri: photo }} style={styles.capturedImage} />
              {loading && (
                  <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#66BB6A" />
                      <Text style={styles.loadingText}>Đang phân tích...</Text>
                  </View>
              )}
          </View>

          {/* CARD KẾT QUẢ */}
          {!loading && matchedFood && (
             <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Tìm thấy món ngon! 🎉</Text>

                <View style={styles.foodInfoRow}>
                    <Image
                        source={{ uri: getFoodImageUri(matchedFood.main_image) }}
                        style={styles.foodThumb}
                    />
                    <View style={styles.foodTextInfo}>
                        <Text style={styles.foodName}>{matchedFood.name}</Text>
                        <Text style={styles.foodDesc} numberOfLines={2}>
                            {matchedFood.description || "Món ăn hấp dẫn đang chờ bạn khám phá."}
                        </Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#fff" />
                            <Text style={styles.ratingText}>{matchedFood.avg_rating ? matchedFood.avg_rating.toFixed(1) : "New"}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity style={styles.detailButton} onPress={handleGoToDetail}>
                    <Text style={styles.detailButtonText}>Xem Chi Tiết & Công Thức</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.retryLink}
                    onPress={() => { setPhoto(null); setMatchedFood(null); }}
                >
                    <Text style={styles.retryText}>Chụp lại</Text>
                </TouchableOpacity>
             </View>
          )}

          {!loading && !matchedFood && (
              <TouchableOpacity
                style={styles.retryButtonLarge}
                onPress={() => setPhoto(null)}
              >
                  <Ionicons name="refresh" size={24} color="#fff" />
                  <Text style={styles.retryTextLarge}>Thử lại</Text>
              </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  message: { textAlign: "center", padding: 20, color: "#fff", marginTop: 100 },
  camera: { flex: 1 },
  overlayContainer: { ...StyleSheet.absoluteFillObject },
  imageOverlay: { position: "absolute" },
  squareBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#66BB6A",
    borderRadius: 12,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  secondaryButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: "rgba(81, 187, 20, 1)",
    justifyContent: "center", alignItems: "center",
  },
  thirddaryButton: { width: 50, height: 50 },
  captureButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 4, borderColor: "rgba(81, 187, 20, 1)",
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#66BB6A" },
  textButton: { color: "#fff", fontWeight: "bold" },
  button: { padding: 15, backgroundColor: "#66BB6A", borderRadius: 10, alignSelf: 'center', marginTop: 20 },

  // --- RESULT SCREEN ---
  resultContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
  },
  capturedImageContainer: {
      width: '100%',
      height: '55%',
      position: 'relative',
  },
  capturedImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
  },
  loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  loadingText: {
      color: '#fff',
      marginTop: 10,
      fontSize: 16,
      fontWeight: '600'
  },

  // CARD KẾT QUẢ
  resultCard: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
  },
  resultTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#2E7D32',
      marginBottom: 15,
      textAlign: 'center',
  },
  foodInfoRow: {
      flexDirection: 'row',
      marginBottom: 20,
  },
  foodThumb: {
      width: 80,
      height: 80,
      borderRadius: 12,
      backgroundColor: '#eee',
      marginRight: 15,
  },
  foodTextInfo: {
      flex: 1,
      justifyContent: 'center',
  },
  foodName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
  },
  foodDesc: {
      fontSize: 13,
      color: '#666',
      lineHeight: 18,
      marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#66BB6A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  ratingText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: 'bold',
      marginLeft: 4,
  },
  detailButton: {
      backgroundColor: '#2E7D32',
      paddingVertical: 14,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
  },
  detailButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
  },
  retryLink: {
      alignItems: 'center',
      padding: 5,
  },
  retryText: {
      color: '#888',
      fontSize: 13,
      textDecorationLine: 'underline',
  },
  retryButtonLarge: {
      marginTop: 30,
      backgroundColor: '#FF5252',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 30,
  },
  retryTextLarge: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
  }
});
