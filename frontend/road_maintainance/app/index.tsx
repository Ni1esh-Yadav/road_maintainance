import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { Svg, Line } from "react-native-svg";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#333",
          marginBottom: 10,
        }}
      >
        New to Road Maintenance
      </Text>

      <View style={{ width: "100%", alignItems: "center", marginBottom: 20 }}>
        <Button
          title="Register as User"
          onPress={() => router.push("./(auth)/register")}
          color="#555"
        />
        <View style={{ marginVertical: 10 }} />
        <Button
          title="Register as Admin"
          onPress={() => router.push("./(auth)/admin-register")}
          color="#555"
        />
      </View>

      <Svg height="2" width="100%" style={{ marginVertical: 20 }}>
        <Line x1="0" y1="0" x2="100%" y2="0" stroke="grey" strokeWidth="2" />
      </Svg>

      <Text style={{ fontSize: 18, color: "#666", marginBottom: 10 }}>
        Already Registered?
      </Text>

      <Button
        title="Login"
        onPress={() => router.push("./(auth)/login")}
        color="#555"
      />
    </View>
  );
}
