import React, { useState, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  FlatList,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  TextInput,
  Chip,
  Badge,
  Avatar,
  Portal,
  Modal,
  Provider,
  useTheme,
  SegmentedButtons,
  IconButton,
  Menu,
  Divider
} from 'react-native-paper';
import { spacing } from '@/theme';
import { StatCard } from '@/components';

const screenWidth = Dimensions.get('window').width;

// Mock data for chat sessions
const mockChats = [
  {
    id: 1,
    customerName: "Nguyễn Văn A",
    channel: "Website",
    status: "Đang chat",
    priority: "Cao",
    lastMessage: "Cho em hỏi có thể đặt bàn cho 6 người không ạ?",
    lastTime: "2 phút trước",
    assignedTo: "Nhân viên Hoa",
    unreadCount: 3,
    phone: "0123456789",
    email: "nguyenvana@email.com",
    messages: [
      { id: 1, content: "Chào em!", sender: "customer", time: "14:30", isRead: true },
      { id: 2, content: "Cho em hỏi có thể đặt bàn cho 6 người không ạ?", sender: "customer", time: "14:32", isRead: false },
      { id: 3, content: "Dạ, em có thể đặt bàn được ạ", sender: "staff", time: "14:33", isRead: true },
      { id: 4, content: "Em muốn đặt bàn vào thứ 7 tuần sau", sender: "customer", time: "14:35", isRead: false },
      { id: 5, content: "Em có thể đặt vào lúc mấy giờ ạ?", sender: "customer", time: "14:36", isRead: false }
    ],
    notes: "Khách hàng VIP, đã đặt bàn 3 lần trước đó."
  },
  {
    id: 2,
    customerName: "Trần Thị B",
    channel: "App",
    status: "Chờ",
    priority: "Bình thường",
    lastMessage: "Thực đơn hôm nay có gì mới không ạ?",
    lastTime: "15 phút trước",
    assignedTo: null,
    unreadCount: 1,
    phone: "0987654321",
    email: "tranthib@email.com",
    messages: [
      { id: 1, content: "Xin chào!", sender: "customer", time: "14:15", isRead: true },
      { id: 2, content: "Thực đơn hôm nay có gì mới không ạ?", sender: "customer", time: "14:20", isRead: false }
    ],
    notes: ""
  },
  {
    id: 3,
    customerName: "Lê Văn C",
    channel: "Zalo",
    status: "Đã đóng",
    priority: "Bình thường",
    lastMessage: "Cảm ơn nhà hàng, món ăn rất ngon!",
    lastTime: "1 giờ trước",
    assignedTo: "Nhân viên Minh",
    unreadCount: 0,
    phone: "0369258147",
    email: "levanc@email.com",
    messages: [
      { id: 1, content: "Tối qua em ăn ở nhà hàng", sender: "customer", time: "13:00", isRead: true },
      { id: 2, content: "Dạ, cảm ơn anh đã ghé thăm", sender: "staff", time: "13:02", isRead: true },
      { id: 3, content: "Cảm ơn nhà hàng, món ăn rất ngon!", sender: "customer", time: "13:05", isRead: true },
      { id: 4, content: "Cảm ơn anh đã đánh giá. Hẹn gặp lại anh!", sender: "staff", time: "13:06", isRead: true }
    ],
    notes: "Khách hàng hài lòng với dịch vụ."
  },
  {
    id: 4,
    customerName: "Phạm Thị D",
    channel: "Facebook",
    status: "Đang chat",
    priority: "Khẩn cấp",
    lastMessage: "Đơn hàng của em bị giao nhầm địa chỉ",
    lastTime: "5 phút trước",
    assignedTo: "Nhân viên Lan",
    unreadCount: 2,
    phone: "0456789123",
    email: "phamthid@email.com",
    messages: [
      { id: 1, content: "Đơn hàng của em bị giao nhầm địa chỉ", sender: "customer", time: "14:25", isRead: false },
      { id: 2, content: "Em đang ở số 123 ABC, nhưng shipper lại giao sang số 321", sender: "customer", time: "14:27", isRead: false }
    ],
    notes: "Cần xử lý khiếu nại giao hàng."
  },
  {
    id: 5,
    customerName: "Hoàng Văn E",
    channel: "Website",
    status: "Chờ",
    priority: "Bình thường",
    lastMessage: "Làm sao để hủy đơn hàng ạ?",
    lastTime: "30 phút trước",
    assignedTo: null,
    unreadCount: 1,
    phone: "0789123456",
    email: "hoangvane@email.com",
    messages: [
      { id: 1, content: "Làm sao để hủy đơn hàng ạ?", sender: "customer", time: "14:00", isRead: false }
    ],
    notes: ""
  }
];

