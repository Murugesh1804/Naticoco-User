import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import Animated, {
 runOnJS,
 useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import axios from 'axios';

import { scale, verticalScale, moderateScale } from "../../utils/responsive";
import BackButton from '../../components/BackButton';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_KEY = 'AIzaSyD9YLhonLv3JjCCVjBv06W1el67IXr19bY';
const UPDATE_INTERVAL = 5000; // 5 seconds

const TrackScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const mapRef = useRef(null);
  const translateY = useSharedValue(0);

  useEffect(() => {
   const generateOTP = async () => {
    try {
     const response = await axios.post("https://api.naticoco.com/api/user/postUserOTP", {
     orderId : orderId
    });
    if (response.status == 200) {
     console.log(response.data);
     setOtp(response.data.otp);
    }
    }catch (e) {
     console.error("Error generating OTP",e);
    } 
   }

   if (otp == null) {
    generateOTP();
   }

  },[otp]);
  
  // State management
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState({
    user: null,
    store: null,
    driver: null
  });
  const [otp, setOtp] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCancel = async () => {
   Alert.alert("Cancel Order", "Are you sure you want to cancel the order?", [
     { text: "No", style: "cancel" },
     {
       text: "Yes",
       onPress: async () => {
         try {
           if (order.status == "PENDING" || order.status == "PREPARING") {
            await axios.post(
              `https://api.naticoco.com/citystore/updateorder`, {
               orderId: orderId,
               status : "REJECTED"
              }
            );
            navigation.navigate("MainTabs");
          }else {
           Alert.alert(`Order is ${order.status}`, "You can't cancel this order");
          }
         } catch (error) {
           Alert.alert("Error", "Could not cancel order");
         }
       },
       style: "destructive",
     },
   ]);
 };


  // Fetch order details and location updates
  const fetchOrderData = async () => {
    try {
      const response = await axios.post(
        `https://api.naticoco.com/user/getorderId`,
        { orderId }
      );

      if (!response.data || !response.data.order) {
        throw new Error('Invalid order data received');
      }

      const orderData = response.data.order;

      // Update locations
      setLocations(prev => ({
        ...prev,
        store: orderData.storeLocation ? {
          latitude: orderData.storeLocation.latitude,
          longitude: orderData.storeLocation.longitude,
        } : null,
        user: orderData.deliveryLocation ? {
          latitude: orderData.deliveryLocation.latitude,
          longitude: orderData.deliveryLocation.longitude,
        } : null
      }));

      // Set OTP if order is ready
      if (orderData.status === 'READY' && orderData.otp) {
        setOtp(orderData.otp);
      }

      setOrder(orderData);
      setLoading(false);

      // If order is out for delivery, fetch driver location
      if (orderData.status === 'OUT_FOR_DELIVERY') {
        fetchDriverLocation(orderId);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Failed to fetch order details');
      setLoading(false);
    }
  };

  const fetchDriverLocation = async (orderId) => {
    try {
      const cleanOrderId = orderId.replace('ORD#', '');
      const response = await axios.get(
        `https://api.naticoco.com/Adminstore/delivery/location/${cleanOrderId}`
      );
      // console.log(response.data);
      if (response.status === 200 && response.data) {
        setLocations(prev => ({
          ...prev,
          driver: {
            latitude:  response.data.latitude || 13.04411943278981, //,xa
            longitude: response.data.longitude || 80.23868788554641 // 
          }
        }));
      }
    } catch (err) {
      // console.error('Error fetching driver location:', err);
      setLocations(prev => ({
       ...prev,
       driver: {
         latitude:  13.04411943278981, //response.data.latitude,
         longitude: 80.23868788554641 // response.data.longitude
       }
     }));
    }
  };

  // Set up polling interval
  useEffect(() => {
    fetchOrderData();
    const interval = setInterval(fetchOrderData, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [orderId]);

  // Map region calculation
  const getMapRegion = () => {
    const points = Object.values(locations).filter(location => location !== null);
    
    if (points.length === 0) return null;

    const latitudes = points.map(p => p.latitude);
    const longitudes = points.map(p => p.longitude);

    return {
      latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
      latitudeDelta: Math.max(0.04, Math.max(...latitudes) - Math.min(...latitudes) + 0.02),
      longitudeDelta: Math.max(0.04, Math.max(...longitudes) - Math.min(...longitudes) + 0.02)
    };
  };

  // Animated bottom sheet handlers
  const gestureHandler = useAnimatedGestureHandler({
   onStart: (event, ctx) => {
     ctx.startY = translateY.value;
   },
   onActive: (event, ctx) => {
     const newValue = ctx.startY + event.translationY;
     translateY.value = Math.min(0, Math.max(newValue, -300));
   },
   onEnd: (event) => {
     if (event.velocityY < -500 || translateY.value < -150) {
       translateY.value = withSpring(-300);
       runOnJS(setIsExpanded)(true);
     } else {
       translateY.value = withSpring(0);
       runOnJS(setIsExpanded)(false);
     }
   },
 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  // Render OTP Banner
  const renderOtpBanner = async () => {
    // if (!otp || order?.status === 'COMPLETED') return null;

    return (
      <View style={styles.otpBanner}>
        <Text style={styles.otpTitle}>OTP</Text>
        <Text style={styles.otpValue}>{otp}</Text>
        <Text style={styles.otpDescription}>Show this OTP to the delivery person</Text>
      </View>
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#F8931F" />
      </View>
    );
  }

  // console.log(order);





  return (
    <GestureHandlerRootView style={styles.container}>

      <BackButton style={{margin : 20}} />
      {order.status == 'OUT_FOR_DELIVERY' ? renderOtpBanner() : <></>}


      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={getMapRegion()}
      >

          <Marker coordinate={locations.driver || {
           latitude: 37.7882,
           longitude: -122.4324
          }} title="Driver Location">
            <View style={[styles.marker, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="bicycle" size={24} color="white" />
            </View>
          </Marker>
        {/* User Location Marker */}
        {locations.user && (
          <Marker coordinate={locations.user || {
           latitude: 37.7882,
           longitude: -122.4324
          }} title="Delivery Location">
            <View style={[styles.marker, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="location" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Store Location Marker */}
        {locations.store && (
          <Marker coordinate={locations.store || {
           latitude: 37.7882,
           longitude: -122.4324
          }} title="Store Location">
            <View style={[styles.marker, { backgroundColor: '#F8931F' }]}>
              <Ionicons name="business" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Driver Location Marker */}
        {locations.driver && order.status === 'OUT_FOR_DELIVERY' && (
          <Marker coordinate={locations.driver || {
           latitude: 37.7882,
           longitude: -122.4324
          } } title="Driver Location">
            <View style={[styles.marker, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="bicycle" size={24} color="white" />
            </View>
          </Marker>
        )}

        {locations.driver && locations.user && order.status === 'READY' && (
          <MapViewDirections
            origin={locations.driver || {
             latitude: 37.7882,
             longitude: -122.4324
            }}
            destination={locations.store || {
             latitude: 37.7882,
             longitude: -122.4324
            }}
            apikey={GOOGLE_MAPS_KEY}
            strokeWidth={3}
            strokeColor="#F8931F"
            optimizeWaypoints={true}

          />
        )}

        {/* Route Directions */}
        
        {locations.driver && locations.user && order.status === 'OUT_FOR_DELIVERY' && (
          <MapViewDirections
            origin={locations.driver || {
             latitude: 37.7882,
             longitude: -122.4324
            }}
            destination={locations.user || {
             latitude: 37.7882,
             longitude: -122.4324
            }}
            
            apikey={GOOGLE_MAPS_KEY}
            strokeWidth={3}
            strokeColor="#F8931F"
            optimizeWaypoints={true}
          />
        )}
      </MapView>

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.deliveryCard, animatedStyle]}>
          <View style={styles.pullBar} />

          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {order.status}
            </Text>
            <Text style={styles.timeText}>
              Estimated Delivery: {'5 Mins'}
            </Text>
          </View>

          {order.status != "OUT_FOR_DELIVERY" && order.deliveryPersonId ? (
            <View style={styles.driverInfo}>
              <View style={styles.driverDetails}>
                <Ionicons
                  name="person-circle-outline"
                  size={40}
                  color="#666"
                />
                <View style={styles.driverTextContainer}>
                  <Text style={styles.driverName}>
                    {order.deliveryPersonName}
                  </Text>
                  <Text style={styles.driverRole}>Delivery Partner</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleCall} style={styles.callButton}>
                <Ionicons name="call" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.driverInfo}>
              <Text style={styles.statusText}>
                {order.status === "PREPARING"
                  ? "Order is being prepared..."
                  : "Waiting for delivery partner..."}
              </Text>
            </View>
          )}

          {/* <View style={styles.timeline}>{renderOrderTimeline()}</View> */}

          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.sectionTitle}>Order Details</Text>
              <View style={styles.orderDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>#{order.orderId}</Text>
                </View>
                <View style={styles.cart}>
                  <Text style={styles.detailLabel}>Items</Text>
                  <FlatList
                    data={order.items}
                    keyExtractor={(item) => item.itemId}
                    renderItem={({ item }) => (
                      <Text style={styles.detailValueItem}>
                        {item.itemName} x {item.quantity}
                      </Text>
                    )}
                  />
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Amount</Text>
                  <Text style={styles.detailValue}>₹{order.amount}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancel} onPress={handleCancel}>
                  <Text style={styles.buttonText}>Cancel Order</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Help for Order</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    
  },
  otpBanner: {
    position: 'absolute',
    top: 40,
    // left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    zIndex: 100,
    alignItems: 'center',
    elevation: 5,
    width : SCREEN_WIDTH / 2,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8931F',
  },
  otpValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  otpDescription: {
    fontSize: 12,
    color: '#666',
  },
  marker: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 45,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  orderStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deliveryTime: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 20,
  },
  driverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverPhone: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    backgroundColor: '#89C73A',
    padding: 12,
    borderRadius: 25,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F8931F",
  },
  timeText: {
    fontSize: 16,
    color: "#666",
    marginTop: 4
  },
  deliveryCard: {
   position: "absolute",
   bottom: 0,
   width: "100%",
   backgroundColor: "white",
   borderTopLeftRadius: scale(20),
   borderTopRightRadius: scale(20),
   padding: scale(0),
   paddingTop: scale(10),
   shadowColor: "#000",
   shadowOffset: {
     width: 0,
     height: -2,
   },
   shadowOpacity: 0.1,
   shadowRadius: 4,
   elevation: 5,
   height : 200
 },
 statusContainer: {
  marginBottom: verticalScale(20),
  paddingHorizontal : 20,
},
marker: {
  backgroundColor: "#F8931F",
  padding: 6,
  borderRadius: 20,
},
statusText: {
  fontSize: moderateScale(20),
  fontWeight: "bold",
  color: "#F8931F",
  // paddingHorizontal : 10,
},
timeText: {
  fontSize: moderateScale(16),
  color: "#666",
  marginTop: verticalScale(4),
},
driverInfo: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: verticalScale(20),
  paddingHorizontal : 20,
},
driverDetails: {
  flexDirection: "row",
  alignItems: "center",
},
driverTextContainer: {
  marginLeft: scale(12),
},
driverName: {
  fontSize: moderateScale(18),
  fontWeight: "600",
},
driverRole: {
  fontSize: moderateScale(14),
  color: "#666",
},
callButton: {
  backgroundColor: "#89C73A",
  padding: scale(12),
  borderRadius: scale(25),
},
timeline: {
  borderTopWidth: scale(1),
  borderTopColor: "#eee",
  paddingTop: verticalScale(20),
},
timelineItem: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: verticalScale(12),
 
},
timelineText: {
  marginLeft: scale(12),
  fontSize: moderateScale(16),
  color: "#333",
},
pullBar: {
  width: scale(40),
  height: verticalScale(4),
  backgroundColor: "#DDD",
  borderRadius: scale(2),
  alignSelf: "center",
  marginBottom: verticalScale(20),
},
expandedContent: {
  marginTop: verticalScale(10),
  borderTopWidth: scale(1),
  borderBottomWidth: scale(1),
  borderTopColor: "#eee",
  borderBottomColor: "#eee",
  paddingTop: verticalScale(20),
  paddingBottom: verticalScale(10),
  backgroundColor : 'white',
  paddingHorizontal : 20
},
sectionTitle: {
  fontSize: moderateScale(18),
  fontWeight: "600",
  marginBottom: verticalScale(15),
},
orderDetails: {
  gap: scale(12),
},
detailItem: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},
cart: {
  justifyContent: "space-between",
  alignItems: "start",
  flexWrap: "wrap",
  gap: scale(10),
},
retryButtonText: {
  backgroundColor: "red",
  padding: 10,
  borderRadius: 10,
  margin: 10,
  color: "white",
},
cancel: {
  backgroundColor: "#de0303",
  padding: scale(15),
  borderRadius: scale(10),
  alignItems: "center",
  justifyContent: "center",
  width: "40%",
},
errorContainer: {
  top: SCREEN_HEIGHT / 2.5,
  alignItems: "center",
  justifyContent: "center",
},
detailLabel: {
  fontSize: moderateScale(14),
  color: "#666",
},
detailValue: {
  fontSize: moderateScale(14),
  fontWeight: "600",
},
detailValueItem: {
  fontSize: moderateScale(14),
  fontWeight: "600",
  padding: scale(5),
  borderRadius: scale(5),
},
actionButtons: {
 flexDirection: "row",
 justifyContent: "space-evenly",
 alignItems: "center",
 marginTop: 20,
},
container: {
 flex: 1,
 backgroundColor: "white",
},
button: {
 backgroundColor: "#89C73A",
 padding: scale(15),
 borderRadius: scale(10),
 width: "40%",
},
buttonText: {
 color: "white",
 fontWeight: "600",
 fontSize: moderateScale(16),
},
map: {
 width: SCREEN_WIDTH,
 height: SCREEN_HEIGHT * 0.8,
},
driverMarker: {
 backgroundColor: "#F8931F",
 padding: scale(8),
 borderRadius: scale(20),
 borderWidth: scale(2),
 borderColor: "white",
},
});


const getETAFromGoogle = async (loc1,loc2) => {
 const lat1 = loc1.latitude;
 const lon1 = loc1.longitude;
 const lat2 = loc2.latitude;
 const lon2 = loc2.longitude;

 const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lon1}&destination=${lat2},${lon2}&key=${GOOGLE_MAPS_KEY}`;

 try {
   const response = await axios.get(url);
   const duration = response.data.routes[0].legs[0].duration.text;
   return duration;
 } catch (error) {
   console.error("Error fetching ETA:", error);
   return "Unavailable";
 }
};

export default TrackScreen;