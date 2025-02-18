import { useEffect, useState } from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";
import { getToken } from "../../utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HistoryScreen from "../../components/HistoryScreen";

const Home = () => {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken();
      if (!token) router.replace("./(auth)/login");
      else setAuthenticated(true);
    };
    checkAuth();
  }, []);

  return authenticated ? (
    <View>
      <Text>Welcome to Home Page</Text>
      <HistoryScreen />
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

export default Home;
