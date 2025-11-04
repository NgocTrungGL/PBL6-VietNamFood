import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { RootStackParamList } from "./types"; // nếu bạn tách type riêng
import FoodDetailScreen from "../components/FoodDetail/FoodDetailScreen";
import LoginScreen from "../app/Auth/LoginScreen";
import RegisterScreen from "../app/Auth/RegisterScreen";
import Update from "../app/User/Update";
import BottomTabs from "../components/Navigation/BottomTabs"; // ✅ import đúng

const Stack = createNativeStackNavigator<RootStackParamList>();
export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  MainTabs: undefined;
  FoodDetailScreen: { foodId?: number };
  Update: undefined;
};
export default function AppNavigator() {
  const isLoggedIn = true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
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
