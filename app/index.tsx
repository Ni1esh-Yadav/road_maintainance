import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Select User Type</Text>

      {/* Admin Button */}
      <Pressable
        style={{
          padding: 15,
          backgroundColor: "red",
          borderRadius: 5,
          marginBottom: 10,
        }}
        onPress={() => router.push("./admin")}
      >
        <Text style={{ color: "white", fontSize: 18 }}>Admin</Text>
      </Pressable>

      {/* User Button */}
      <Pressable
        style={{ padding: 15, backgroundColor: "blue", borderRadius: 5 }}
        onPress={() => router.push("./(tabs)")}
      >
        <Text style={{ color: "white", fontSize: 18 }}>User</Text>
      </Pressable>
    </View>
  );
}
