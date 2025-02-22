import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const AdminScreen = () => {
  const router = useRouter();

  const handleNavigation = (status: string) => {
    router.push(`./detections/${status}`);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Admin Panel
      </Text>

      {["pending", "approved", "rejected"].map((status) => (
        <TouchableOpacity
          key={status}
          onPress={() => handleNavigation(status)}
          style={{
            backgroundColor: "blue",
            padding: 15,
            marginVertical: 10,
            width: 200,
            alignItems: "center",
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontSize: 18 }}>
            {status.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default AdminScreen;
