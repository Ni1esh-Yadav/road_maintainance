import { View, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";

export default function RegisterComplaint() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        👤 To register a complaint, please click the button below and capture a
        picture of the damaged road.
      </Text>
      <Button
        title="Open Camera"
        onPress={() => router.push("../camera")}
        color="#555"
      />
    </View>
  );
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
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
  },
});
