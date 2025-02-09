import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Text, Card, Badge, Button, Dialog, Portal } from "react-native-paper";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { scale, verticalScale, moderateScale } from "../../utils/responsive";
import axios from "axios";

// Helper function to get status color
const getStatusColor = (status) => {
  const normalizedStatus = status.toUpperCase();
  switch (normalizedStatus) {
    case "PENDING":
      return "#F8931F";
    case "PREPARING":
      return "#2196F3";
    case "READY":
      return "#FF9800";
    case "COMPLETED":
      return "#4CAF50";
    case "REJECTED":
      return "#F44336";
    default:
      return "#666";
  }
};

const OrderCard = ({
  order,
  onAccept,
  onReject,
  onPreparationComplete,
  onVerifyAndComplete,
}) => {
  const [otpDialogVisible, setOtpDialogVisible] = useState(false);
  const [otp, setOtp] = useState("");

  const handleVerification = () => {
    onVerifyAndComplete(order.orderId, otp);
    setOtpDialogVisible(false);
    setOtp("");
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: -50 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "spring", duration: 1000 }}
    >
      <Card style={styles.orderCard}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>{order.orderId}</Text>
              <Text style={styles.orderTime}>
                {new Date(order.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            <Badge
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) },
              ]}
            >
              {order.status}
            </Badge>
          </View>

          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.itemName}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            ))}
          </View>

          <View style={styles.orderFooter}>
            <Text style={styles.totalAmount}>Total: ₹{order.amount}</Text>
            <View style={styles.actionButtons}>
              {order.status.toUpperCase() === "PENDING" && (
                <>
                  <Button
                    mode="contained"
                    onPress={() => onAccept(order._id)}
                    style={[styles.actionButton, styles.acceptButton]}
                  >
                    Accept & Prepare
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => onReject(order._id)}
                    style={[styles.actionButton, styles.rejectButton]}
                  >
                    Reject
                  </Button>
                </>
              )}
              {order.status.toUpperCase() === "PREPARING" && (
                <Button
                  mode="contained"
                  onPress={() => onPreparationComplete(order._id)}
                  style={[styles.actionButton, styles.completeButton]}
                >
                  Mark as Ready
                </Button>
              )}
              {order.status.toUpperCase() === "READY" && (
                <Button
                  mode="contained"
                  onPress={() => setOtpDialogVisible(true)}
                  style={[styles.actionButton, styles.verifyButton]}
                >
                  Verify & Complete
                </Button>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      <Portal>
        <Dialog
          visible={otpDialogVisible}
          onDismiss={() => setOtpDialogVisible(false)}
        >
          <Dialog.Title>Enter Delivery OTP</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              keyboardType="numeric"
              maxLength={6}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOtpDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleVerification}>Verify</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </MotiView>
  );
};

