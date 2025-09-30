import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/slices/cartSlice';
import { Dish, mockDishes } from '../data/mockData';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Plus, Minus, Star, Clock, Users } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface DishDetailScreenProps {
  route: {
    params: {
      dishId: string;
    };
  };
  navigation: any;
}

const DishDetailScreen: React.FC<DishDetailScreenProps> = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { dishId } = route.params;
  const [dish, setDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customizations, setCustomizations] = useState<Record<string, any>>({});

  useEffect(() => {
    loadDish();
  }, [dishId]);

  const loadDish = () => {
    const foundDish = mockDishes.find(d => d.id === dishId);
    if (foundDish) {
      setDish(foundDish);
    } else {
      Alert.alert('Error', 'Dish not found');
      navigation.goBack();
    }
  };

  const formatPrice = (price: number) => {
    return `₫${price.toLocaleString()}`;
  };

  const handleAddToCart = () => {
    if (!dish) return;

    dispatch(addItem({
      dish_id: dish.id,
      quantity,
      price: dish.price,
      customizations,
    }));

    Alert.alert(
      'Added to Cart',
      `${quantity}x ${dish.name} added to your cart!`,
      [
        { text: 'Continue Shopping', style: 'default' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const toggleCustomization = (key: string, value: any) => {
    setCustomizations(prev => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value,
    }));
  };

  if (!dish) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <Animated.View entering={FadeInUp.duration(800)}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: dish.media_urls[0] }} style={styles.dishImage} />
            
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>

            {/* Best Seller Badge */}
            {dish.is_best_seller && (
              <View style={styles.bestSellerBadge}>
                <Star color="#D4AF37" size={16} fill="#D4AF37" />
                <Text style={styles.bestSellerText}>Best Seller</Text>
              </View>
            )}

            {/* Seasonal Badge */}
            {dish.seasonal && (
              <View style={styles.seasonalBadge}>
                <Text style={styles.seasonalText}>Seasonal</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Dish Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.contentContainer}>
          <View style={styles.dishHeader}>
            <Text style={styles.dishName}>{dish.name}</Text>
            <Text style={styles.dishPrice}>{formatPrice(dish.price)}</Text>
          </View>

          <Text style={styles.dishDescription}>{dish.description}</Text>

          {/* Dish Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Clock color="#D4AF37" size={20} />
              <Text style={styles.detailText}>25-30 min</Text>
            </View>
            <View style={styles.detailItem}>
              <Users color="#D4AF37" size={20} />
              <Text style={styles.detailText}>Serves 1-2</Text>
            </View>
            <View style={styles.detailItem}>
              <Star color="#D4AF37" size={20} fill="#D4AF37" />
              <Text style={styles.detailText}>4.8 rating</Text>
            </View>
          </View>

          {/* Customizations */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text style={styles.sectionTitle}>Customizations</Text>
            
            <View style={styles.customizationGroup}>
              <Text style={styles.customizationTitle}>Preparation</Text>
              <View style={styles.customizationOptions}>
                {['Medium Rare', 'Medium', 'Well Done'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.customizationOption,
                      customizations.preparation === option && styles.selectedCustomization,
                    ]}
                    onPress={() => toggleCustomization('preparation', option)}
                  >
                    <Text
                      style={[
                        styles.customizationText,
                        customizations.preparation === option && styles.selectedCustomizationText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.customizationGroup}>
              <Text style={styles.customizationTitle}>Special Requests</Text>
              <View style={styles.customizationOptions}>
                {['No Salt', 'Extra Sauce', 'No Butter'].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.customizationOption,
                      customizations[option.toLowerCase().replace(' ', '_')] && styles.selectedCustomization,
                    ]}
                    onPress={() => toggleCustomization(option.toLowerCase().replace(' ', '_'), true)}
                  >
                    <Text
                      style={[
                        styles.customizationText,
                        customizations[option.toLowerCase().replace(' ', '_')] && styles.selectedCustomizationText,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Quantity Selection */}
          <Animated.View entering={FadeInDown.delay(600).duration(600)}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus color="#D4AF37" size={20} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Plus color="#D4AF37" size={20} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Total Price */}
          <Animated.View entering={FadeInDown.delay(800).duration(600)}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalPrice}>{formatPrice(dish.price * quantity)}</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Add to Cart Button */}
      <Animated.View entering={FadeInDown.delay(1000).duration(600)} style={styles.addToCartContainer}>
        <LuxuryButton
          title={`Add ${quantity} to Cart • ${formatPrice(dish.price * quantity)}`}
          onPress={handleAddToCart}
          style={styles.addToCartButton}
        />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#D4AF37',
    fontFamily: 'Lato-Regular',
  },
  imageContainer: {
    position: 'relative',
  },
  dishImage: {
    width: width,
    height: width * 0.8,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestSellerText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Lato-SemiBold',
  },
  seasonalBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  seasonalText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  contentContainer: {
    padding: 20,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dishName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    flex: 1,
    marginRight: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  dishPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  dishDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Lato-Regular',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 20,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
    fontFamily: 'Lato-Regular',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  customizationGroup: {
    marginBottom: 24,
  },
  customizationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
    fontFamily: 'Lato-SemiBold',
  },
  customizationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customizationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  selectedCustomization: {
    backgroundColor: '#D4AF37',
  },
  customizationText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  selectedCustomizationText: {
    color: '#000000',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  quantityText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginHorizontal: 32,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  addToCartContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.3)',
  },
  addToCartButton: {
    height: 56,
  },
});

export default DishDetailScreen;