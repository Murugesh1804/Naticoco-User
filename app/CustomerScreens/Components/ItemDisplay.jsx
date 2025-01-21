import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import getImage from './GetImage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SimilarItems = ({ product }) => {
  const navigation = useNavigation();
  const [img, setImg] = useState(null);
 
  useEffect(() => {
   const fetchImage = async () => {
     const base64Image = await getImage(product.image);
     setImg(base64Image);
     setIsLoading(false);
   };
   fetchImage();
 }, [product.image]);


  return (
    <TouchableOpacity
      key={product._id}
      style={styles.relatedCard}
      onPress={() => navigation.push('ItemDisplay', { item: product })}
    >
      <Image
        source={{ uri: img }}
        style={styles.relatedImage}
        resizeMode="cover"
      />
      <Text style={styles.relatedName}>{product.itemName}</Text>
      <Text style={styles.relatedPrice}>₹{product.price}</Text>
    </TouchableOpacity>
  );
};

export default function ItemDisplay({ route }) {
  const { item } = route.params;
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [image, setImage] = useState(null);
  const {addToCart} = useCart();

  useEffect(() => {
    const fetchMenuItems = async () => {
      const items = await AsyncStorage.getItem('storeMenu');
      if (items) {
        const parsedItems = JSON.parse(items);
        setMenuItems(parsedItems);
      }
      setIsLoading(false);
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
   const fetchImage = async () => {
     const base64Image = await getImage(item.image);
     setImage(base64Image);
     setIsLoading(false);
   };
   fetchImage();
 }, [item.image]);

  const relpro = menuItems.filter(
    (i) => i.category === item.category && i._id !== item._id
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F8931F" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButtonCircle}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#F8931F" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
          {item.BestSeller && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Best Seller</Text>
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.name}>{item.itemName}</Text>
            <Text style={styles.price}>₹{item.price}</Text>
          </View>

          {/* Product Info */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="fast-food-outline" size={20} color="#666" />
              <Text style={styles.detailText}>{item.category}</Text>
            </View>
            {item.subCategory && (
              <View style={styles.detailItem}>
                <Ionicons name="list-outline" size={20} color="#666" />
                <Text style={styles.detailText}>{item.subCategory}</Text>
              </View>
            )}
            {item.chickenType && (
              <View style={styles.detailItem}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.detailText}>{item.subCategory} Type</Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>{item.description}</Text>

          {/* Related Products */}
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>You might also like</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {relpro.length > 0
                ? relpro.map((product) => (
                    <SimilarItems key={product._id} product={product} />
                  ))
                : menuItems.map((i) => <SimilarItems key={i._id} product={i} />)}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
           addToCart(item);
           navigation.goBack();
          }}
        >
          <Text style={styles.addButtonText}>
            {cartItems.find((i) => i.id === item._id || item.id)?.quantity ? (
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityText}>
                  {cartItems.find((i) => i.id === item._id || item.id).quantity}{' '}
                  in cart
                </Text>
                <Ionicons name="add-circle" size={24} color="white" />
              </View>
            ) : (
              'Add to Cart'
            )}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#89C73A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: 20,
    gap : 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    color: '#F8931F',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#89C73A',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    color: '#666',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
  },
  relatedContainer: {
    marginBottom: 80,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  relatedScroll: {
    paddingRight: 20,
  },
  relatedCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  relatedImage: {
    width: '100%',
    height: 100,
  },
  relatedName: {
    fontSize: 14,
    fontWeight: '600',
    padding: 10,
  },
  relatedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8931F',
    padding: 10,
    paddingTop: 0,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 64 : 24,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addButton: {
    backgroundColor: '#F8931F',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityText: {
    color: 'white',
    fontSize: 16,
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 100,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
});