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
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystemLegacy from "expo-file-system/legacy";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
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
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const onCameraLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCameraLayout({ width, height });
  };

  const SQUARE_SIZE = cameraLayout.width * 0.8;
  const overlayTop = (cameraLayout.height - SQUARE_SIZE) / 2;
  const overlaySide = (cameraLayout.width - SQUARE_SIZE) / 2;

  const toggleFacing = () =>
    setFacing((cur) => (cur === "back" ? "front" : "back"));

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync();
      const cropped = await cropToSquare(result.uri);
      setPhoto(cropped.uri);
      await sendToModel(cropped.uri);
    } catch (e) {
      console.log("Error taking photo", e);
    }
  };

  const cropToSquare = async (uri: string) => {
    const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
      base64: false,
    });
    const side = Math.min(imageInfo.width, imageInfo.height);
    const left = (imageInfo.width - side) / 2;
    const top = (imageInfo.height - side) / 2;

    return await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: left, originY: top, width: side, height: side } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );
  };

  const sendToModel = async (uri: string) => {
    setLoading(true);
    try {
      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      const response = await fetch("http://172.20.10.6:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();
      setPrediction(data.class_name);
    } catch (error) {
      console.log("Error sending image to model", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!photo ? (
        <>
          <CameraView
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            onLayout={onCameraLayout}
          />

          {/* Khung chụp */}
          <View style={styles.overlayContainer} pointerEvents="none">
            {/* Mờ phía trên */}
            <View
              style={[
                styles.dimOverlay,
                { top: 0, height: overlayTop, width: cameraLayout.width },
              ]}
            />
            {/* Mờ phía dưới */}
            <View
              style={[
                styles.dimOverlay,
                {
                  bottom: 0,
                  height: overlayTop,
                  width: cameraLayout.width,
                },
              ]}
            />
            {/* Mờ bên trái */}
            <View
              style={[
                styles.dimOverlay,
                {
                  top: overlayTop,
                  height: SQUARE_SIZE,
                  left: 0,
                  width: overlaySide,
                },
              ]}
            />
            {/* Mờ bên phải */}
            <View
              style={[
                styles.dimOverlay,
                {
                  top: overlayTop,
                  height: SQUARE_SIZE,
                  right: 0,
                  width: overlaySide,
                },
              ]}
            />
            {/* Khung sáng */}
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

          {/* Nút điều khiển */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFacing}
            >
              <Text style={styles.text}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Text style={styles.text}>Capture</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : prediction ? (
            <Text style={styles.predictionText}>Prediction: {prediction}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.captureButton}
            onPress={() => {
              setPhoto(null);
              setPrediction(null);
            }}
          >
            <Text style={styles.text}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  message: { textAlign: "center", padding: 10, color: "#fff" },
  camera: { flex: 1 },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  squareBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#00FFAA",
    borderRadius: 12,
  },
  dimOverlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 36,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  controlButton: {
    width: 120,
    paddingVertical: 12,
    backgroundColor: "#444",
    borderRadius: 10,
    alignItems: "center",
  },
  captureButton: {
    width: 120,
    paddingVertical: 12,
    backgroundColor: "#66BB6A",
    borderRadius: 10,
    alignItems: "center",
  },
  text: { color: "#fff", fontWeight: "600" },
  previewContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  preview: {
    width: "90%",
    height: "80%",
    borderRadius: 12,
    resizeMode: "contain",
  },
  predictionText: { color: "#fff", fontSize: 18, marginTop: 12 },
  button: {
    padding: 12,
    backgroundColor: "#66BB6A",
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
});
