import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image } from "react-native";

// Import screen (chỉ có Home bạn đã có, các screen khác tạo file trống trước)
import HomeScreen from "../../app/Home/HomeScreen";
import CameraScreen from "../../app/Camera/CameraScreen";
import ChatboxScreen from "../../app/Chat/ChatboxScreen";
import ExploreScreen from "../../app/Explore/ExploreScreen";
import MapScreen from "../../app/Map/MapScreen";
import ProfileScreen from "../../app/User/Profile";
const Tab = createBottomTabNavigator();

export default function BottomTabs() {
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
              source={require("../../assets/icon/home_icon.png")}
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
              source={require("../../assets/icon/camera_icon_1.png")}
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
              source={require("../../assets/icon/chat.png")}
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
              source={require("../../assets/icon/explore-icon.png")}
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
              source={require("../../assets/icon/map.png")}
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
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("../../assets/icon/profile.png")}
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
