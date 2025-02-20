import React, { useEffect, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "../../utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "../context/UserContext";

export default function ProfileScreen() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const { user, setUser } = useUser();

  const name = user?.name;
  const role = user?.role;
  const email = user?.email;
  console.log("Inside Home component, user:", name, role, email);

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

  return authenticated ? (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome {name}</Text>
      <Text style={styles.detailText}>Registered Email: {email}</Text>
      <Text style={styles.detailText}>Role: {role}</Text>
      <Button
        title="Logout"
        onPress={() => {
          AsyncStorage.removeItem("token");
          router.replace("../(auth)/login");
        }}
        color="#555"
      />
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
});