export default function OrderManagement({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const vendorCredentialsString = await AsyncStorage.getItem(
        "vendorCredentials"
      );
      if (!vendorCredentialsString) {
        console.error("No vendor credentials found");
        return;
      }

      const vendorCredentials = JSON.parse(vendorCredentialsString);
      const storeId = vendorCredentials?.vendorData?.storeId;

      if (!storeId) {
        console.error("No storeId found in vendor credentials");
        return;
      }

      const response = await axios.get(
        `http://147.93.110.87:3500/citystore/orders/${storeId}`
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = async (orderId) => {
    console.log("Accepting order:", orderId);
    try {
      await axios.post(
        "http://147.93.110.87:3500/citystore/updateorder",
        {
          orderId: orderId,
          status: "PREPARING",
        }
      );

      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "PREPARING" } : order
        )
      );
    } catch (error) {
      console.error("Error accepting order:", error);
      Alert.alert("Error", "Failed to accept order");
    }
  };

  const handleRejectOrder = async (orderId) => {
    try {
      await axios.post(
        "http://147.93.110.87:3500/citystore/updateorder",
        {
          orderId: orderId,
          status: "REJECTED",
        }
      );

      setOrders(
        orders.map((order) =>
          order._id === orderId ? { ...order, status: "REJECTED" } : order
        )
      );
    } catch (error) {
      console.error("Error rejecting order:", error);
      Alert.alert("Error", "Failed to reject order");
    }
  };

  const handlePreparationComplete = async (orderId) => {
    try {
      // Retrieve vendor credentials from AsyncStorage
      const vendorCredentialsString = await AsyncStorage.getItem(
        "vendorCredentials"
      );

      // Check if vendor credentials exist
      if (!vendorCredentialsString) {
        console.error("No vendor credentials found");
        Alert.alert("Error", "Vendor credentials are missing");
        return;
      }

      const vendorCredentials = JSON.parse(vendorCredentialsString);
      console.log("Vendor credentials:", vendorCredentials);

      // Extract store ID
      const storeId = vendorCredentials?.vendorData?.storeId;
      if (!storeId) {
        console.error("Store ID is missing");
        Alert.alert("Error", "Store ID not found");
        return;
      }

      // Make API call to mark the order as ready and assign a delivery person
      const response = await axios.post(
        "http://147.93.110.87:3500/api/orders/markreadyAndAssign",
        {
          orderId,
          storeId,
        }
      );

      if (
        response.data.message ===
        "Order marked as ready and delivery person assigned"
      ) {
        // Update the order's status in local state
        setOrders((orders) =>
          orders.map((order) =>
            order._id === orderId ? { ...order, status: "READY" } : order
          )
        );

        Alert.alert("Success", `Order marked as ready.`);
      } else {
        console.error("API returned an error:", response.data.message);
        Alert.alert(
          "Error",
          response.data.message || "An unexpected error occurred"
        );
      }
    } catch (error) {
      console.error("Error marking order as ready:", error);

      // Handle different types of errors
      if (error.response) {
        const { status, data } = error.response;
        Alert.alert(
          "Error",
          `Failed to mark order as ready. Status: ${status}, Message: ${
            data.message || "Unknown error"
          }`
        );
      } else if (error.request) {
        // Handle no response from the server
        console.error("No response received:", error.request);
        Alert.alert(
          "Error",
          "Failed to connect to the server. Please check your network connection."
        );
      } else {
        // Handle unexpected errors
        Alert.alert("Error", error.message || "An unexpected error occurred");
      }
    }
  };

  const handleVerifyAndComplete = async (orderId, otp) => {
    try {
      const response = await axios.post(
        "http://147.93.110.87:3500/api/orders/verifyandcomplete",
        {
          orderId: orderId,
          otp: otp,
        }
      );

      if (response.data.success) {
        setOrders(
          orders.map((order) =>
            order._id === orderId ? { ...order, status: "COMPLETED" } : order
          )
        );
        Alert.alert("Success", "Order completed successfully");
      } else {
        Alert.alert("Error", "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying and completing order:", error);
      Alert.alert("Error", "Failed to verify and complete order");
    }
  };

  // Normalize status for comparison
  const normalizeStatus = (status) => status.toUpperCase();

  const filteredOrders = orders.filter(
    (order) =>
      activeTab === "ALL" || normalizeStatus(order.status) === activeTab
  );

  // Status tabs with consistent casing
  const statusTabs = [
    "PENDING",
    "PREPARING",
    "READY",
    "COMPLETED",
    "REJECTED",
    "ALL",
  ];

  // Helper function to display status in proper case
  const displayStatus = (status) => {
    return status === "ALL"
      ? "All"
      : status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Management</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { maxHeight: 80 }]}
      >
        {statusTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {displayStatus(tab)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.ordersList}>
        {loading ? (
          <Text style={styles.messageText}>Loading orders...</Text>
        ) : filteredOrders.length === 0 ? (
          <Text style={styles.messageText}>No orders found</Text>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={{
                ...order,
                status: displayStatus(order.status),
              }}
              onAccept={() => handleAcceptOrder(order.orderId)}
              onReject={() => handleRejectOrder(order.orderId)}
              onPreparationComplete={() =>
                handlePreparationComplete(order.orderId)
              }
              onVerifyAndComplete={(orderId, otp) =>
                handleVerifyAndComplete(orderId, otp)
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(20),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#333",
  },
  tabsContainer: {
    paddingHorizontal: scale(20),
    marginTop: verticalScale(10),
    // backgroundColor : 'black',
    height: 0,
  },
  otpInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  verifyButton: {
    backgroundColor: "#FF9800",
  },
  tab: {
    paddingHorizontal: scale(20),
    marginRight: scale(10),
    borderRadius: scale(20),
    height: verticalScale(80),
    justifyContent: "center",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#0f1c57",
  },
  tabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "white",
  },
  ordersList: {
    flex: 1,
    padding: scale(20),
    marginBottom : 100
  },
  orderCard: {
    marginBottom: verticalScale(15),
    borderRadius: scale(15),
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  orderId: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  orderTime: {
    fontSize: moderateScale(14),
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: scale(10),
  },
  itemsList: {
    marginVertical: verticalScale(10),
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: verticalScale(5),
  },
  itemName: {
    flex: 2,
  },
  itemQuantity: {
    flex: 1,
    textAlign: "center",
  },
  itemPrice: {
    flex: 1,
    textAlign: "right",
  },
  orderFooter: {
    marginTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: verticalScale(10),
  },
  totalAmount: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginBottom: verticalScale(10),
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: scale(10),
  },
  actionButton: {
    borderRadius: scale(8),
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    borderColor: "#F44336",
    borderWidth: 1,
  },
  messageText: {
    alignSelf: "center",
    justifyContent: "center",
    top: 50,
  },
  completeButton: {
    backgroundColor: "#2196F3",
  },
});
