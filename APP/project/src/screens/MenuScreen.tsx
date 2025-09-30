import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/slices/cartSlice';
import { mockApi } from '../services/mockApi';
import { Dish, Category } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Search, Plus, Star } from 'lucide-react-native';

const MenuScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dishesData, categoriesData] = await Promise.all([
        mockApi.getDishes(),
        mockApi.getCategories(),
      ]);
      setDishes(dishesData);
      setCategories(categoriesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = selectedCategory === 'all' || dish.category_id === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && dish.active;
  });

  const handleAddToCart = (dish: Dish) => {
    dispatch(addItem({
      dish_id: dish.id,
      quantity: 1,
      price: dish.price,
    }));
    Alert.alert('Success', `${dish.name} added to cart!`);
  };

  const formatPrice = (price: number) => {
    return `₫${price.toLocaleString()}`;
  };

  const renderDishItem = ({ item, index }: { item: Dish; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <LuxuryCard style={styles.dishCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DishDetail', { dishId: item.id })}
        >
          <Image source={{ uri: item.media_urls[0] }} style={styles.dishImage} />
          
          {item.is_best_seller && (
            <View style={styles.bestSellerBadge}>
              <Star color="#D4AF37" size={16} fill="#D4AF37" />
              <Text style={styles.bestSellerText}>Best Seller</Text>
            </View>
          )}

          <View style={styles.dishContent}>
            <Text style={styles.dishName}>{item.name}</Text>
            <Text style={styles.dishDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.dishFooter}>
              <Text style={styles.dishPrice}>{formatPrice(item.price)}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
              >
                <Plus color="#000000" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </LuxuryCard>
    </Animated.View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Menu</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search color="#666666" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dishes..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === 'all' && styles.activeCategoryButton,
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === 'all' && styles.activeCategoryButtonText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.activeCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.id && styles.activeCategoryButtonText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDishes}
        renderItem={renderDishItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        numColumns={1}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 20,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Lato-Regular',
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  activeCategoryButton: {
    backgroundColor: '#D4AF37',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  activeCategoryButtonText: {
    color: '#000000',
  },
  listContent: {
    paddingBottom: 20,
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
  dishCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 0,
    overflow: 'hidden',
  },
  dishImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  bestSellerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  dishContent: {
    padding: 16,
  },
  dishName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  dishDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
    fontFamily: 'Lato-Regular',
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Lato-Bold',
  },
  addButton: {
    backgroundColor: '#D4AF37',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MenuScreen;