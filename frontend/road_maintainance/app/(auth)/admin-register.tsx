import { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

const RegisterAdmin = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://192.168.1.12:5000/register-admin", {
        name,
        email,
        password,
      });
      Alert.alert("Success", "Registration successful, please login.");
      router.replace("./(auth)/login");
    } catch (err) {
      Alert.alert("Error", "Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Registration</Text>

      <Text style={styles.label}>Admin Name:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Enter name"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Admin Email:</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Enter email"
        placeholderTextColor="#aaa"
      />

      <Text style={styles.label}>Password:</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="Enter password"
        placeholderTextColor="#aaa"
      />

      <Button title="Register" onPress={handleRegister} color="#555" />
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
    fontSize: 22,
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

export default RegisterAdmin;
