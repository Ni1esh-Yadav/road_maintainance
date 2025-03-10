// app/(auth)/login.tsx
import { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext"; // adjust the path as needed

const Login = () => {
  const router = useRouter();
  const { setUser } = useUser();
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
      console.log("printing res in login.tsx", res.data);
      setRole(res.data.user.role);

      // console.log("inside login route printing userid", res.data.user.id);

      // Save the user data to context
      setUser(res.data.user);

      Alert.alert("Success", "Logged in successfully");
      if (role == "user") {
        router.push("../(user)/home");
      } else {
        router.push("../(admin)/admin");
      }
    } catch (err) {
      Alert.alert("Error", "Invalid email or password");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <Text style={styles.label}>Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter your email"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter your password"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Role:</Text>
      <TextInput
        style={styles.input}
        value={role}
        onChangeText={setRole}
        autoCapitalize="none"
        placeholder="Eg: User or Admin"
        placeholderTextColor="#aaa"
      />

      <Button title="Login" onPress={handleLogin} color="#555" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    color: "#333",
    marginBottom: 15,
  },
});

export default Login;
