import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "../../utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DetectionsScreen from "../../components/DetectionsScreen";
import { useUser } from "../context/UserContext";

const Home = () => {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const { user, setUser } = useUser();

  console.log("Inside Home component, user:", user);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) {
        router.replace("./(auth)/login");
      } else {
        setAuthenticated(true);
      }
    };
    checkAuth();
  }, [router]);

  if (!user || !user.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User ID is missing.</Text>
      </View>
    );
  }

  return authenticated ? (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to Home Page</Text>
      <DetectionsScreen userId={user.id} />
      <Button
        title="Logout"
        onPress={() => {
          AsyncStorage.removeItem("token");
          router.replace("./(auth)/login");
        }}
      />
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  welcomeText: { fontSize: 18, marginBottom: 20 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 16 },
});

export default Home;
