import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Image } from "react-native";

// --- Import các màn hình chính ---
import HomeScreen from "../app/Home/HomeScreen";
import CameraScreen from "../app/Camera/CameraScreen";
import ChatboxScreen from "../app/Chat/ChatboxScreen";
import ExploreScreen from "../app/Explore/ExploreScreen";
import MapScreen from "../app/Map/MapScreen";
import FoodDetailScreen from "../components/FoodDetail/FoodDetailScreen";

// --- Import Auth screens ---
import LoginScreen from "../app/Auth/LoginScreen";
import RegisterScreen from "../app/Auth/RegisterScreen";

// --- Định nghĩa type-safe cho navigation ---
export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  MainTabs: undefined;
  FoodDetailScreen: { foodId?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/icon/home_icon.png")}
              style={{
                width: 25,
                height: 25,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/icon/camera_icon_1.png")}
              style={{
                width: 25,
                height: 25,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Chatbox"
        component={ChatboxScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/icon/chat_1.png")}
              style={{
                width: 25,
                height: 25,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/icon/explore-icon.png")}
              style={{
                width: 25,
                height: 25,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/icon/map.png")}
              style={{
                width: 25,
                height: 25,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../assets/icon/profile.png")}
              style={{
                width: 25,
                height: 25,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- Navigator chính ---
export default function AppNavigator() {
  // ⚠️ Giả lập trạng thái đăng nhập (test UI)
  const isLoggedIn = true;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <>
          {/* Khi đã đăng nhập → hiển thị tab và màn chi tiết */}
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen name="FoodDetailScreen" component={FoodDetailScreen} />
        </>
      ) : (
        <>
          {/* Khi CHƯA đăng nhập → hiển thị Auth UI */}
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
