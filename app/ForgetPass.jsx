import { useNavigation } from "@react-navigation/native";
import {
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  View,
  Alert,
  Platform,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useState } from "react";
import axios from "axios";

export default ForgetPass = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://api.naticoco.com/auth/reset-password",
        { email }
      );

      if (response.status == 200) {
        Alert.alert("Success", "OTP has been sent to your email");
        setStep(2);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "User not found or something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // const handleOTPVerify = async () => {
  //   if (!otp) {
  //     Alert.alert("Error", "Please enter the OTP");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const response = await axios.post(
  //       "https://api.naticoco.com/auth/resetpass-otp",
  //       { email, otp }
  //     );

  //     if (response.status == 200) {
  //       Alert.alert("Success", "OTP verified successfully");
  //       setStep(3);
  //     }
  //   } catch (error) {
  //     Alert.alert(
  //       "Error",
  //       error.response?.data?.message || "Invalid OTP or something went wrong"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters long");
      return;
    }

    if (!otp) {
     Alert.alert("Error", "Please enter the OTP");
     return;
   }

   try {
     console.log(otp,newPassword);
     setLoading(true);
     const response = await axios.patch(
       "https://api.naticoco.com/auth/resetpass-otp",
       { token : otp,
         pwd : newPassword 
        }
     );
     console.log(response.status);
     if (response.status == 200 || 201) {
       Alert.alert("Success", "OTP verified successfully");
       navigation.navigate('Login');
     }
   } catch (error) {
     Alert.alert(
       "Error",
       error.response?.data?.message || "Invalid OTP or something went wrong"
     );
   } finally {
     setLoading(false);
   }
 };




  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Reset Password</Text>

          {step === 1 && (
            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handleEmailSubmit}
                loading={loading}
                style={styles.button}
              >
                Send OTP
              </Button>
            </View>
          )}

          {step === 2 && (
            <View style={styles.inputContainer}>
              <TextInput
                label="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <View style={styles.inputContainer}>
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
              />
              <Button
                mode="contained"
                onPress={handlePasswordReset}
                loading={loading}
                style={styles.button}
              >
                Reset Password
              </Button>
            </View>
            </View>
            
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.backToLogin}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: "contain",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 400,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor : '#F8931F'
  },
  backToLogin: {
    marginTop: 20,
  },
  backToLoginText: {
    color: "#666",
    textDecorationLine: "underline",
  },
});

