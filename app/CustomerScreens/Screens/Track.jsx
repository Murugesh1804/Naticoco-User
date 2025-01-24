import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Linking, 
  Alert, 
  FlatList,
  ActivityIndicator,
  StyleSheet 
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../../../app/components/BackButton';
import { scale, verticalScale, moderateScale } from '../../utils/responsive';
import axios from 'axios';
import socket from '../../services/socketService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GOOGLE_MAPS_KEY = 'AIzaSyD9YLhonLv3JjCCVjBv06W1el67IXr19bY'; 

const ORDER_STATUSES = {
  PENDING: { color: '#F8931F', icon: 'time-outline', text: 'Order Received' },
  ACCEPTED: { color: '#4CAF50', icon: 'checkmark-circle-outline', text: 'Order Accepted' },
  PREPARING: { color: '#2196F3', icon: 'restaurant-outline', text: 'Preparing' },
  READY: { color: '#9C27B0', icon: 'bag-check-outline', text: 'Ready for Pickup' },
  OUT_FOR_DELIVERY: { color: '#FF9800', icon: 'bicycle-outline', text: 'Out for Delivery' },
  COMPLETED: { color: '#89C73A', icon: 'checkmark-done-circle-outline', text: 'Delivered' },
  CANCELLED: { color: '#F44336', icon: 'close-circle-outline', text: 'Cancelled' }
};

