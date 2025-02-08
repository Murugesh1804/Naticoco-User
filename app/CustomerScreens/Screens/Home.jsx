import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  ScrollView,
  Dimensions,
  Text,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { useCart } from "../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { Asset } from "expo-asset";
import LoadingScreen from "../Components/LoadingScreen";
import { useLoadAssets } from "../../hooks/useLoadAssets";
import ScreenBackground from "../Components/ScreenBackground";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Import components
import AnimatedHeader from "./Home/components/AnimatedHeader";
import CategoryButton from "./Home/components/CategoryButton";
import ProductCard from "./Home/components/ProductCard";

// Import constants and styles
import { categories, productImages } from "./Home/constants";
import styles from "./Home/styles";
import FloatingCartHandler from "../Components/CartHandler";
import ActiveOrder from "../Components/ActiveOrder";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("Loading...");
  const [errorMsg, setErrorMsg] = useState(null);
  const {
    addToCart,
    cartItems,
    cartCount,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();
  const [layout, setLayout] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  const { user } = useAuth();
  const isLoading = useLoadAssets(productImages);
  const [menuItems, setMenuItems] = useState([]);
  // const [nearestStoreId, setNearestStoreId] = useState(null);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch menu items from the nearest store
  const fetchNearestStoreMenu = async (latitude, longitude) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const loginData = await AsyncStorage.getItem("logincre");
      const parsedLoginData = loginData ? JSON.parse(loginData) : null;
      const authToken = parsedLoginData?.token?.token || token;

      const response = await axios.get(
        "http://147.93.110.87:3500/api/user/nearest",
        {
          params: { latitude, longitude },
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      await AsyncStorage.setItem("storeId", response.data.nearestStoreId);

      await AsyncStorage.setItem("fullMenu",JSON.stringify(response.data.menu));

      if (response.data && response.data.menu) {
        const menu = response.data.menu.filter(
          (item) => item.category !== "Fried"
        );
        setMenuItems(menu);
        setBestSellers(menu.filter((item) => item.BestSeller === true));
        setNewArrivals(menu.filter((item) => item.newArrival === true));
        setIsDataLoading(false);

        // Cache the store data
        await AsyncStorage.setItem("storeMenu", JSON.stringify(menu));
      }
    } catch (error) {
      console.error(
        "Error fetching store data:",
        error.response?.data || error.message
      );
      Alert.alert("No Stores Found Nearby", "Do you want to change address ?", [
        {
          text: "Cancel",
          onPress: () => navigation.navigate("StoreType"),
          style: "cancel",
        },
        { text: "OK", onPress: () => navigation.navigate("Location") },
      ]);
    }
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const cachedLocation = await AsyncStorage.getItem("userLocation");
      if (cachedLocation) {
        const { latitude, longitude } = JSON.parse(cachedLocation);
        await fetchNearestStoreMenu(latitude, longitude);
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initialize location and fetch store data
  useEffect(() => {
    const initializeData = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          setAddress("Location access denied");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        // Save location to AsyncStorage
        await AsyncStorage.setItem(
          "userLocation",
          JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          })
        );

        // Get address from coordinates
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (addressResponse[0]) {
          const addressObj = addressResponse[0];
          const formattedAddress = addressObj.district || "";
          setAddress(formattedAddress);
        }

        // Fetch store data using location
        await fetchNearestStoreMenu(
          location.coords.latitude,
          location.coords.longitude
        );
      } catch (error) {
        console.error("Error initializing data:", error);
        setErrorMsg("Error getting location");
        setAddress("Location unavailable");
      } finally {
        setIsDataLoading(false);
      }
    };

    initializeData();
  }, []);

  const getNumColumns = () => (layout.width > 600 ? 4 : 3);

  const renderCategoryButton = ({ item }) => (
    <CategoryButton
      name={item.name}
      image={item.image}
      navigation={navigation}
      items={menuItems.filter((i) => i.category === item.name)}
    />
  );

  const renderProductCard = ({ item }) => {
    const cardWidth =
      layout.width > 600 ? layout.width * 0.4 : layout.width * 0.55;
    const cartItem = cartItems.find(
      (i) => i._id === item._id || i.id === item._id || item.id
    );

    return (
      <ProductCard
        item={item}
        onPress={() => navigation.navigate("ItemDisplay", { item })}
        cartItem={cartItem}
        addToCart={addToCart}
        inc={increaseQuantity}
        dec={decreaseQuantity}
        getItemImage={(item) => ({ uri: item.image })}
        cardWidth={cardWidth}
      />
    );
  };

  if (isLoading || isDataLoading) {
    return <LoadingScreen />;
  }


  return (
    <ScreenBackground>
      <SafeAreaView style={styles.container} edges={["right", "left"]}>
        <ActiveOrder />
        <AnimatedHeader
          address={address}
          cartCount={cartCount}
          navigation={navigation}
          userName={user?.name?.split(" ")[0] || "Guest"}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>SHOP BY CATEGORY</Text>
            <FlatList
              data={categories}
              renderItem={renderCategoryButton}
              keyExtractor={(item) => item._id || item.id}
              numColumns={getNumColumns()}
              scrollEnabled={false}
              contentContainerStyle={styles.categoryList}
            />
          </View>

          {bestSellers.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>BEST SELLERS</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={bestSellers}
                renderItem={renderProductCard}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )}

          {newArrivals.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>NEW ARRIVALS</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={newArrivals}
                renderItem={renderProductCard}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <FloatingCartHandler navigation={navigation} bottom={true} />
    </ScreenBackground>
  );
}
