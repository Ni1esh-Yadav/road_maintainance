import { Text, View,StyleSheet } from "react-native";

export default function Index() {

  const styles = StyleSheet.create({
    container :{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    text:{
      fontSize: 20,
      fontWeight: "bold",
      justifyContent: "center",
      alignItems: "center",
    }
  })

  return (
    <View
      style={styles.container}
    >
      <Text style = {styles.text}>Edit app/index.tsx to edit this screen.</Text>
    </View>
  )
   
}
