import { View, Text, StyleSheet, Button } from "react-native";
import { Tabs, useRouter } from "expo-router";

export default function RegisterComplaint() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>👤 registerComplaint Screen</Text>
      <Button title="open camera" onPress={() => router.push("../camera")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 24, fontWeight: "bold" },
});
