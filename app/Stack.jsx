import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./Tab";
import LoginScreen from "./Login";
import ForgetPass from "./ForgetPass";
import SignUpScreen from "./CustomerScreens/Screens/SignUp";
import { SafeAreaView } from "react-native";
import CartScreen from "./CustomerScreens/Screens/Cart";
import CheckoutScreen from "./CustomerScreens/Screens/Checkout";
import SuccessSplash from "./CustomerScreens/Components/SuccessSplash";
import TrackScreen from "./CustomerScreens/Screens/Track";
import ItemDisplay from "./CustomerScreens/Components/ItemDisplay";
import MyOrders from "./CustomerScreens/Screens/MyOrders";
import Profile from "./CustomerScreens/Screens/Profile";
import MyAddresses from "./CustomerScreens/Screens/MyAddresses";
import FilteredItems from "./CustomerScreens/Components/FilteredItems";
import Welcome from "./CustomerScreens/Screens/Welcome";
import Location from "./CustomerScreens/Screens/Location";
import StoreType from "./CustomerScreens/Screens/StoreType";
import CrispyHome from "./CustomerScreens/Screens/CrispyHome";
import { Dimensions } from "react-native";
import { useGlobalAssets } from "./hooks/useGlobalAssets";
import LoadingScreen from "./CustomerScreens/Components/LoadingScreen";
import ScreenBackground from "./CustomerScreens/Components/ScreenBackground";
import StoreStack from "./StoreScreens/StoreStack";
import Postorder from "./CustomerScreens/Screens/Postorder";
import CustomerSupportScreen from "./CustomerScreens/Screens/CustomerSupport";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

//Admin Screens
import ManageStore from "./AdminScreens/ManageStore";
import AdminHome from "./AdminScreens/AdminHome";
import UserManagement from "./AdminScreens/ManageUser";
import OrderAnalytics from "./AdminScreens/OrderAnalytics";
import DeliveryPartner from "./AdminScreens/DeliveryPartner";
import AddStore from "./AdminScreens/AddStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";


const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const isLoadingGlobal = useGlobalAssets();
  const [login, setLogin] = useState(false);

  if (isLoadingGlobal) {
    return <LoadingScreen />;
  }

  const loggedIn = async () => {
    const user = await AsyncStorage.getItem("logincre");
    console.log("Details irukka : ", user);
    if (user == null || user == "false") {
      setLogin(false);
    } else {
      setLogin(true);
    }
  };
  loggedIn();

  return (
    <ScreenBackground>
      <Stack.Navigator
        initialRouteName={login ? "Welcome" : "Login"}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "transparent",
            flex: 1,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
            padding: 0,
            margin: 0,
          },
          animation: "default",
          safeAreaInsets: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Success"
          component={SuccessSplash}
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name="Track"
          component={TrackScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ItemDisplay"
          component={ItemDisplay}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyOrders"
          component={MyOrders}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyAddresses"
          component={MyAddresses}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FilteredItems"
          component={FilteredItems}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminHome"
          component={AdminHome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ManageStore"
          component={ManageStore}
          options={{
            title: "Manage Stores",
          }}
        />
        <Stack.Screen
          name="UserManagement"
          component={UserManagement}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OrderAnalytics"
          component={OrderAnalytics}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DeliveryPartners"
          component={DeliveryPartner}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddStore"
          component={AddStore}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Location"
          component={Location}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StoreType"
          component={StoreType}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CrispyHome"
          component={CrispyHome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StoreStack"
          component={StoreStack}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen
          name="postOrder"
          component={Postorder}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Support"
          component={CustomerSupportScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ForgetPassword"
          component={ForgetPass}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </ScreenBackground>
  );
}
