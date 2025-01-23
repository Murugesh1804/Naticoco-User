import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_HEIGHT } from './Home/constants';
import {categories} from './Home/constants'

const CustomerSupportScreen = () => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  const [email,setMail] = useState('');
  const [isProductModalVisible, setProductModalVisible] = useState(false);


  const submitReview = async () => {
    if (!selectedProduct || !reviewText) {
      alert('Please select a product and write a review');
      return;
    }

    try {
      // Simulated review submission 
      console.log('Review submitted', { 
        product: selectedProduct, 
        review: reviewText, 
        rating 
      });

      // Reset form
      setSelectedProduct('');
      setReviewText('');
      setRating(0);

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Customer Support</Text>
          
          {/* Product Selector */}
          <TouchableOpacity 
            style={styles.productSelectorContainer}
            onPress={() => setProductModalVisible(true)}
          >
            <Text style={styles.label}>Select Product</Text>
            <Text style={styles.selectedProductText}>
              {selectedProduct || 'Choose a Product'}
            </Text>
          </TouchableOpacity>

          {/* Rating Selector */}
          <View style={styles.ratingContainer}>
            <Text style={styles.label}>Rate Your Experience</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star}
                  onPress={() => setRating(star)}
                >
                  <Text 
                    style={[
                      styles.star, 
                      rating >= star ? styles.selectedStar : null
                    ]}
                  >
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Review Input */}
          <TextInput 
            style={styles.textInput1} 
            placeholder='Enter your Email ID'
            value={email}
            onChangeText={setMail}
          />
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="Write your review here..."
            value={reviewText}
            onChangeText={setReviewText}
            placeholderTextColor="#888"
          />

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={submitReview}
          >
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>

          {/* Product Selection Modal */}
          <Modal
            transparent={true}
            visible={isProductModalVisible}
            animationType="slide"
            onRequestClose={() => setProductModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Product</Text>
                {categories.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.modalProductItem}
                    onPress={() => {
                      setSelectedProduct(product.name);
                      setProductModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalProductText}>{product.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setProductModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFF',
  },
  safeArea: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F8931F',
    textAlign: 'center',
    marginBottom: 20,
  },
  productSelectorContainer: {
    backgroundColor: '#F8931F',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  selectedProductText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  label: {
    color: 'black',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 30,
    color: 'black',
    marginHorizontal: 5,
  },
  selectedStar: {
    color: 'gold',
  },
  textInput: {
    height: 120,
    borderColor : 'black',
    borderWidth : 2,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  textInput1: {
   height: 60,
   borderColor : 'black',
   borderWidth : 2,
   borderRadius: 10,
   padding: 10,
   textAlignVertical: 'top',
   marginBottom: 20,
 },
  submitButton: {
    backgroundColor: '#F8931F',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalProductItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalProductText: {
    textAlign: 'center',
    fontSize: 16,
  },
  modalCancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F8931F',
    borderRadius: 10,
  },
  modalCancelText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default CustomerSupportScreen;