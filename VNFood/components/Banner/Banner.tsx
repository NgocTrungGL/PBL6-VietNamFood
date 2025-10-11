import React, { useRef, useEffect, useState } from "react";
import { View, FlatList, Dimensions, StyleSheet } from "react-native";
import BannerItem from "./BannerItem";

const { width } = Dimensions.get("window");

const banners = [
  require("../../assets/images/buncha.jpg"),
  require("../../assets/banners/bunbohue.jpg"),
  require("../../assets/banners/cafe.jpg"),
];

export default function Banner() {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto slide mỗi 3s
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Cập nhật index khi người dùng vuốt tay
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View style={{ height: 220 }}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={({ item }) => <BannerItem image={item} />}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Dot indicator */}
      <View style={styles.dotsContainer}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#ff6600", // dot đang active
    width: 10,
    height: 10,
  },
});
