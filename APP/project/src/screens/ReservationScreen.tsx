import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { addReservation } from '../store/slices/reservationSlice';
import { mockApi } from '../services/mockApi';
import { Table } from '../data/mockData';
import LuxuryCard from '../components/LuxuryCard';
import LuxuryButton from '../components/LuxuryButton';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Users, MapPin, Wifi, Eye, Clock } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ReservationScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [numPeople, setNumPeople] = useState(2);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const timeSlots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
  const peopleCounts = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    loadAvailableTables();
  }, [selectedDate, numPeople]);

  const loadAvailableTables = async () => {
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const tables = await mockApi.getAvailableTables(dateStr, numPeople);
      setAvailableTables(tables);
    } catch (error) {
      console.error('Failed to load tables:', error);
    }
  };

  const handleReservation = async () => {
    if (!selectedTable || !currentUser) {
      Alert.alert('Error', 'Please select a table and ensure you are logged in');
      return;
    }

    setLoading(true);
    try {
      const reservationTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      reservationTime.setHours(parseInt(hours), parseInt(minutes));

      const reservation = await mockApi.createReservation({
        user_id: currentUser.id,
        table_id: selectedTable.id,
        reservation_time: reservationTime.toISOString(),
        num_people: numPeople,
        preferences: {
          special_occasion: 'dining',
        },
        status: 'pending',
      });

      dispatch(addReservation(reservation));
      Alert.alert(
        'Success',
        'Your reservation has been submitted! You will receive a confirmation shortly.',
        [{ text: 'OK', onPress: () => resetForm() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTable(null);
    setSelectedDate(new Date());
    setSelectedTime('19:00');
    setNumPeople(2);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderAmenityIcon = (amenity: string) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi color="#D4AF37" size={16} />;
      case 'sea_view':
      case 'garden_view':
        return <Eye color="#D4AF37" size={16} />;
      default:
        return <MapPin color="#D4AF37" size={16} />;
    }
  };

  const TableModal = () => (
    <Modal visible={showTableModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select a Table</Text>
          
          <ScrollView style={styles.tablesContainer}>
            {availableTables.map((table, index) => (
              <Animated.View key={table.id} entering={FadeInDown.delay(index * 100)}>
                <TouchableOpacity
                  style={[
                    styles.tableCard,
                    selectedTable?.id === table.id && styles.selectedTableCard,
                  ]}
                  onPress={() => setSelectedTable(table)}
                >
                  <Image
                    source={{ uri: table.panorama_urls[0] }}
                    style={styles.tableImage}
                  />
                  <View style={styles.tableInfo}>
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableName}>Table {table.table_number}</Text>
                      <View style={styles.capacityBadge}>
                        <Users color="white" size={14} />
                        <Text style={styles.capacityText}>{table.capacity}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.locationContainer}>
                      <MapPin color="#D4AF37" size={16} />
                      <Text style={styles.locationText}>
                        {table.location.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.amenitiesContainer}>
                      {table.amenities.map((amenity, idx) => (
                        <View key={idx} style={styles.amenityItem}>
                          {renderAmenityIcon(amenity)}
                          <Text style={styles.amenityText}>
                            {amenity.replace('_', ' ')}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <LuxuryButton
              title="Cancel"
              onPress={() => setShowTableModal(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <LuxuryButton
              title="Select"
              onPress={() => setShowTableModal(false)}
              style={styles.modalButton}
              disabled={!selectedTable}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Reserve Your Table</Text>
          <Text style={styles.subtitle}>Experience luxury dining at its finest</Text>
        </View>

        {/* Date Selection */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Calendar color="#D4AF37" size={24} />
              <View style={styles.dateInfo}>
                <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
                <Text style={styles.dateSubtext}>Tap to change date</Text>
              </View>
            </TouchableOpacity>
          </LuxuryCard>
        </Animated.View>

        {/* Time Selection */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.timeContainer}
            >
              {timeSlots.map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.selectedTimeSlot,
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Clock
                    color={selectedTime === time ? '#000000' : '#D4AF37'}
                    size={16}
                  />
                  <Text
                    style={[
                      styles.timeText,
                      selectedTime === time && styles.selectedTimeText,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LuxuryCard>
        </Animated.View>

        {/* Party Size */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>Party Size</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.peopleContainer}
            >
              {peopleCounts.map(count => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.peopleButton,
                    numPeople === count && styles.selectedPeopleButton,
                  ]}
                  onPress={() => setNumPeople(count)}
                >
                  <Users
                    color={numPeople === count ? '#000000' : '#D4AF37'}
                    size={20}
                  />
                  <Text
                    style={[
                      styles.peopleText,
                      numPeople === count && styles.selectedPeopleText,
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LuxuryCard>
        </Animated.View>

        {/* Table Selection */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <LuxuryCard>
            <Text style={styles.sectionTitle}>
              Available Tables ({availableTables.length})
            </Text>
            
            {selectedTable ? (
              <View style={styles.selectedTableInfo}>
                <Image
                  source={{ uri: selectedTable.panorama_urls[0] }}
                  style={styles.selectedTableImage}
                />
                <View style={styles.selectedTableDetails}>
                  <Text style={styles.selectedTableName}>
                    Table {selectedTable.table_number}
                  </Text>
                  <Text style={styles.selectedTableLocation}>
                    {selectedTable.location.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noSelectionText}>No table selected</Text>
            )}

            <LuxuryButton
              title="Browse Tables"
              onPress={() => setShowTableModal(true)}
              variant="outline"
              style={styles.browseButton}
            />
          </LuxuryCard>
        </Animated.View>

        {/* Reservation Summary */}
        {selectedTable && (
          <Animated.View entering={FadeInDown.delay(500)}>
            <LuxuryCard gradient>
              <Text style={styles.summaryTitle}>Reservation Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date & Time:</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(selectedDate)} at {selectedTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Table:</Text>
                <Text style={styles.summaryValue}>
                  Table {selectedTable.table_number} ({selectedTable.location.replace('_', ' ')})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Party Size:</Text>
                <Text style={styles.summaryValue}>{numPeople} guests</Text>
              </View>
            </LuxuryCard>
          </Animated.View>
        )}

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.submitContainer}>
          <LuxuryButton
            title="Confirm Reservation"
            onPress={handleReservation}
            disabled={!selectedTable || loading}
            style={styles.submitButton}
          />
        </Animated.View>
      </ScrollView>

      <TableModal />
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
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 8,
    fontFamily: 'Lato-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  dateInfo: {
    marginLeft: 16,
  },
  dateText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  dateSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 2,
    fontFamily: 'Lato-Regular',
  },
  timeContainer: {
    flexDirection: 'row',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  selectedTimeSlot: {
    backgroundColor: '#D4AF37',
  },
  timeText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Lato-SemiBold',
  },
  selectedTimeText: {
    color: '#000000',
  },
  peopleContainer: {
    flexDirection: 'row',
  },
  peopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minWidth: 60,
    justifyContent: 'center',
  },
  selectedPeopleButton: {
    backgroundColor: '#D4AF37',
  },
  peopleText: {
    fontSize: 16,
    color: '#D4AF37',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Lato-SemiBold',
  },
  selectedPeopleText: {
    color: '#000000',
  },
  selectedTableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTableImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  selectedTableDetails: {
    marginLeft: 16,
  },
  selectedTableName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  selectedTableLocation: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 2,
    fontFamily: 'Lato-Regular',
  },
  noSelectionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Lato-Regular',
  },
  browseButton: {
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 16,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Lato-Regular',
  },
  summaryValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Lato-SemiBold',
  },
  submitContainer: {
    padding: 20,
  },
  submitButton: {
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  tablesContainer: {
    maxHeight: '60%',
  },
  tableCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  selectedTableCard: {
    borderColor: '#D4AF37',
    borderWidth: 2,
  },
  tableImage: {
    width: '100%',
    height: 120,
  },
  tableInfo: {
    padding: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capacityText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Lato-SemiBold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
    fontFamily: 'Lato-Regular',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
    fontFamily: 'Lato-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default ReservationScreen;