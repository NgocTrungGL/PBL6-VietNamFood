import React from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../app/context/AuthContext"; // Import hook

import FoodDetailScreen from "../components/FoodDetail/FoodDetailScreen";
import LoginScreen from "../app/Auth/LoginScreen";
import RegisterScreen from "../app/Auth/RegisterScreen";
import Update from "../app/User/Update";
import BottomTabs from "../components/Navigation/BottomTabs";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  // Lấy thẳng user và isLoading từ Context
  const { user, isLoading } = useAuth();

  // Màn hình chờ (Splash) khi đang check AsyncStorage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#66BB6A" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? ( // Kiểm tra: Nếu có user -> Vào Main, Nếu không -> Vào Login
        <>
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen name="FoodDetailScreen" component={FoodDetailScreen} />
          <Stack.Screen name="Update" component={Update} />
        </>
      ) : (
        <>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
