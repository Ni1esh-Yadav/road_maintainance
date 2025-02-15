import { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://192.168.1.12:5000/login", {
        email,
        password,
        role,
      });
      await AsyncStorage.setItem("token", res.data.token);
      Alert.alert("Success", "Logged in successfully");
      router.replace("./index"); // Navigate to home
    } catch (err) {
      Alert.alert("Error", "Invalid email or password");
    }
  };

  return (
    <View>
      <Text>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Text>Password:</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Text>Role:</Text>
      <TextInput value={role} onChangeText={setRole} autoCapitalize="none" />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default Login;
