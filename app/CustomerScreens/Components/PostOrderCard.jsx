import { useEffect, useState } from "react";
import getImage from "./GetImage";
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";


const RenderProduct = ({item}) => {
 // console.log(menuItems);
 const [isLoading, setIsLoading] = useState(true);
 const [image,setImage] = useState();
 const navigation = useNavigation();
 
 
 useEffect(() => {
  const fetchImage = async () => {
    const base64Image = await getImage(item.image);
    setImage(base64Image);
    setIsLoading(false);
  };
  fetchImage();
}, [item.image]);


 return (
  <TouchableOpacity onPress={() => navigation.navigate("ItemDisplay", { item })} style={styles.productContainer}>
        {/* Chicken Malai Tikka Card */}
        <View style={styles.productCard}>
        {isLoading ? (
            <View style={styles.productImage}>
              <ActivityIndicator size="large" color="#F8931F" />
            </View>
          ) : (
            <Image source={{ uri: image }} style={styles.productImage} resizeMode="cover" />
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.itemName}</Text>
            <View style={styles.productDetails}>
              <View>
                <Text style={styles.price}>{item.price}/-</Text>
                <Text style={styles.quantity}>
                {(item.description).length > 40 ? (item.description).substring(0, 40) + '...' : item.description}
                </Text>
              </View>
              <TouchableOpacity style={styles.addButton}>
                <LinearGradient
                  colors={['#F8931F', '#f4a543']}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>ADD</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {item.BestSeller &&
             <View style={styles.bestsellerBadge}>
              <Text style={styles.bestsellerText}>BESTSELLER</Text>
             </View>
            }

          </View>
        </View>
      </TouchableOpacity>
 )
}

const styles = StyleSheet.create({
 productContainer: {
  padding: 16,
},
productCard: {
  backgroundColor: '#fff',
  borderRadius: 12,
  marginBottom: 16,
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
},
productImage: {
  width: '100%',
  height: 200,
  borderTopLeftRadius: 12,
  borderTopRightRadius: 12,
  justifyContent :'center',
  alignItems : 'center'
},
productInfo: {
  padding: 16,
},
productName: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 8,
},
productDetails: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
price: {
  fontSize: 16,
  fontWeight: '700',
  color: '#F8931F',
},
quantity: {
  fontSize: 12,
  color: '#666',
  marginTop: 4,
},
addButton: {
  overflow: 'hidden',
  borderRadius: 6,
},
addButtonGradient: {
  paddingVertical: 8,
  paddingHorizontal: 20,
},
addButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},
weightBadge: {
  position: 'absolute',
  top: -25,
  right: 16,
  backgroundColor: '#fff',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 4,
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
},
weightText: {
  fontSize: 12,
  color: '#666',
},
bestsellerBadge: {
  position: 'absolute',
  top: -180,
  left: 0,
  backgroundColor: '#F8931F',
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderTopLeftRadius: 12,
  borderBottomRightRadius: 12,
},
bestsellerText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '600',
},
})

export default RenderProduct;