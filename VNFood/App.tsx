import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "react-native";
import AppNavigator from "./Navigation/AppNavigator";
import { AuthProvider } from "./app/context/AuthContext";
// 👇 IMPORT MỚI
import { FoodProvider } from "./app/context/FoodContext";

export default function App() {
  return (
    <AuthProvider>
      {/* 👇 BỌC FOOD PROVIDER Ở ĐÂY */}
      <FoodProvider>
        <NavigationContainer>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </NavigationContainer>
      </FoodProvider>
    </AuthProvider>
  );
}
