import { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LocationScreen({ navigation, route }) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    type: "",
    address: "",
    latitude: null,
    longitude: null,
    landmark: "",
  });
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Allow location access to continue");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      getAddressFromCoords(location.coords.latitude, location.coords.longitude);
      setLoading(false);
    } catch (error) {
      Alert.alert("Error", "Could not fetch location");
      setLoading(false);
    }
  };

  const getAddressFromCoords = async (latitude, longitude) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (response[0]) {
        const addr = response[0];
        setAddress(addr);
        const street = addr.street || "";
        const name = addr.name || "";
        const fullAddress = (street + " " + name).trim();

        setAddressDetails({
          ...addressDetails,
          address: fullAddress,
          latitude: latitude,
          longitude: longitude,
        });
      }
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({
      ...location,
      latitude,
      longitude,
    });
    getAddressFromCoords(latitude, longitude);
  };

  const saveAddress = async () => {
    if (
      !addressDetails.type ||
      !addressDetails.address ||
      !location.latitude ||
      !location.longitude
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    console.log(addressDetails);
    await AsyncStorage.setItem("liveLocation", JSON.stringify(addressDetails));
    try {
      const credentials = await AsyncStorage.getItem("logincre");
      const parsedCredentials = credentials ? JSON.parse(credentials) : null;
      const userId = parsedCredentials?.token?.userId;

      const addressData = {
        userId,
        type: addressDetails.type,
        address: addressDetails.address,
        latitude: location.latitude,
        longitude: location.longitude,
        landmark: addressDetails.landmark || null,
      };

      // Save the address to the server
      const saveResponse = await axios.post(
        "https://nati-coco-server.onrender.com/location/address",
        addressData
      );

      if (saveResponse.status === 201) {
        // Find the nearest store and fetch its menu
        const nearestStoreResponse = await axios.get(
          "https://nati-coco-server.onrender.com/userapi/nearest",
          {
            params: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          }
        );
        console.log("Response", nearestStoreResponse.status);
        if (nearestStoreResponse.status === 200) {
          const { nearestStoreId, menu, StoreLocations } =
            nearestStoreResponse.data;
          const mockNearestStore = {
            id: nearestStoreId,
            name: StoreLocations?.name || "Nearest Store",
            address: StoreLocations?.address || addressDetails.address,
            coordinates: {
              latitude:
                StoreLocations?.locations?.latitude || location.latitude,
              longitude:
                StoreLocations?.locations?.longitude || location.longitude,
            },
          };

          console.log("Store Location :", mockNearestStore);

          await AsyncStorage.setItem(
            "nearestStore",
            JSON.stringify(mockNearestStore)
          );

          Alert.alert(
            "Success",
            "Address saved and nearest store menu fetched successfully",
            [
              {
                text: "OK",
                onPress: () =>
                  navigation.navigate("StoreType", {
                    screen: "Menu",
                    params: { storeData: mockNearestStore, menu },
                  }),
              },
            ]
          );
        } else {
          Alert.alert("Info", "Address saved, but no nearby stores found.");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Could not save address or fetch nearest store.");
    }
  };

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await Location.geocodeAsync(query);
      if (response.length > 0) {
        const results = await Promise.all(
          response.map(async (loc) => {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            return {
              ...loc,
              address: address[0],
            };
          })
        );
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
    setSearching(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F8931F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={location}
          onPress={handleMapPress}
          onMapReady={() => setMapReady(true)}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Delivery Location"
            description={addressDetails.address}
          >
            <Ionicons name="location" size={40} color="#F8931F" />
          </Marker>
        </MapView>
      )}

      <MotiView
        from={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 300 }}
        style={styles.searchContainer}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#F8931F" />
          </TouchableOpacity>
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search location..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchLocation(text);
              }}
              style={styles.searchInput}
              right={searching ? <TextInput.Icon icon="loading" /> : null}
            />
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.resultItem}
                    onPress={() => {
                      const newLocation = {
                        latitude: result.latitude,
                        longitude: result.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      };
                      setLocation(newLocation);
                      mapRef.current?.animateToRegion(newLocation);
                      getAddressFromCoords(result.latitude, result.longitude);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color="#F8931F"
                    />
                    <Text style={styles.resultText}>
                      {result.address?.street || ""}{" "}
                      {result.address?.name || ""}
                      {"\n"}
                      <Text style={styles.subText}>
                        {result.address?.district ||
                          result.address?.subregion ||
                          ""}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </MotiView>

      <MotiView
        from={{ translateY: 0, opacity: 0 }}
        animate={{ translateY: 100, opacity: 1 }}
        transition={{ type: "spring", delay: 500 }}
        style={styles.bottomSheet}
      >
        {!showSaveForm ? (
          <View>
            <Text style={styles.addressText}>{addressDetails.address}</Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => setShowSaveForm(true)}
            >
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Address Type (e.g., Home, Office)"
              placeholderTextColor="#666"
              value={addressDetails.type}
              onChangeText={(text) =>
                setAddressDetails({ ...addressDetails, type: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Complete Address"
              value={addressDetails.address}
              onChangeText={(text) =>
                setAddressDetails({ ...addressDetails, address: text })
              }
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Landmark"
              value={addressDetails.landmark}
              onChangeText={(text) =>
                setAddressDetails({ ...addressDetails, landmark: text })
              }
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveAddress}>
              <Text style={styles.saveButtonText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  searchContainer: {
    flex: 1,
    position: "relative",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: "white",
    borderRadius: 8,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 3,
    height: 45,
  },
  searchResults: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    elevation: 4,
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  subText: {
    fontSize: 14,
    color: "#666",
  },
  bottomSheet: {
    position: "absolute",
    width: "100%",
    top: -100,
    backgroundColor: "white",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  confirmButton: {
    backgroundColor: "#F8931F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  formContainer: {
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  saveButton: {
    backgroundColor: "#F8931F",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
