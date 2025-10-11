import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import BottomTabs from "./components/Navigation/BottomTabs";
// import MapboxGL from "@rnmapbox/maps";
// MapboxGL.setAccessToken("QWDUWn90yRFgk1qg9rNivLaWfDZqpMw9AttLwA3C");
export default function App() {
  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
