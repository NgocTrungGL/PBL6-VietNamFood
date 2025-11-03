import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  FlatList,
  Keyboard,
  Linking, // << 1. Import Linking
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";

interface Place {
  lat: string;
  lon: string;
  display_name: string;
}

const MapScreen: React.FC = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [travelInfo, setTravelInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Ứng dụng cần quyền truy cập vị trí để hoạt động."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    })();
  }, []);

  // Các hàm getDistanceKm, searchNearby không đổi...
  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const searchNearby = async () => {
    Keyboard.dismiss();
    if (!region || query.trim() === "") return;
    setRouteCoords([]);
    setTravelInfo(null);
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query + " restaurant"
      )}&format=json&addressdetails=1&limit=20&viewbox=${(
        region.longitude - 0.1
      ).toString()},${(region.latitude + 0.1).toString()},${(region.longitude + 0.1).toString()},${(
        region.latitude - 0.1
      ).toString()}`;
      const res = await axios.get(url);
      const data: Place[] = res.data;
      const nearby = data.filter((p) => {
        const dist = getDistanceKm(
          region.latitude,
          region.longitude,
          parseFloat(p.lat),
          parseFloat(p.lon)
        );
        return dist <= 10;
      });
      if (nearby.length === 0) {
        Alert.alert(
          "Không tìm thấy",
          "Không có quán ăn nào trong phạm vi 10km với từ khóa này."
        );
      }
      setPlaces(nearby);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải dữ liệu quán ăn.");
    } finally {
      setLoading(false);
    }
  };

  // Hàm getDirections để vẽ đường đi trong app (giữ nguyên)
  const getDirections = async (lat: number, lon: number) => {
    if (!region) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${region.longitude.toString()},${region.latitude.toString()};${lon.toString()},${lat.toString()}?overview=full&geometries=geojson`;
      const res = await axios.get(url);

      const route = res.data.routes[0];
      const coords = route.geometry.coordinates.map((c: number[]) => ({
        latitude: c[1],
        longitude: c[0],
      }));
      const durationInSeconds = route.duration;
      const durationInMinutes = Math.round(durationInSeconds / 60);
      setTravelInfo(`Thời gian di chuyển: ${durationInMinutes} phút 🚗`);

      setRouteCoords(coords);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy dữ liệu chỉ đường.");
    }
  };

  // << 2. Tạo hàm để mở Google Maps
  const openGoogleMaps = (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url).catch((err) =>
      console.error("An error occurred", err)
    );
  };

  return (
    <View style={styles.container}>
      {region && (
        <MapView style={styles.map} region={region} showsUserLocation>
          {places.map((p, i) => (
            <Marker
              key={i}
              coordinate={{
                latitude: parseFloat(p.lat),
                longitude: parseFloat(p.lon),
              }}
              title={p.display_name}
              onPress={() =>
                getDirections(parseFloat(p.lat), parseFloat(p.lon))
              }
            />
          ))}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="blue"
            />
          )}
        </MapView>
      )}

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Nhập tên món ăn..."
          style={styles.input}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity style={styles.button} onPress={searchNearby}>
          <Text style={styles.buttonText}>{loading ? "..." : "Tìm"}</Text>
        </TouchableOpacity>
      </View>

      {travelInfo && (
        <View style={styles.travelInfoContainer}>
          <Text style={styles.travelInfoText}>{travelInfo}</Text>
        </View>
      )}

      {places.length > 0 && (
        <View style={styles.listContainer}>
          <FlatList
            data={places}
            keyExtractor={(_, index) => index.toString()}
            // << 3. Cập nhật lại giao diện của mỗi item trong danh sách
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() =>
                    getDirections(parseFloat(item.lat), parseFloat(item.lon))
                  }
                >
                  <Text style={styles.placeName}>{item.display_name}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() =>
                    openGoogleMaps(parseFloat(item.lat), parseFloat(item.lon))
                  }
                >
                  <Text style={styles.directionsButtonText}>Chỉ đường</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default MapScreen;

// << 4. Thêm style mới cho nút chỉ đường
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  searchBar: {
    position: "absolute",
    top: 60,
    left: 15,
    right: 15,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 5,
    padding: 10,
  },
  input: { flex: 1, paddingHorizontal: 10, fontSize: 16 },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
  travelInfoContainer: {
    position: "absolute",
    bottom: 210,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    elevation: 5,
  },
  travelInfoText: { fontSize: 16, fontWeight: "bold", color: "#333" },
  listContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 10,
  },
  // Style cho item trong danh sách
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  placeName: {
    fontSize: 15,
    color: "#333",
    flexShrink: 1, // Cho phép text tự xuống dòng nếu quá dài
  },
  // Style cho nút "Chỉ đường"
  directionsButton: {
    backgroundColor: "#1a73e8", // Màu xanh của Google
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  directionsButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
