// components/FoodCard.tsx
import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";

export interface FoodDetails {
  food_id: string;
  name: string;
  main_image: { uri: string } | number;
  avg_rating: number;
  category_name: string;
  region_name: string;
  most_popular: boolean;
  category_id: number;
}

interface FoodCardProps {
  food: FoodDetails;
  onPress?: (foodId: string) => void;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => onPress?.(food.food_id)}
      activeOpacity={0.85}
    >
      <Image
        source={
          typeof food.main_image === "number"
            ? food.main_image
            : food.main_image &&
                typeof food.main_image === "object" &&
                "uri" in food.main_image
              ? food.main_image
              : { uri: String(food.main_image) }
        }
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.infoContainer}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {food.category_name}
        </Text>

        <Text style={styles.foodName} numberOfLines={2}>
          {food.name}
        </Text>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            ⭐ {food.avg_rating ? food.avg_rating.toFixed(1) : "N/A"}
          </Text>
          <Text style={styles.detailText} numberOfLines={1}>
            📍 {food.region_name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 180,
    height: 240,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 15,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  image: {
    width: "100%",
    height: "65%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  infoContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  categoryName: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  foodName: {
    fontSize: 15,
    color: "#222",
    fontWeight: "bold",
    marginVertical: 4,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
    flexShrink: 1,
  },
});

export default FoodCard;
