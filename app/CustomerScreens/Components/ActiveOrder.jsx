import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../Screens/Home/constants";

const ActiveOrder = () => {
   const navigation = useNavigation();
   const [orders, setOrders] = useState([]);
   const [activeOrder, setActiveOrder] = useState(null);

   useEffect(() => {
      const fetchOrders = async () => {
        try {
          const credentials = await AsyncStorage.getItem("logincre");
          const parsedCredentials = credentials ? JSON.parse(credentials) : null;
          const userId = parsedCredentials?.token?.userId;
          
          const response = await axios.get(`http://147.93.110.87:3500/api/orders/myorders/${userId}`);
          setOrders(response.data.orders);
          
          const active = response.data.orders.find(order => 
            ["PENDING", "PREPARING", "READY", "ACCEPTED", "OUT_FOR_DELIVERY"].includes(order.status)
          );
          setActiveOrder(active);
          // console.log("Active : ",activeOrder.orderId);
        } catch (error) {
          console.error("Error fetching orders:", error);
        }
      };
  
      fetchOrders();
    }, []);
  
  if (!activeOrder) {
   return <></>
  }

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={() => navigation.navigate("Track", {orderId : activeOrder.orderId})}
    >
      <Ionicons name="location-outline" size={24} color="white" />
      <Text style={styles.floatingButtonText}>Track Order {activeOrder.orderId}</Text>
    </TouchableOpacity>
  );
};

// export default function MyOrders() {
//   const navigation = useNavigation();
//   const [orders, setOrders] = useState([]);
//   const [activeOrder, setActiveOrder] = useState(null);

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         const credentials = await AsyncStorage.getItem("logincre");
//         const parsedCredentials = credentials ? JSON.parse(credentials) : null;
//         const userId = parsedCredentials?.token?.userId;
        
//         const response = await axios.get(`http://147.93.110.87:3500/api/orders/myorders/${userId}`);
//         setOrders(response.data.orders);
        
//         const active = response.data.orders.find(order => 
//           ["PENDING", "PREPARING", "READY", "ACCEPTED", "OUT_FOR_DELIVERY"].includes(order.status)
//         );
//         setActiveOrder(active);
//       } catch (error) {
//         console.error("Error fetching orders:", error);
//       }
//     };

//     fetchOrders();
//   }, []);

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>My Orders</Text>
//         <View style={{ width: 24 }} />
//       </View>
//       <ScreenBackground style={{ marginBottom: SCREEN_HEIGHT / 4.5 }}>
//         <FlatList
//           data={orders}
//           renderItem={({ item }) => <OrderCard key={item._id} order={item} />}
//           keyExtractor={(item) => item._id}
//           contentContainerStyle={styles.ordersList}
//           showsVerticalScrollIndicator={false}
//         />
//       </ScreenBackground>
//       <ActiveOrderButton activeOrder={activeOrder} />
//     </SafeAreaView>
//   );
// }
// 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    justifyContent : 'center',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: Platform.OS === "ios" ? -40 : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F8931F",
  },
  floatingButton: {
    zIndex : 2,
    position: "absolute",
    bottom: SCREEN_HEIGHT / 6,
    right: 20,
    flexDirection: "row",
    backgroundColor: "#F8931F",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent : 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  ordersList: {
    padding: 16,
  },
});

export default ActiveOrder;