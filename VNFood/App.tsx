import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AppNavigator from "./Navigation/AppNavigator";

export default function App() {
  // ✅ Quản lý trạng thái đăng nhập toàn cục
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      {/* ✅ Truyền cả hai props xuống AppNavigator */}
      <AppNavigator isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </NavigationContainer>
  );
}
