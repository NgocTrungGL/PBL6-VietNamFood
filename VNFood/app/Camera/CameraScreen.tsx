// import React, { useRef, useState } from "react";
// import { View, StyleSheet, Text, TouchableOpacity, Image } from "react-native";
// import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

// export default function CameraScreen() {
//   const [facing, setFacing] = useState<CameraType>("back");
//   const [permission, requestPermission] = useCameraPermissions();
//   const [photo, setPhoto] = useState<string | null>(null);

//   const cameraRef = useRef<CameraView>(null);

//   if (!permission) {
//     return <View />;
//   }

//   if (!permission.granted) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.message}>
//           We need your permission to show the camera
//         </Text>
//         <TouchableOpacity style={styles.button} onPress={requestPermission}>
//           <Text style={styles.text}>Grant Permission</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   const toggleFacing = () => {
//     setFacing((cur) => (cur === "back" ? "front" : "back"));
//   };

//   const takePhoto = async () => {
//     if (!cameraRef.current) return;
//     try {
//       const result = await cameraRef.current.takePictureAsync();
//       setPhoto(result.uri); // chỉ hiện preview tạm thời
//     } catch (e) {
//       console.log("Error taking photo", e);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {!photo ? (
//         <>
//           <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity style={styles.smallButton} onPress={toggleFacing}>
//               <Text style={styles.text}>Flip</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
//               <Text style={styles.text}>Capture</Text>
//             </TouchableOpacity>
//           </View>
//         </>
//       ) : (
//         <View style={styles.previewContainer}>
//           <Image source={{ uri: photo }} style={styles.preview} />
//           <TouchableOpacity
//             style={styles.captureButton}
//             onPress={() => setPhoto(null)}
//           >
//             <Text style={styles.text}>Back</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#000" },
//   message: { textAlign: "center", padding: 10, color: "#fff" },
//   camera: { flex: 1 },
//   buttonContainer: {
//     position: "absolute",
//     bottom: 36,
//     width: "100%",
//     flexDirection: "row",
//     justifyContent: "space-around",
//   },
//   smallButton: {
//     padding: 12,
//     backgroundColor: "#444",
//     borderRadius: 8,
//   },
//   captureButton: {
//     padding: 12,
//     backgroundColor: "red",
//     borderRadius: 8,
//   },
//   button: {
//     padding: 12,
//     backgroundColor: "#1e90ff",
//     borderRadius: 8,
//     marginTop: 12,
//     alignItems: "center",
//   },
//   text: { color: "#fff", fontWeight: "600" },
//   previewContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
//   preview: {
//     width: "90%",
//     height: "80%",
//     borderRadius: 12,
//     resizeMode: "contain",
//   },
// });

//
import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
// Sử dụng cả File (API mới) và FileSystem legacy để đọc base64
import { File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View />;
  }

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

  const toggleFacing = () => {
    setFacing((cur) => (cur === "back" ? "front" : "back"));
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync();
      setPhoto(result.uri);
      await sendToModel(result.uri);
    } catch (e) {
      console.log("Error taking photo", e);
    }
  };

  const sendToModel = async (uri: string) => {
    setLoading(true);
    try {
      // Tạo đối tượng File mới nếu cần các thao tác với File, như info, exists, move, etc.
      const file = new File(uri);

      // Nhưng để đọc nội dung base64, dùng API legacy
      const base64 = await FileSystemLegacy.readAsStringAsync(uri, {
        encoding: FileSystemLegacy.EncodingType.Base64,
      });

      // Gửi tới API Flask
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
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.smallButton} onPress={toggleFacing}>
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
  buttonContainer: {
    position: "absolute",
    bottom: 36,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  smallButton: {
    padding: 12,
    backgroundColor: "#444",
    borderRadius: 8,
  },
  captureButton: {
    padding: 12,
    backgroundColor: "red",
    borderRadius: 8,
  },
  button: {
    padding: 12,
    backgroundColor: "#1e90ff",
    borderRadius: 8,
    marginTop: 12,
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
});