export default function TrackScreen({ route }) {
  const navigation = useNavigation();
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);

  const translateY = useSharedValue(0);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `http://192.168.29.242:3500/user/getorderId`, 
        { orderId }
      );
      
      const orderData = response.data.order;
      
      let deliveryPersonData = null;
      try {
        if (response.data.deliveryPerson) {
          deliveryPersonData = response.data.deliveryPerson;
        }
      } catch (delPersonError) {
        console.log('No delivery person details available');
      }
      
      const updatedOrderData = {
        ...orderData,
        status: orderData.status || 'PENDING',
        deliveryPersonId: deliveryPersonData?.id || null,
        deliveryPersonName: deliveryPersonData?.name || 'Unassigned',
        deliveryPersonPhone: deliveryPersonData?.phone || null,
        estimatedDeliveryTime: orderData.estimatedDeliveryTime || 'Not available'
      };
      
      setOrder(updatedOrderData);
      
      if (!orderData.deliveryLocation || 
          (orderData.deliveryLocation.latitude === 0 && 
           orderData.deliveryLocation.longitude === 0)) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          });
        }
      } else {
        setUserLocation(orderData.deliveryLocation);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Unable to fetch order details');
      setLoading(false);
    }
  }, [orderId]);

  const setupRealTimeTracking = useCallback(() => {
    socket.on(`driver_location_${orderId}`, (location) => {
      setDriverLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    });

    socket.on(`order_status_${orderId}`, (status) => {
      setOrder((prevOrder) => ({
        ...prevOrder,
        status: status,
      }));
    });
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
    setupRealTimeTracking();

    return () => {
      socket.off(`driver_location_${orderId}`);
      socket.off(`order_status_${orderId}`);
    };
  }, [orderId, fetchOrderDetails, setupRealTimeTracking]);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
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
    transform: [{ translateY: translateY.value }],
  }));

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel the order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.patch(`http://192.168.29.242:3500/api/orders/${orderId}/cancel`);
              navigation.navigate('Home');
            } catch (error) {
              Alert.alert('Error', 'Could not cancel order');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleCall = () => {
    if (order?.deliveryPersonPhone) {
      Linking.openURL(`tel:${order.deliveryPersonPhone}`);
    } else {
      Alert.alert('No Contact', 'Delivery person contact not available.');
    }
  };

  const renderOrderTimeline = () => {
    return Object.keys(ORDER_STATUSES).map((status) => {
      const isCurrentStatus = order.status === status;
      const isPreviousStatus = Object.keys(ORDER_STATUSES)
        .slice(0, Object.keys(ORDER_STATUSES).indexOf(order.status))
        .includes(status);
      const { color, icon } = ORDER_STATUSES[status];
      
      return (
        <View key={status} style={styles.timelineItem}>
          <Ionicons 
            name={isCurrentStatus ? icon : (isPreviousStatus ? "checkmark-circle" : icon)} 
            size={scale(24)} 
            color={isCurrentStatus ? color : (isPreviousStatus ? "#89C73A" : "#DDD")} 
          />
          <Text style={[
            styles.timelineText, 
            isCurrentStatus && styles.currentStatusText,
            isPreviousStatus && styles.completedStatusText
          ]}>
            {status.replace('_', ' ')}
          </Text>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F8931F" />
        <Text style={styles.loadingText}>Loading Order Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="sad-outline" size={64} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchOrderDetails} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <BackButton color="white" />
      
      {userLocation && driverLocation && (
        <MapView
          style={[styles.map, isExpanded && { height: '40%' }]}
          initialRegion={{
            latitude: (userLocation.latitude + driverLocation.latitude) / 2,
            longitude: (userLocation.longitude + driverLocation.longitude) / 2,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Marker coordinate={userLocation} title="Delivery Location">
            <View style={styles.driverMarker}>
              <Ionicons name="location" size={scale(24)} color="white" />
            </View>
          </Marker>
          
          {driverLocation && (
            <Marker coordinate={driverLocation} title="Driver Location">
              <View style={styles.driverMarker}>
                <Ionicons name="bicycle" size={scale(24)} color="white" />
              </View>
            </Marker>
          )}

          {driverLocation && (
            <MapViewDirections
              origin={driverLocation}
              destination={userLocation}
              apikey={GOOGLE_MAPS_KEY}
              strokeWidth={5}
              strokeColor="#F8931F"
              optimizeWaypoints={true}
            />
          )}
        </MapView>
      )}

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.deliveryCard, animatedStyle]}>
          <View style={styles.pullBar} />
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{order.status.replace('_', ' ')}</Text>
            <Text style={styles.timeText}>
              Estimated Delivery: {order.estimatedDeliveryTime || 'Not available'}
            </Text>
          </View>

          {order.deliveryPersonId ? (
            <View style={styles.driverInfo}>
              <View style={styles.driverDetails}>
                <Ionicons name="person-circle-outline" size={scale(40)} color="#666" />
                <View style={styles.driverTextContainer}>
                  <Text style={styles.driverName}>{order.deliveryPersonName || 'Unassigned'}</Text>
                  <Text style={styles.driverRole}>Delivery Partner</Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleCall} style={styles.callButton}>
                <Ionicons name="call" size={scale(24)} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.driverInfo}>
              <Text style={styles.statusText}>Waiting for delivery partner...</Text>
            </View>
          )}

          <View style={styles.timeline}>
            {renderOrderTimeline()}
          </View>

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
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: '#89C73A',
    padding: scale(15),
    borderRadius: scale(10),
    width: '40%',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: moderateScale(16),
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  driverMarker: {
    backgroundColor: '#F8931F',
    padding: scale(8),
    borderRadius: scale(20),
    borderWidth: scale(2),
    borderColor: 'white',
  },
  deliveryCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: scale(20),
    borderTopRightRadius: scale(20),
    padding: scale(20),
    paddingTop: scale(10),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%',
  },
  statusContainer: {
    marginBottom: verticalScale(20),
  },
  statusText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#F8931F',
  },
  timeText: {
    fontSize: moderateScale(16),
    color: '#666',
    marginTop: verticalScale(4),
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },
  driverDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverTextContainer: {
    marginLeft: scale(12),
  },
  driverName: {
    fontSize: moderateScale(18),
    fontWeight: '600',
  },
  driverRole: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  callButton: {
    backgroundColor: '#89C73A',
    padding: scale(12),
    borderRadius: scale(25),
  },
  timeline: {
    borderTopWidth: scale(1),
    borderTopColor: '#eee',
    paddingTop: verticalScale(20),
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  timelineText: {
    marginLeft: scale(12),
    fontSize: moderateScale(16),
    color: '#333',
  },
  pullBar: {
    width: scale(40),
    height: verticalScale(4),
    backgroundColor: '#DDD',
    borderRadius: scale(2),
    alignSelf: 'center',
    marginBottom: verticalScale(20),
  },
  expandedContent: {
    marginTop: verticalScale(20),
    borderTopWidth: scale(1),
    borderBottomWidth: scale(1),
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: verticalScale(15),
  },
  orderDetails: {
    gap: scale(12),
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cart: {
    justifyContent: 'space-between',
    alignItems: 'start',
    flexWrap: 'wrap',
    gap: scale(10),
  },
  cancel: {
    backgroundColor: '#de0303',
    padding: scale(15),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
  },
  detailLabel: {
    fontSize: moderateScale(14),
    color: '#666',
  },
  detailValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  detailValueItem: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    padding: scale(5),
    borderRadius: scale(5),
  }
});