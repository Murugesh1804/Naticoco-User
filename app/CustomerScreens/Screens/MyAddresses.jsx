import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ScreenBackground from "../Components/ScreenBackground";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MyAddresses() {
  const navigation = useNavigation();
  const [addresses, setAddresses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "",
    address: "",
    landmark: "",
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied. Location access is required.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (response[0]) {
        const addr = response[0];
        const street = addr.street || "";
        const name = addr.name || "";
        const city = addr.city || "";
        const region = addr.region || "";
        const fullAddress = `${street} ${name}, ${city}, ${region}`.trim();

        setNewAddress((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Could not get current location");
    }
  };

  const fetchAddresses = async () => {
    try {
      const credentials = await AsyncStorage.getItem("logincre");
      const parsedCredentials = credentials ? JSON.parse(credentials) : null;
      const userId = parsedCredentials?.token?.userId;

      if (!userId) {
        alert("Please login to view addresses");
        return;
      }

      const response = await axios.get(
        `http://192.168.29.165:3500/location/address/${userId}`
      );
      if (response.status === 200) {
        setAddresses(response.data.addresses);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      alert("Could not fetch addresses");
    }
  };

  const handleAddAddress = async () => {
    if (
      !newAddress.type ||
      !newAddress.address ||
      !newAddress.latitude ||
      !newAddress.longitude
    ) {
      alert("Please fill in all required fields and set location");
      return;
    }

    try {
      const credentials = await AsyncStorage.getItem("logincre");
      const parsedCredentials = credentials ? JSON.parse(credentials) : null;
      const userId = parsedCredentials?.token?.userId;

      if (!userId) {
        alert("Please login to add address");
        return;
      }

      const addressData = {
        userId,
        type: newAddress.type,
        address: newAddress.address,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
        landmark: newAddress.landmark || null,
      };

      const response = await axios.post(
        "http://192.168.29.165:3500/location/address",
        addressData
      );

      if (response.status === 201) {
        fetchAddresses();
        setModalVisible(false);
        setNewAddress({
          type: "",
          address: "",
          landmark: "",
          latitude: null,
          longitude: null,
        });
      }
    } catch (error) {
      console.error("Error adding address:", error);
      alert("Could not add address");
    }
  };

  const handleSetDefault = (id) => {
    setAddresses(
      addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const credentials = await AsyncStorage.getItem("logincre");
      const parsedCredentials = credentials ? JSON.parse(credentials) : null;
      const userId = parsedCredentials?.token?.userId;

      if (!userId) {
        alert("Please login to delete address");
        return;
      }
      console.log(userId, addressId);
      const response = await axios.delete(
        `http://192.168.29.165:3500/location/address/${userId}/${addressId}`
      );

      if (response.status === 200) {
        fetchAddresses();
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Could not delete address");
    }
  };

  const AddressCard = ({ address }) => {
    return (
      <View style={styles.addressCard}>
        <View style={styles.addressHeader}>
          <View style={styles.typeContainer}>
            <Ionicons name="location-outline" size={20} color="#F8931F" />
            <Text style={styles.addressType}>{address.type}</Text>
          </View>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>

        <Text style={styles.addressText}>{address.address}</Text>
        {address.landmark && (
          <Text style={styles.addressText}>Landmark: {address.landmark}</Text>
        )}

        <View style={styles.actionRow}>
          {!address.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(address.id)}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#F8931F"
              />
              <Text style={styles.actionButtonText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAddress(address._id)}
          >
            <Ionicons name="trash-outline" size={20} color="#F8931F" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScreenBackground style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Addresses</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={24} color="#F8931F" />
        </TouchableOpacity>
      </View>

      {addresses ? (
        <FlatList
          data={addresses}
          renderItem={({ item }) => <AddressCard address={item} />}
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={styles.addressList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => {
            if (addresses == []) {
              <View style={{ backgroundColor: "black" }}>
                <Text style={{ backgroundColor: "black" }}>
                  No addresses found
                </Text>
              </View>;
            }
          }}
        />
      ) : (
        <View>
          <Text>No Address Saved</Text>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalWrapper}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Address</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address Type</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.type}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, type: text })
                    }
                    placeholder="e.g., Home, Office, etc."
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Complete Address</Text>
                  <View style={styles.addressInputContainer}>
                    <TextInput
                      style={[styles.input, styles.addressInput]}
                      value={newAddress.address}
                      onChangeText={(text) =>
                        setNewAddress({ ...newAddress, address: text })
                      }
                      placeholder="Enter full address"
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.locationButton}
                      onPress={getCurrentLocation}
                    >
                      <Ionicons name="locate" size={24} color="#F8931F" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Landmark (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.landmark}
                    onChangeText={(text) =>
                      setNewAddress({ ...newAddress, landmark: text })
                    }
                    placeholder="Nearby landmark"
                  />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  handleAddAddress();
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.saveButtonText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8931F",
  },
  addressList: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressType: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  defaultBadge: {
    backgroundColor: "#89C73A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  actionButtonText: {
    marginLeft: 4,
    color: "#F8931F",
    fontSize: 14,
  },
  modalWrapper: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 30,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  modalScroll: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 5,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  addressInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressInput: {
    flex: 1,
    marginRight: 10,
  },
  locationButton: {
    padding: 10,
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  saveButton: {
    backgroundColor: "#F8931F",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
