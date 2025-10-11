import React from "react";
import { Image, Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

type Props = {
  image: any;
};

export default function BannerItem({ image }: Props) {
  return (
    <Image source={image} style={styles.image} resizeMode="cover" />
  );
}

const styles = StyleSheet.create({
  image: {
    width: width,
    height: 200,
    borderRadius: 10,
  },
});
