import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  Portal,
  Modal,
  IconButton,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import { format, addDays } from 'date-fns';

interface AddReservationScreenProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (reservation: any) => void;
}

export const AddReservationScreen: React.FC<AddReservationScreenProps> = ({
  visible,
  onDismiss,
  onSubmit,
}) => {
  const theme = useTheme();
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'dd/MM/yyyy'));
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [notes, setNotes] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [tableType, setTableType] = useState('regular');

  const tableOptions = [
    { value: 'regular', label: 'Bàn thường' },
    { value: 'vip', label: 'Bàn VIP' },
  ];

  const tables = {
    regular: ['Bàn 1', 'Bàn 2', 'Bàn 3', 'Bàn 4'],
    vip: ['Bàn 5', 'Bàn 6', 'Bàn 7', 'Bàn 8'],
  };

  const handleSubmit = () => {
    if (!customerName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (!guestCount.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng khách');
      return;
    }
    if (!selectedTable) {
      Alert.alert('Lỗi', 'Vui lòng chọn bàn');
      return;
    }

    const reservationData = {
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      guestCount: parseInt(guestCount),
      date: selectedDate,
      time: selectedTime,
      table: selectedTable,
      tableType,
      notes: notes.trim(),
      status: 'pending',
    };

    onSubmit(reservationData);
    resetForm();
  };

  const resetForm = () => {
    setCustomerName('');
    setPhoneNumber('');
    setEmail('');
    setGuestCount('');
    setSelectedDate(format(new Date(), 'dd/MM/yyyy'));
    setSelectedTime('19:00');
    setNotes('');
    setSelectedTable('');
    setTableType('regular');
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Thêm đặt bàn mới
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Thông tin đặt bàn */}
          <Card style={styles.section}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Thông tin đặt bàn
              </Text>

              {/* 1. 👤 Tên khách hàng */}
              <TextInput
                label="👤 Tên khách hàng *"
                value={customerName}
                onChangeText={setCustomerName}
                style={styles.input}
                mode="outlined"
                placeholder="Nhập tên khách hàng"
              />

              {/* 2. 📞 Số điện thoại */}
              <TextInput
                label="📞 Số điện thoại *"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
              />

              {/* 3. 📧 Email */}
              <TextInput
                label="📧 Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                placeholder="Nhập email (không bắt buộc)"
              />

              {/* 4 & 5. 📅 Ngày đặt và 🕐 Giờ đặt */}
              <View style={styles.dateTimeRow}>
                <TextInput
                  label="📅 Ngày đặt *"
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  style={styles.dateTimeInput}
                  mode="outlined"
                  placeholder="dd/mm/yyyy"
                />

                <TextInput
                  label="🕐 Giờ đặt *"
                  value={selectedTime}
                  onChangeText={setSelectedTime}
                  style={styles.dateTimeInput}
                  mode="outlined"
                  placeholder="hh:mm"
                />
              </View>

              {/* 6. 👥 Số người */}
              <TextInput
                label="👥 Số người *"
                value={guestCount}
                onChangeText={setGuestCount}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                placeholder="Nhập số lượng khách"
              />

              {/* 7. 🪑 Chọn bàn */}
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurface }]}>
                🪑 Chọn bàn *
              </Text>

              <SegmentedButtons
                value={tableType}
                onValueChange={setTableType}
                buttons={tableOptions}
                style={styles.tableTypeSelector}
              />

              <View style={styles.tableGrid}>
                {tables[tableType as keyof typeof tables].map((table) => (
                  <Chip
                    key={table}
                    selected={selectedTable === table}
                    onPress={() => setSelectedTable(table)}
                    style={styles.tableChip}
                    mode={selectedTable === table ? 'flat' : 'outlined'}
                  >
                    {table}
                  </Chip>
                ))}
              </View>

              {/* 8. 📝 Yêu cầu đặc biệt */}
              <TextInput
                label="📝 Yêu cầu đặc biệt"
                value={notes}
                onChangeText={setNotes}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Nhập yêu cầu đặc biệt (không bắt buộc)"
              />
            </Card.Content>
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.singleButton}
            buttonColor={theme.colors.primary}
          >
            Xác nhận đặt bàn
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateTimeInput: {
    flex: 1,
  },
  tableTypeSelector: {
    marginBottom: 16,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  singleButton: {
    flex: 1,
    paddingVertical: 4,
  },
});