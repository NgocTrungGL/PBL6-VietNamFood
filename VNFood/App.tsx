import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./Navigation/AppNavigator";
import { AuthProvider } from "./app/context/AuthContext"; // Import Provider vừa tạo

export default function App() {
  return (
    // Bọc AuthProvider ở ngoài cùng để toàn bộ App truy cập được dữ liệu User
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
