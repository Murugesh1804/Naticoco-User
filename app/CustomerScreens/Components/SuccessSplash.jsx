import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from '@react-navigation/native';

const SplashScreenComponent = ({ route }) => {
  const navigation = useNavigation();  
  const { orderId } = route.params;

  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Track", { orderId: orderId });
    }, 1000);
  }, [navigation, orderId]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <Ionicons name="checkmark-done-circle" size={220} color="#89C73A" />
      <Text style={styles.text}>Payment Successful</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000", // Splash screen background color
  },
  text: {
    fontSize: 24,
    color: "#333", // Splash screen text color
  },
});

export default SplashScreenComponent;
