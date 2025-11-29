import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  LayoutChangeEvent,
  Dimensions,
  // Import ImageBackground nếu muốn viết chữ lên ảnh nền
  // ImageBackground
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { API_CAMERA_URL } from "@env";
import { Ionicons } from "@expo/vector-icons";
// Lấy kích thước màn hình để tính toán ban đầu
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State lưu kích thước thật của CameraView sau khi render
  const [cameraLayout, setCameraLayout] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hàm cập nhật kích thước khi CameraView render xong
  const onCameraLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  // --- TÍNH TOÁN KÍCH THƯỚC KHUNG HÌNH ---
  // Kích thước hình vuông ở giữa (80% chiều rộng)
  const SQUARE_SIZE = cameraLayout.width * 0.8;
  // Khoảng cách từ trên xuống hình vuông
  const overlayTop = (cameraLayout.height - SQUARE_SIZE) / 2;
  // Khoảng cách từ hai bên vào hình vuông
  const overlaySide = (cameraLayout.width - SQUARE_SIZE) / 2;

  const toggleFacing = () =>
    setFacing((cur) => (cur === "back" ? "front" : "back"));

  // --- CHỤP & XỬ LÝ ẢNH ---
  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync();
      // Cắt ảnh thành hình vuông
      const cropped = await cropToSquare(result.uri);
      setPhoto(cropped.uri);
      // Gửi ảnh đã cắt đi nhận diện
      await sendToModel(cropped.uri);
    } catch (e) {
      console.log("Error taking photo", e);
    }
  };

  // Hàm cắt ảnh thành hình vuông trung tâm
  const cropToSquare = async (uri: string) => {
    const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
      base64: false,
    });
    // Lấy cạnh nhỏ nhất làm chuẩn
    const side = Math.min(imageInfo.width, imageInfo.height);
    // Tính tọa độ bắt đầu cắt (để canh giữa)
    const left = (imageInfo.width - side) / 2;
    const top = (imageInfo.height - side) / 2;

    return await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: left, originY: top, width: side, height: side } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  // Hàm gửi ảnh lên Server
  const sendToModel = async (uri: string) => {
    setLoading(true);
    try {
      // Convert ảnh sang Base64
      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      const response = await fetch(`${API_CAMERA_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();
      console.log("Response status:", data);
      // Giả sử API trả về field 'class_name'
      setPrediction(data.class_name);
    } catch (error) {
      console.log("Error sending image to model", error);
      setPrediction("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  // Ảnh nền bạn muốn dùng làm khung
  const frameBgImage = require('../../assets/explore-bg.jpg'); // 👇 Thay ảnh của bạn vào đây

  return (
    <View style={styles.container}>
      {!photo ? (
        <>
          {/* 1. CAMERA VIEW */}
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            onLayout={onCameraLayout}
          />

          {/* 2. LỚP PHỦ KHUNG ẢNH (OVERLAY) */}
          <View style={styles.overlayContainer} pointerEvents="none">

            {/* Ảnh phía trên */}
            <Image
              source={frameBgImage}
              style={[
                styles.imageOverlay,
                { top: 0, height: overlayTop, width: cameraLayout.width },
              ]}
              resizeMode="cover" // Hoặc "repeat" nếu là ảnh texture nhỏ
            />

            {/* Ảnh phía dưới */}
            <Image
              source={frameBgImage}
              style={[
                styles.imageOverlay,
                {
                  bottom: 0,
                  height: overlayTop,
                  width: cameraLayout.width,
                },
              ]}
              resizeMode="cover"
            />

            {/* Ảnh bên trái (ở giữa) */}
            <Image
              source={frameBgImage}
              style={[
                styles.imageOverlay,
                {
                  top: overlayTop,
                  height: SQUARE_SIZE,
                  left: 0,
                  width: overlaySide,
                },
              ]}
              resizeMode="cover"
            />

            {/* Ảnh bên phải (ở giữa) */}
            <Image
              source={frameBgImage}
              style={[
                styles.imageOverlay,
                {
                  top: overlayTop,
                  height: SQUARE_SIZE,
                  right: 0,
                  width: overlaySide,
                },
              ]}
              resizeMode="cover"
            />

            {/* Khung viền sáng (giữ nguyên để làm nổi bật vùng chụp) */}
            <View
              style={[
                styles.squareBox,
                {
                  width: SQUARE_SIZE,
                  height: SQUARE_SIZE,
                  top: overlayTop,
                  left: overlaySide,
                },
              ]}
            />
          </View>

          {/* 3. NÚT ĐIỀU KHIỂN */}
          <View style={styles.buttonContainer}>

            {/* Nút Lật Camera (Tròn) */}
            <TouchableOpacity
              style={styles.secondaryButton} // Style mới cho nút phụ
              onPress={toggleFacing}
            >
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Nút Chụp (Giữ nguyên) */}
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>

            {/* Nút Rỗng bên phải để cân đối giao diện (hoặc sau này làm nút Flash/Gallery) */}
            <View style={styles.thirddaryButton} />

          </View>
        </>
      ) : (
        // GIAO DIỆN KHI ĐÃ CHỤP XONG (PREVIEW)
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          {loading ? (
            <ActivityIndicator size="large" color="#66BB6A" style={{marginTop: 20}} />
          ) : prediction ? (
            <View style={styles.resultBox}>
                <Text style={styles.predictionTitle}>Kết quả nhận diện:</Text>
                <Text style={styles.predictionText}>{prediction}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.captureButton, { marginTop: 30, backgroundColor: "#FF5252" }]}
            onPress={() => {
              setPhoto(null);
              setPrediction(null);
            }}
          >
            <Text style={styles.text}>Chụp lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  message: { textAlign: "center", padding: 20, color: "#fff", marginTop: 100 },
  camera: { flex: 1 },

  // Overlay Container phủ lên toàn bộ camera
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  // Style chung cho các miếng ảnh ghép
  imageOverlay: {
    position: "absolute",
    // Nếu muốn ảnh hơi trong suốt để nhìn thấy camera mờ bên dưới
    // opacity: 0.8,
  },

  // Khung viền sáng ở giữa
  squareBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#66BB6A", // Màu xanh chủ đạo
    borderRadius: 12, // Bo góc nhẹ
    // Shadow cho khung nổi lên
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },

  // Khu vực chứa nút bấm bên dưới
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.3)", // Nền bán trong suốt
    borderRadius: 25,
    alignItems: "center",
  },

  text: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  button: {
    padding: 15,
    backgroundColor: "#66BB6A",
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
  },

  // --- STYLES CHO MÀN HÌNH PREVIEW ---
  previewContainer: { flex: 1, backgroundColor: '#111', justifyContent: "center", alignItems: "center", padding: 20 },
  preview: {
    width: "100%",
    height: "60%", // Chiếm 60% chiều cao
    borderRadius: 16,
    resizeMode: "contain",
    borderWidth: 2,
    borderColor: '#333'
  },
  resultBox: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#222',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  predictionTitle: { color: "#aaa", fontSize: 14, marginBottom: 5 },
  predictionText: { color: "#66BB6A", fontSize: 24, fontWeight: 'bold', textTransform: 'capitalize' },
  buttonContainer: {
    position: "absolute",
    bottom: 50, // Đẩy lên cao chút cho đẹp
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly", // Căn đều khoảng cách 3 nút
    alignItems: "center",
  },

  // 👇 STYLE MỚI: Nút tròn phụ (Lật camera)
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25, // Tròn vo
    backgroundColor: "rgba(81, 187, 20, 1)", // Nền mờ nhẹ
    justifyContent: "center",
    alignItems: "center",
    // Nếu là View rỗng bên phải thì ẩn đi
    opacity: 1,
  },
  thirddaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25, // Tròn vo
    backgroundColor: "rgba(255, 255, 255, 0)", // Rỗng hoàn toàn
    justifyContent: "center",
    alignItems: "center",
  },
  // 👇 STYLE MỚI: Nút chụp (To hơn)
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)", // Vòng ngoài mờ
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(81, 187, 20, 1)",
  },

  // Cái chấm bên trong nút chụp (cho giống iPhone)
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#66BB6A", // Màu xanh chủ đạo
  },
});
