import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../app/context/AuthContext";
// Import các màn hình
import FoodDetailScreen from "../components/FoodDetail/FoodDetailScreen";
import RecipeDetailScreen from "../components/FoodDetail/RecipeDetailScreen";
import LoginScreen from "../app/Auth/LoginScreen";
import RegisterScreen from "../app/Auth/RegisterScreen";
import Update from "../app/User/Update";
import BottomTabs from "../components/Navigation/BottomTabs";
import { FoodDetails } from "../components/FoodCard/FoodCard";

// 👇 QUAN TRỌNG: Định nghĩa Params cho Stack để TypeScript không báo lỗi
export type RootStackParamList = {
  // Nhóm Auth
  LoginScreen: undefined;
  RegisterScreen: undefined;

  // Nhóm Main
  MainTabs: {
    screen?: string; // Để navigate vào màn con (VD: MapScreen)
    params?: any;    // Tham số cho màn con (VD: searchQuery)
  };

  // Chi tiết món ăn (Nhận foodData)
  FoodDetailScreen: { foodData: FoodDetails };

  // Chi tiết công thức (Nhận foodData theo logic mới)
  RecipeDetailScreen: { foodData: FoodDetails };

  // Cập nhật user
  Update: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  // Lấy user và loading từ Context
  const { user, isLoading } = useAuth();

  // Màn hình chờ (Splash) khi đang tải user từ bộ nhớ
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // --- LUỒNG ĐÃ ĐĂNG NHẬP ---
        <>
          <Stack.Screen name="MainTabs" component={BottomTabs} />

          <Stack.Screen
            name="FoodDetailScreen"
            component={FoodDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />

          <Stack.Screen
            name="Update"
            component={Update}
            options={{ animation: 'slide_from_bottom' }} // Hiệu ứng trượt từ dưới lên cho đẹp
          />

          <Stack.Screen
            name="RecipeDetailScreen"
            component={RecipeDetailScreen}
            options={{ animation: 'slide_from_right' }}
          />
        </>
      ) : (
        // --- LUỒNG CHƯA ĐĂNG NHẬP (AUTH) ---
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
