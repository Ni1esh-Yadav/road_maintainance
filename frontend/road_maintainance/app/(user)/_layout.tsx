import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";

const Tab = createBottomTabNavigator();

export default function Layout() {
  return (
    <Tabs>
      {/* <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="camera" options={{ title: "Camera" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} /> */}
    </Tabs>
  );
}
