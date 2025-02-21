import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from "react-native";
import { 
  Text, 
  Card, 
  TextInput, 
  Button, 
  RadioButton, 
  Switch
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { scale, verticalScale, moderateScale } from "../../utils/responsive";
import { SCREEN_HEIGHT } from "../../CustomerScreens/Screens/Home/constants";

const categories = [
  { label: 'Chicken', value: 'Chicken' },
  { label: 'Marinated', value: 'Marinated' },
  { label: 'Heat & Eat', value: 'Heat & Eat' },
  { label: 'Eggs', value: 'Eggs' },
  { label: 'Spices', value: 'Spices' },
  { label: 'Mutton', value: 'Mutton' },
];

const subCategoriesMap = {
 Chicken: [
    { label: 'Nati', value: 'Nati' },
    { label: 'Farm', value: 'Farm' },
    { label: 'Teetar', value: 'Teetar' },
  ],
  Eggs : [
    { label: 'Farm', value: 'Farm' },
    { label: 'Nati', value: 'Nati' },
    { label: 'Brown', value: 'Brown' },
    { label: 'Duck', value: 'Duck' },

  ],
};

export default function AddMenu({ navigation }) {
  const [newItem, setNewItem] = useState({
    storeId: "",
    itemName: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    stock: 20,
    image: null,
    availability: true,
    bestSeller: false,
    newArrival: false,
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewItem((prev) => ({ ...prev, image: result.assets[0].uri }));
    }
  };

  const handleAddItem = async () => {
    try {
      const vendorCredentialsString = await AsyncStorage.getItem("vendorCredentials");
      if (!vendorCredentialsString) {
        Alert.alert("Error", "No vendor credentials found");
        return;
      }

      const vendorCredentials = JSON.parse(vendorCredentialsString);
      const storeId = vendorCredentials?.vendorData?.storeId;

      if (!storeId) {
        Alert.alert("Error", "No store ID found");
        return;
      }

      if (!newItem.itemName || !newItem.price || !newItem.category || !newItem.image) {
        Alert.alert("Error", "Please fill all required fields and add an image");
        return;
      }

      const formData = new FormData();
      formData.append("storeId", storeId);
      formData.append("itemName", newItem.itemName);
      formData.append("description", newItem.description);
      formData.append("price", newItem.price);
      formData.append("stock", 20);
      formData.append("category", newItem.category);
      formData.append("subCategory", newItem.subCategory);
      formData.append("availability", newItem.availability);
      formData.append("bestSeller", newItem.bestSeller);
      formData.append("newArrival", newItem.newArrival);

      if (newItem.image) {
        const imageUri = newItem.image;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("image", {
          uri: imageUri,
          name: filename,
          type,
        });
      }

      const response = await axios.post(
        "https://api.naticoco.com/citystore/Addmenu",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 201) {
        Alert.alert("Success", "Item added successfully");
        setNewItem({
          storeId: "",
          itemName: "",
          description: "",
          price: "",
          stock: 0,
          category: "",
          subCategory: "",
          image: null,
          availability: true,
          bestSeller: false,
          newArrival: false,
        });
        navigation.navigate("StockManagement");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to add item");
    }
  };

  useEffect(() => {
    setNewItem(prev => ({ ...prev, subCategory: '' }));
  }, [newItem.category]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.modalTitle}>Add New Item</Text>

      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        {newItem.image ? (
          <Image source={{ uri: newItem.image }} style={styles.previewImage} />
        ) : (
          <Ionicons name="camera" size={40} color="#666" />
        )}
      </TouchableOpacity>

      <TextInput
        label="Item Name *"
        value={newItem.itemName}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, itemName: text }))}
        style={styles.modalInput}
        mode="outlined"
      />

      <Text style={styles.sectionTitle}>Select Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radioScrollView}>
        {categories.map((cat) => (
          <TouchableOpacity 
            key={cat.value}
            style={[
              styles.radioButton, 
              newItem.category === cat.value && styles.selectedRadioButton
            ]}
            onPress={() => setNewItem((prev) => ({ ...prev, category: cat.value }))}
          >
            <Text style={[
              styles.radioButtonText, 
              newItem.category === cat.value && styles.selectedRadioButtonText
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {newItem.category && subCategoriesMap[newItem.category] && subCategoriesMap[newItem.category].length > 0 && (
  <>
    <Text style={styles.sectionTitle}>Select Subcategory</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radioScrollView}>
      {subCategoriesMap[newItem.category].map((subCat) => (
        <TouchableOpacity 
          key={subCat.value}
          style={[
            styles.radioButton, 
            newItem.subCategory === subCat.value && styles.selectedRadioButton
          ]}
          onPress={() => setNewItem((prev) => ({ ...prev, subCategory: subCat.value }))}
        >
          <Text style={[
            styles.radioButtonText, 
            newItem.subCategory === subCat.value && styles.selectedRadioButtonText
          ]}>
            {subCat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </>
)}

      <TextInput
        label="Description"
        value={newItem.description}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, description: text }))}
        style={styles.modalInput}
        mode="outlined"
        multiline
      />

      <TextInput
        label="Price *"
        value={newItem.price}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, price: text }))}
        style={styles.modalInput}
        mode="outlined"
        keyboardType="numeric"
        left={<TextInput.Affix text="₹" />}
      />

      <View style={styles.togglesContainer}>
        {[
          { label: 'Available', key: 'availability' },
          { label: 'Best Seller', key: 'bestSeller' },
          { label: 'New Arrival', key: 'newArrival' }
        ].map(({ label, key }) => (
          <View key={key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Switch
              value={newItem[key]}
              onValueChange={(value) => setNewItem((prev) => ({ ...prev, [key]: value }))}
              color="#F8931F"
            />
          </View>
        ))}
      </View>

      <View style={styles.modalButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("StockManagement")}
          style={styles.modalButton}
        >
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleAddItem}
          style={styles.modalButton}
        >
          Add Item
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: scale(20),
    paddingBottom: verticalScale(90),
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    marginBottom: verticalScale(15),
    textAlign: "center",
  },
  imagePickerButton: {
    height: verticalScale(150),
    backgroundColor: "#f0f0f0",
    borderRadius: scale(10),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(15),
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(10),
  },
  modalInput: {
    marginBottom: verticalScale(12),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginVertical: verticalScale(10),
  },
  radioScrollView: {
    marginBottom: verticalScale(15),
  },
  radioButton: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(10),
    marginRight: scale(10),
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scale(10),
  },
  selectedRadioButton: {
    backgroundColor: '#F8931F',
    borderColor: '#F8931F',
  },
  radioButtonText: {
    color: '#333',
  },
  selectedRadioButtonText: {
    color: 'white',
  },
  togglesContainer: {
    marginVertical: verticalScale(15),
    backgroundColor: "#f5f5f5",
    borderRadius: scale(8),
    padding: scale(10),
    minHeight : 350,
    marginBottom : -100
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  toggleLabel: {
    fontSize: moderateScale(14),
    color: "#333",
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    width: "48%",
    minHeight : 20
  },
});