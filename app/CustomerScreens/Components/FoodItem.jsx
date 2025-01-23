import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useCart } from "../context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { SCREEN_WIDTH } from "../Screens/Home/constants";
import getImage from "./GetImage";
import { AnimatePresence, MotiView } from "moti";
import * as Haptics from 'expo-haptics';


export default function FoodItem({ item, onPress }) {
  const [image,setImage] = useState(null);
  const { addToCart, cartItems, cartCount, increaseQuantity, decreaseQuantity } = useCart();
  const cartItem = cartItems.find(i => i._id === item._id || i.id === item._id || item.id);
  // console.log(cartItem);
  const handleAddToCart = () => {
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   addToCart(item);
 };

 const handleQuantityChange = (newQuantity) => {
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
   if (newQuantity === 0) {
     updateQuantity(item._id, 0);
   } else {
     updateQuantity(item._id, newQuantity);
   }
 };


 useEffect(() => {
  const fetchImage = async () => {
    const base64Image = await getImage(item.image);
    setImage(base64Image);
    setIsLoading(false);
  };
  fetchImage();
}, [item.image]);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image
        source={{uri:image}}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.itemName}</Text>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>Rs.{item.price}/-</Text>
          <AnimatePresence>
                {cartItem?.quantity ? (
                  <MotiView
                    from={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    style={styles.quantityContainer}
                  >
                    <TouchableOpacity 
                      onPress={() => decreaseQuantity(item._id)}
                      style={styles.quantityButton}
                    >
                      <Ionicons name="remove" size={16} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.quantityText}>{cartItem.quantity}</Text>

                    <TouchableOpacity 
                      onPress={() => increaseQuantity(item._id)}
                      style={styles.quantityButton}
                    >
                      <Ionicons name="add" size={16} color="white" />
                    </TouchableOpacity>
                  </MotiView>
                ) : (
                  <MotiView
                    from={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={handleAddToCart}
                    >
                      <Ionicons name="add" size={24} color="white" />
                      <Text style={styles.addButtonText}>ADD</Text>
                    </TouchableOpacity>
                  </MotiView>
                )}
              </AnimatePresence>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  quantity: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e2e2e",
  },
  quantityContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#F8931F',
   borderRadius: 8,
   padding: 6,
   
 },
 quantityButton: {
   width: 12,
   height: 12,
   justifyContent: 'center',
   alignItems: 'center',
   borderRadius: 16,
 },
 quantityText: {
   color: 'white',
   fontSize: 12,
   fontWeight: '600',
   marginHorizontal: 12,
 },
 addButton: {
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: '#F8931F',
   paddingHorizontal: 5,
   paddingVertical: 3,
   borderRadius: 8,
   gap: 4,
   width: 60,
 },
 addButtonText: {
   color: 'white',
   fontSize: 10,
   fontWeight: '600',
 },
});
