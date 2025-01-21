import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, Switch, Alert } from 'react-native';
import { Text, Card, TextInput, Button, IconButton } from 'react-native-paper';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';



const StockItem = ({ item, onUpdateStock, onUpdatePrice }) => {
 const [isEditing, setIsEditing] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [stockValue, setStockValue] = useState(item.stock?.toString() || "0");
 const [priceValue, setPriceValue] = useState(item.price?.toString() || "0");

 const handleSave = async () => {
   try {
     setIsSaving(true);
     await onUpdateStock(item._id || item.id, parseInt(stockValue));
     await onUpdatePrice(item._id || item.id, parseFloat(priceValue));
     setIsEditing(false);
   } catch (error) {
     Alert.alert('Error', 'Failed to save changes');
   } finally {
     setIsSaving(false);
   }
 };

 return (
   <MotiView
     from={{ opacity: 0, translateY: 20 }}
     animate={{ opacity: 1, translateY: 0 }}
     transition={{ type: 'spring', duration: 1000 }}
   >
     <Card style={styles.stockCard}>
       <Card.Content>
         <View style={styles.stockHeader}>
           <View>
             <Text style={styles.itemName}>{item.itemName}</Text>
             <Text style={styles.category}>{item.category}</Text>
           </View>
           <IconButton
             icon={isEditing ? "check" : "pencil"}
             size={20}
             disabled={isSaving}
             onPress={isEditing ? handleSave : () => setIsEditing(true)}
           />
         </View>
         ...
       </Card.Content>
     </Card>
   </MotiView>
 );
};
