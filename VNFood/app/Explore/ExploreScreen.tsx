import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

interface Food {
  id: string;
  name: string;
  image: any;
  description: string;
  price: string;
  region: string;
  rating: number;
}

interface Restaurant {
  id: string;
  name: string;
  image: any;
  specialty: string;
  rating: number;
  distance: string;
  deliveryTime: string;
}

interface RegionalFoods {
  [key: string]: Food[];
}

// Mock data cho các món ăn theo vùng miền
const regionalFoods: RegionalFoods = {
  north: [
    {
      id: "n1",
      name: "Phở Hà Nội",
      image: require("../../assets/images/bunbo.jpg"),
      description: "Phở bò truyền thống Hà Nội với nước dùng trong veo",
      price: "55.000đ",
      region: "Miền Bắc",
      rating: 4.8,
    },
    {
      id: "n2",
      name: "Bún Chả",
      image: require("../../assets/images/buncha.jpg"),
      description: "Đặc sản Hà Nội với thịt nướng thơm phức",
      price: "45.000đ",
      region: "Miền Bắc",
      rating: 4.7,
    },
    {
      id: "n3",
      name: "Chả Cá Lã Vọng",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Món cá nướng đặc trưng phố cổ Hà Nội",
      price: "85.000đ",
      region: "Miền Bắc",
      rating: 4.6,
    },
  ],
  central: [
    {
      id: "c1",
      name: "Mì Quảng",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Đặc sản Quảng Nam với nước dùng đậm đà",
      price: "50.000đ",
      region: "Miền Trung",
      rating: 4.7,
    },
    {
      id: "c2",
      name: "Bún Bò Huế",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Món bún cay nổi tiếng xứ Huế",
      price: "48.000đ",
      region: "Miền Trung",
      rating: 4.8,
    },
    {
      id: "c3",
      name: "Cao Lầu",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Đặc sản Hội An độc đáo",
      price: "42.000đ",
      region: "Miền Trung",
      rating: 4.5,
    },
  ],
  south: [
    {
      id: "s1",
      name: "Bánh Xèo",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Bánh xèo miền Tây giòn rụm, nhân tôm thịt",
      price: "38.000đ",
      region: "Miền Nam",
      rating: 4.6,
    },
    {
      id: "s2",
      name: "Hủ Tiếu",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Hủ tiếu Nam Vang đậm đà hương vị",
      price: "45.000đ",
      region: "Miền Nam",
      rating: 4.4,
    },
    {
      id: "s3",
      name: "Cơm Tấm",
      image: require("../../assets/banners/banhmi.webp"),
      description: "Cơm tấm sườn nướng Sài Gòn",
      price: "42.000đ",
      region: "Miền Nam",
      rating: 4.7,
    },
  ],
};

// Các nhà hàng nổi bật
const featuredRestaurants = [
  {
    id: "r1",
    name: "Nhà Hàng Ngon",
    image: require("../../assets/banners/banhmi.webp"),
    specialty: "Món Huế",
    rating: 4.8,
    distance: "1.2km",
    deliveryTime: "25-30 phút",
  },
  {
    id: "r2",
    name: "Quán Cô Ba",
    image: require("../../assets/banners/banhmi.webp"),
    specialty: "Phở Hà Nội",
    rating: 4.6,
    distance: "800m",
    deliveryTime: "15-20 phút",
  },
  {
    id: "r3",
    name: "Bếp Miền Tây",
    image: require("../../assets/banners/banhmi.webp"),
    specialty: "Món miền Nam",
    rating: 4.7,
    distance: "2.1km",
    deliveryTime: "30-35 phút",
  },
];

// Tags tìm kiếm phổ biến
const popularTags = [
  "Phở",
  "Bánh mì",
  "Cơm tấm",
  "Bún chả",
  "Bánh xèo",
  "Gỏi cuốn",
  "Chả giò",
  "Lẩu",
  "Nướng",
  "Chay",
];