const chatTabs = ["Tất cả", "Đang chat", "Chờ"];
const channels = ["Website", "App", "Zalo", "Facebook"];
const priorities = ["Cao", "Bình thường", "Khẩn cấp"];

export const ChatScreen = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chats, setChats] = useState(mockChats);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showChatDetail, setShowChatDetail] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Safe check for theme
  if (!theme || !theme.colors) {
    return null;
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalChats = chats.length;
    const activeChats = chats.filter(c => c.status === 'Đang chat').length;
    const waitingChats = chats.filter(c => c.status === 'Chờ').length;
    const unreadMessages = chats.reduce((sum, c) => sum + c.unreadCount, 0);

    return [
      {
        title: "Tổng phiên chat",
        value: totalChats.toString(),
        change: "+5",
        icon: "💬",
        color: "#2196F3",
      },
      {
        title: "Đang chat",
        value: activeChats.toString(),
        change: "+2",
        icon: "🔵",
        color: "#4CAF50",
      },
      {
        title: "Chờ hỗ trợ",
        value: waitingChats.toString(),
        change: "+1",
        icon: "⏳",
        color: "#FF9800",
      },
      {
        title: "Tin chưa đọc",
        value: unreadMessages.toString(),
        change: "+8",
        icon: "🔴",
        color: "#F44336",
      },
    ];
  }, [chats]);

  // Filter chats using useMemo for performance
  const filteredChats = useMemo(() => {
    return chats.filter(item => {
      const matchesSearch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === 'Tất cả' || 
                        (activeTab === 'Đang chat' && item.status === 'Đang chat') ||
                        (activeTab === 'Chờ' && item.status === 'Chờ');
      
      return matchesSearch && matchesTab;
    });
  }, [chats, searchQuery, activeTab]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang chat': return '#4CAF50';
      case 'Chờ': return '#FF9800';
      case 'Đã đóng': return '#9E9E9E';
      default: return theme.colors.outline;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Website': return '#2196F3';
      case 'App': return '#4CAF50';
      case 'Zalo': return '#0068FF';
      case 'Facebook': return '#1877F2';
      default: return theme.colors.outline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Cao': return '#FF5722';
      case 'Khẩn cấp': return '#F44336';
      case 'Bình thường': return '#9E9E9E';
      default: return theme.colors.outline;
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    setShowChatDetail(true);
    setCustomerNotes(chat.notes);
    
    // Mark messages as read
    setChats(prev => prev.map(c => 
      c.id === chat.id 
        ? { 
            ...c, 
            unreadCount: 0, 
            messages: c.messages.map(m => ({ ...m, isRead: true }))
          }
        : c
    ));
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const newMsg = {
      id: selectedChat.messages.length + 1,
      content: newMessage.trim(),
      sender: "staff",
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    setChats(prev => prev.map(c => 
      c.id === selectedChat.id 
        ? { 
            ...c, 
            lastMessage: newMessage.trim(),
            lastTime: "Vừa xong",
            messages: [...c.messages, newMsg]
          }
        : c
    ));

    setSelectedChat((prev: any) => prev ? {
      ...prev,
      lastMessage: newMessage.trim(),
      lastTime: "Vừa xong",
      messages: [...prev.messages, newMsg]
    } : null);

    setNewMessage('');
  };

  const handleCloseChat = () => {
    if (!selectedChat) return;
    
    Alert.alert(
      'Kết thúc cuộc trò chuyện',
      'Bạn có chắc muốn kết thúc cuộc trò chuyện này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Kết thúc', 
          onPress: () => {
            setChats(prev => prev.map(c => 
              c.id === selectedChat.id 
                ? { ...c, status: 'Đã đóng' }
                : c
            ));
            setSelectedChat((prev: any) => prev ? { ...prev, status: 'Đã đóng' } : null);
            setMenuVisible(false);
          }
        }
      ]
    );
  };

  const handleSaveNotes = () => {
    if (!selectedChat) return;
    
    setChats(prev => prev.map(c => 
      c.id === selectedChat.id 
        ? { ...c, notes: customerNotes }
        : c
    ));
    
    setSelectedChat((prev: any) => prev ? { ...prev, notes: customerNotes } : null);
    Alert.alert('Thành công', 'Đã lưu ghi chú khách hàng');
  };

  const renderStatCard = ({ item }: { item: any }) => (
    <StatCard
      title={item.title}
      value={item.value}
      icon={item.icon}
      color={item.color}
      change={item.change || '+0'}
    />
  );

  const renderChatItem = ({ item }: { item: any }) => (
    <Card 
      style={[styles.chatCard, { backgroundColor: theme.colors.surface }]} 
      mode="outlined"
      onPress={() => handleChatSelect(item)}
    >
      <Card.Content style={styles.chatContent}>
        {/* Header with avatar and info */}
        <View style={styles.chatHeader}>
          <Avatar.Text 
            size={40} 
            label={item.customerName.charAt(0)} 
            style={{ backgroundColor: getAvatarColor(item.customerName) }}
          />
          <View style={styles.chatInfo}>
            <View style={styles.nameRow}>
              <Text variant="titleSmall" style={[styles.customerName, { color: theme.colors.onSurface }]}>
                {item.customerName}
              </Text>
              {item.unreadCount > 0 && (
                <Badge style={styles.unreadBadge}>
                  {item.unreadCount}
                </Badge>
              )}
            </View>
            <View style={styles.badgeRow}>
              <Chip 
                mode="flat" 
                compact 
                style={[styles.channelChip, { backgroundColor: getChannelColor(item.channel) }]}
                textStyle={{ color: 'white', fontSize: 10 }}
              >
                {item.channel}
              </Chip>
              <Badge 
                style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}
              >
                {item.status}
              </Badge>
              <Chip 
                mode="flat" 
                compact 
                style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
                textStyle={{ color: 'white', fontSize: 10 }}
              >
                {item.priority}
              </Chip>
            </View>
          </View>
        </View>

        {/* Message preview */}
        <View style={styles.messagePreview}>
          <Text 
            variant="bodyMedium" 
            style={[styles.lastMessage, { color: theme.colors.onSurfaceVariant }]}
            numberOfLines={2}
          >
            {item.lastMessage}
          </Text>
        </View>

        {/* Footer with time and assignee */}
        <View style={styles.chatFooter}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.lastTime}
          </Text>
          {item.assignedTo && (
            <Text variant="bodySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              {item.assignedTo}
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'staff' ? styles.staffMessage : styles.customerMessage
    ]}>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: item.sender === 'staff' ? theme.colors.primary : theme.colors.surfaceVariant,
        }
      ]}>
        <Text 
          variant="bodyMedium" 
          style={{ 
            color: item.sender === 'staff' ? 'white' : theme.colors.onSurfaceVariant 
          }}
        >
          {item.content}
        </Text>
      </View>
      <Text 
        variant="bodySmall" 
        style={[
          styles.messageTime,
          { 
            color: theme.colors.onSurfaceVariant,
            textAlign: item.sender === 'staff' ? 'right' : 'left'
          }
        ]}
      >
        {item.time}
      </Text>
    </View>
  );

  return (
    <Provider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {!showChatDetail ? (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.onBackground }]}>
                Hệ thống Chat Hỗ trợ
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                Quản lý tin nhắn và hỗ trợ khách hàng 💬
              </Text>
            </View>

            {/* Stats Grid */}
            <FlatList
              data={stats}
              style={styles.statGrid}
              numColumns={2}
              columnWrapperStyle={styles.row}
              keyExtractor={(item) => item.title}
              renderItem={renderStatCard}
              scrollEnabled={false}
            />

            {/* Search and Tabs Section */}
            <View style={[styles.searchSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Danh sách cuộc trò chuyện
              </Text>
              
              {/* Search Input */}
              <TextInput
                mode="outlined"
                label="Tìm kiếm theo tên khách hàng..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                left={<TextInput.Icon icon="magnify" />}
                right={searchQuery ? <TextInput.Icon icon="close" onPress={() => setSearchQuery('')} /> : undefined}
              />

              {/* Tab Buttons */}
              <SegmentedButtons
                value={activeTab}
                onValueChange={setActiveTab}
                buttons={chatTabs.map(tab => ({
                  value: tab,
                  label: tab,
                  style: { flex: 1 }
                }))}
                style={styles.tabButtons}
              />
            </View>

            {/* Chat List */}
            <View style={[styles.chatListSection, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                {activeTab} ({filteredChats.length})
              </Text>
              <FlatList
                data={filteredChats}
                renderItem={renderChatItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                      Không có cuộc trò chuyện nào 💬
                    </Text>
                  </View>
                }
              />
            </View>
          </ScrollView>
        ) : (
          // Chat Detail View
          <View style={styles.chatDetailContainer}>
            {/* Chat Header */}
            <View style={[styles.chatDetailHeader, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.chatDetailHeaderLeft}>
                <IconButton
                  icon="arrow-left"
                  onPress={() => setShowChatDetail(false)}
                />
                <Avatar.Text 
                  size={36} 
                  label={selectedChat?.customerName.charAt(0)} 
                  style={{ backgroundColor: getAvatarColor(selectedChat?.customerName || '') }}
                />
                <View style={styles.chatDetailInfo}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                    {selectedChat?.customerName}
                  </Text>
                  <Badge 
                    style={[styles.headerStatusBadge, { backgroundColor: getStatusColor(selectedChat?.status) }]}
                  >
                    {selectedChat?.status}
                  </Badge>
                </View>
              </View>
              
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => setMenuVisible(true)}
                  />
                }
              >
                <Menu.Item onPress={handleCloseChat} title="Kết thúc chat" />
                <Menu.Item onPress={() => console.log('Chuyển nhân viên')} title="Chuyển nhân viên" />
                <Divider />
                <Menu.Item 
                  onPress={() => {
                    setShowCustomerInfo(true);
                    setMenuVisible(false);
                  }} 
                  title="Xem thông tin khách hàng" 
                />
              </Menu>
            </View>

            {/* Messages List */}
            <ScrollView style={styles.messagesContainer}>
              <FlatList
                data={selectedChat?.messages || []}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                style={styles.messagesList}
              />
            </ScrollView>

            {/* Message Input */}
            <View style={[styles.messageInputContainer, { backgroundColor: theme.colors.surface }]}>
              <TextInput
                mode="outlined"
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChangeText={setNewMessage}
                style={styles.messageInput}
                multiline
                right={
                  <TextInput.Icon 
                    icon="send" 
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim()}
                  />
                }
                left={<TextInput.Icon icon="attachment" />}
              />
            </View>
          </View>
        )}

        {/* Customer Info Modal */}
        <Portal>
          <Modal
            visible={showCustomerInfo}
            onDismiss={() => setShowCustomerInfo(false)}
            contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                Thông tin khách hàng
              </Text>
              <IconButton
                icon="close"
                onPress={() => setShowCustomerInfo(false)}
                style={styles.closeButton}
              />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Customer Basic Info */}
              <View style={styles.customerInfoSection}>
                <View style={styles.customerHeader}>
                  <Avatar.Text 
                    size={60} 
                    label={selectedChat?.customerName.charAt(0)} 
                    style={{ backgroundColor: getAvatarColor(selectedChat?.customerName || '') }}
                  />
                  <View style={styles.customerDetails}>
                    <Text variant="titleLarge" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
                      {selectedChat?.customerName}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      📱 {selectedChat?.phone}
                    </Text>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                      ✉️ {selectedChat?.email}
                    </Text>
                    <Chip 
                      mode="flat" 
                      compact 
                      style={[styles.infoChannelChip, { backgroundColor: getChannelColor(selectedChat?.channel) }]}
                      textStyle={{ color: 'white', fontSize: 12 }}
                    >
                      Kênh: {selectedChat?.channel}
                    </Chip>
                  </View>
                </View>
              </View>

              {/* Chat History */}
              <View style={styles.historySection}>
                <Text variant="titleMedium" style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                  Lịch sử chat gần đây
                </Text>
                <View style={styles.historyList}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    • Hôm nay: {selectedChat?.messages?.length || 0} tin nhắn
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    • Tuần trước: 2 cuộc trò chuyện
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    • Tháng trước: 1 cuộc trò chuyện
                  </Text>
                </View>
              </View>

              {/* Internal Notes */}
              <View style={styles.notesSection}>
                <Text variant="titleMedium" style={[styles.sectionLabel, { color: theme.colors.onSurface }]}>
                  Ghi chú nội bộ
                </Text>
                <TextInput
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  value={customerNotes}
                  onChangeText={setCustomerNotes}
                  placeholder="Nhập ghi chú về khách hàng..."
                  style={styles.notesInput}
                />
                <Button
                  mode="contained"
                  onPress={handleSaveNotes}
                  style={styles.saveNotesButton}
                >
                  Lưu ghi chú
                </Button>
              </View>
            </ScrollView>
          </Modal>
        </Portal>

      </SafeAreaView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  // Stats Grid
  statGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  // Search and Tabs Section
  searchSection: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  tabButtons: {
    marginBottom: spacing.sm,
  },
  // Chat List Section
  chatListSection: {
    margin: spacing.md,
    marginTop: 0,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Chat Item Styles
  chatCard: {
    marginBottom: spacing.md,
  },
  chatContent: {
    padding: spacing.md,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  chatInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  customerName: {
    fontWeight: 'bold',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#F44336',
    color: 'white',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  channelChip: {
    height: 24,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  priorityChip: {
    height: 24,
  },
  messagePreview: {
    marginBottom: spacing.sm,
  },
  lastMessage: {
    lineHeight: 18,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Chat Detail Styles
  chatDetailContainer: {
    flex: 1,
  },
  chatDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chatDetailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  chatDetailInfo: {
    flex: 1,
  },
  headerStatusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginTop: spacing.xs,
  },
  messagesContainer: {
    flex: 1,
    padding: spacing.md,
  },
  messagesList: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  staffMessage: {
    alignSelf: 'flex-end',
  },
  customerMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  messageTime: {
    fontSize: 11,
  },
  messageInputContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  messageInput: {
    maxHeight: 100,
  },
  // Modal styles
  modalContainer: {
    margin: spacing.md,
    maxHeight: '90%',
    borderRadius: 12,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  modalContent: {
    flex: 1,
  },
  customerInfoSection: {
    marginBottom: spacing.lg,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  customerDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  infoChannelChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  historyList: {
    gap: spacing.xs,
  },
  notesSection: {
    marginBottom: spacing.md,
  },
  notesInput: {
    marginBottom: spacing.md,
  },
  saveNotesButton: {
    alignSelf: 'flex-start',
  },
});

export default ChatScreen;