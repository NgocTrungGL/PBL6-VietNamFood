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
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp } from "@react-navigation/native";

// Định nghĩa kiểu cho Params nhận từ FoodDetail
type MapScreenRouteProp = RouteProp<{ MapScreen: { searchQuery?: string } }, 'MapScreen'>;

interface Place {
  lat: string;
  lon: string;
  display_name: string;
}

const MapScreen: React.FC = () => {
  const route = useRoute<MapScreenRouteProp>();
  const incomingQuery = route.params?.searchQuery;

  const [region, setRegion] = useState<Region | null>(null);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [travelInfo, setTravelInfo] = useState<string | null>(null);

  // 1. Lấy vị trí hiện tại khi mở màn hình
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền bị từ chối", "Cần quyền vị trí để tìm quán ăn gần bạn.");
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

  // 2. Tự động tìm kiếm nếu bấm "Go Eat" từ trang chi tiết
  useEffect(() => {
    if (incomingQuery && region) {
      setQuery(incomingQuery);
      // Gọi hàm search với từ khóa được truyền sang
      searchNearby(incomingQuery);
    }
  }, [incomingQuery, region]); // Chạy khi có region và incomingQuery

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  const searchNearby = async (customQuery?: string) => {
    Keyboard.dismiss();
    const searchTerm = customQuery || query; // Ưu tiên từ khóa truyền vào

    if (!region || searchTerm.trim() === "") return;

    setRouteCoords([]);
    setTravelInfo(null);
    setLoading(true);

    try {
      // Tìm kiếm quán ăn (restaurant/food)
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        searchTerm + " restaurant"
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
        return dist <= 10; // Bán kính 10km
      });

      if (nearby.length === 0) {
        Alert.alert("Rất tiếc", `Không tìm thấy quán "${searchTerm}" nào gần đây.`);
      }
      setPlaces(nearby);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải dữ liệu quán ăn.");
    } finally {
      setLoading(false);
    }
  };

  // Vẽ đường nội bộ (OSRM)
  const getDirections = async (lat: number, lon: number) => {
    if (!region) return;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${region.longitude},${region.latitude};${lon},${lat}?overview=full&geometries=geojson`;
      const res = await axios.get(url);

      if (!res.data.routes || res.data.routes.length === 0) {
          Alert.alert("Lỗi", "Không tìm thấy đường đi.");
          return;
      }

      const route = res.data.routes[0];
      const coords = route.geometry.coordinates.map((c: number[]) => ({
        latitude: c[1],
        longitude: c[0],
      }));

      const durationInMinutes = Math.round(route.duration / 60);
      setTravelInfo(`🚗 Thời gian: ${durationInMinutes} phút`);
      setRouteCoords(coords);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lấy dữ liệu chỉ đường.");
    }
  };

  // Mở Google Maps (External App)
  const openGoogleMaps = (lat: number, lon: number) => {
    // Link chuẩn để mở chế độ dẫn đường (Directions)
    const url = Platform.select({
        ios: `http://maps.apple.com/?daddr=${lat},${lon}`,
        android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
    });

    if (url) {
        Linking.openURL(url).catch((err) =>
            console.error("Không thể mở bản đồ", err)
        );
    }
  };

  return (
    <View style={styles.container}>
      {region ? (
        <MapView style={styles.map} region={region} showsUserLocation>
          {places.map((p, i) => (
            <Marker
              key={i}
              coordinate={{
                latitude: parseFloat(p.lat),
                longitude: parseFloat(p.lon),
              }}
              title={p.display_name}
              onPress={() => getDirections(parseFloat(p.lat), parseFloat(p.lon))}
            />
          ))}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={4}
              strokeColor="#4285F4" // Màu xanh đường đi Google Maps
            />
          )}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#66BB6A" />
            <Text>Đang lấy vị trí...</Text>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput
          placeholder="Tìm quán ăn..."
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.button} onPress={() => searchNearby()}>
          {loading ? <ActivityIndicator color="#fff" size="small"/> : <Ionicons name="search" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>

      {/* Info Box (Thời gian di chuyển) */}
      {travelInfo && (
        <View style={styles.travelInfoContainer}>
          <Text style={styles.travelInfoText}>{travelInfo}</Text>
        </View>
      )}

      {/* List Result Bottom Sheet */}
      {places.length > 0 && (
        <View style={styles.listContainer}>
          <View style={styles.dragger} />
          <Text style={styles.resultTitle}>Kết quả tìm kiếm ({places.length})</Text>
          <FlatList
            data={places}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                {/* Click tên quán -> Vẽ đường trên App */}
                <TouchableOpacity
                  style={styles.placeInfo}
                  onPress={() => getDirections(parseFloat(item.lat), parseFloat(item.lon))}
                >
                  <Ionicons name="location" size={24} color="#FF5722" style={{marginRight: 10}} />
                  <Text style={styles.placeName} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>

                {/* Click nút -> Mở Google Maps */}
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={() => openGoogleMaps(parseFloat(item.lat), parseFloat(item.lon))}
                >
                  <Ionicons name="navigate" size={18} color="#fff" />
                  <Text style={styles.directionsButtonText}>Go</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  searchBar: {
    position: "absolute",
    top: 50, // Tránh tai thỏ
    left: 15,
    right: 15,
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 5,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    height: 45
  },
  button: {
    backgroundColor: "#66BB6A", // Xanh chủ đạo
    borderRadius: 10,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  travelInfoContainer: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  travelInfoText: { fontSize: 14, fontWeight: "bold", color: "#66BB6A" },

  // List Bottom Sheet
  listContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%', // Chiếm 35% màn hình dưới
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 10,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dragger: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 10
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333'
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  placeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  placeName: {
    fontSize: 14,
    color: "#333",
    fontWeight: '500',
    flexShrink: 1,
  },
  directionsButton: {
    backgroundColor: "#4285F4", // Xanh Google Maps
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  directionsButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