export default function ExploreScreen() {
  const [searchText, setSearchText] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("north");
  const [activeTab, setActiveTab] = useState("regions");

  const regions = [
    { id: "north", name: "Miền Bắc", icon: "🏔️" },
    { id: "central", name: "Miền Trung", icon: "🏛️" },
    { id: "south", name: "Miền Nam", icon: "🌴" },
  ];

  const tabs = [
    { id: "regions", name: "Vùng miền", icon: "🗺️" },
    { id: "restaurants", name: "Nhà hàng", icon: "🏪" },
    { id: "trending", name: "Thịnh hành", icon: "🔥" },
  ];

  const renderRegionFood = ({ item }: { item: Food }) => (
    <TouchableOpacity style={styles.foodCard}>
      <Image source={item.image} style={styles.foodCardImage} />
      <View style={styles.foodCardContent}>
        <Text style={styles.foodCardName}>{item.name}</Text>
        <Text style={styles.foodCardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.foodCardFooter}>
          <Text style={styles.foodCardPrice}>{item.price}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={styles.restaurantCard}>
      <Image source={item.image} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantSpecialty}>{item.specialty}</Text>
        <View style={styles.restaurantDetails}>
          <Text style={styles.restaurantRating}>⭐ {item.rating}</Text>
          <Text style={styles.restaurantDistance}>📍 {item.distance}</Text>
          <Text style={styles.restaurantTime}>🕒 {item.deliveryTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPopularTag = (tag: string, index: number) => (
    <TouchableOpacity key={index} style={styles.tagButton}>
      <Text style={styles.tagText}>{tag}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Khám Phá</Text>
        <Text style={styles.headerSubtitle}>Tìm kiếm món ăn yêu thích</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm món ăn, nhà hàng..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Popular Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Tìm kiếm phổ biến</Text>
          <View style={styles.tagsContainer}>
            {popularTags.map(renderPopularTag)}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on active tab */}
        {activeTab === "regions" && (
          <>
            {/* Region Selector */}
            <View style={styles.regionSelector}>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region.id}
                  style={[
                    styles.regionButton,
                    selectedRegion === region.id && styles.activeRegionButton,
                  ]}
                  onPress={() => setSelectedRegion(region.id)}
                >
                  <Text style={styles.regionIcon}>{region.icon}</Text>
                  <Text
                    style={[
                      styles.regionText,
                      selectedRegion === region.id && styles.activeRegionText,
                    ]}
                  >
                    {region.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Regional Foods */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Món ăn đặc trưng{" "}
                {regions.find((r) => r.id === selectedRegion)?.name}
              </Text>
              <FlatList
                data={regionalFoods[selectedRegion]}
                renderItem={renderRegionFood}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          </>
        )}

        {activeTab === "restaurants" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏪 Nhà hàng nổi bật</Text>
            <FlatList
              data={featuredRestaurants}
              renderItem={renderRestaurant}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === "trending" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Xu hướng hiện tại</Text>
            <View style={styles.trendingContainer}>
              <View style={styles.trendingItem}>
                <Text style={styles.trendingEmoji}>🍜</Text>
                <Text style={styles.trendingText}>Phở chua Lạng Sơn</Text>
                <Text style={styles.trendingSubtext}>+125% tìm kiếm</Text>
              </View>
              <View style={styles.trendingItem}>
                <Text style={styles.trendingEmoji}>🦐</Text>
                <Text style={styles.trendingText}>Bánh khọt Vũng Tàu</Text>
                <Text style={styles.trendingSubtext}>+89% tìm kiếm</Text>
              </View>
              <View style={styles.trendingItem}>
                <Text style={styles.trendingEmoji}>🍲</Text>
                <Text style={styles.trendingText}>Lẩu cá kèo</Text>
                <Text style={styles.trendingSubtext}>+67% tìm kiếm</Text>
              </View>
            </View>
          </View>
        )}

        {/* Discover Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Khám phá thêm</Text>
          <View style={styles.discoverGrid}>
            <TouchableOpacity style={styles.discoverCard}>
              <Text style={styles.discoverEmoji}>📖</Text>
              <Text style={styles.discoverTitle}>Công thức</Text>
              <Text style={styles.discoverSubtext}>Học nấu ăn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discoverCard}>
              <Text style={styles.discoverEmoji}>🎥</Text>
              <Text style={styles.discoverTitle}>Video</Text>
              <Text style={styles.discoverSubtext}>Hướng dẫn chi tiết</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discoverCard}>
              <Text style={styles.discoverEmoji}>📍</Text>
              <Text style={styles.discoverTitle}>Quán gần</Text>
              <Text style={styles.discoverSubtext}>Tìm quanh đây</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discoverCard}>
              <Text style={styles.discoverEmoji}>⭐</Text>
              <Text style={styles.discoverTitle}>Review</Text>
              <Text style={styles.discoverSubtext}>Đánh giá món ăn</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: "#FF5722",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FF5722",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 1,
  },
  tagText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#FF5722",
    borderColor: "#FF5722",
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#fff",
  },
  regionSelector: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  regionButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeRegionButton: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF5722",
  },
  regionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  regionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeRegionText: {
    color: "#FF5722",
    fontWeight: "600",
  },
  horizontalList: {
    paddingLeft: 0,
  },
  foodCard: {
    width: width * 0.7,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  foodCardImage: {
    width: "100%",
    height: 120,
    resizeMode: "cover",
  },
  foodCardContent: {
    padding: 12,
  },
  foodCardName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  foodCardDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    lineHeight: 16,
  },
  foodCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodCardPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5722",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
  },
  restaurantCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  restaurantImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  restaurantSpecialty: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  restaurantDetails: {
    flexDirection: "row",
    gap: 12,
  },
  restaurantRating: {
    fontSize: 11,
    color: "#666",
  },
  restaurantDistance: {
    fontSize: 11,
    color: "#666",
  },
  restaurantTime: {
    fontSize: 11,
    color: "#666",
  },
  trendingContainer: {
    gap: 12,
  },
  trendingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  trendingEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  trendingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  trendingSubtext: {
    fontSize: 12,
    color: "#FF5722",
    fontWeight: "500",
  },
  discoverGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  discoverCard: {
    width: (width - 52) / 2,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  discoverEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  discoverTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  discoverSubtext: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
