import { View, Text, Button, StyleSheet } from "react-native";
import DetectionsScreen from "../../components/DetectionsScreen";
import { useUser } from "../context/UserContext";

const Home = () => {
  const { user } = useUser();

  if (!user || !user.id) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>User ID is missing.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to Home Page</Text>
      <DetectionsScreen userId={user.id} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  welcomeText: { fontSize: 18, marginBottom: 20 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 16 },
});

export default Home;
