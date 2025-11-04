import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { 
  Text, 
  Card, 
  TextInput,
  Button,
  useTheme,
  IconButton,
  Avatar,
  Portal,
  Modal,
  Chip
} from 'react-native-paper';
import { spacing } from '@/theme';
import { logger } from '@/utils/logger';

interface Message {
  id: number;
  content: string;
  sender: 'customer' | 'staff';
  time: string;
  isRead: boolean;
}

interface ChatSession {
  id: number;
  customerName: string;
  channel: string;
  status: string;
  priority: string;
  lastMessage: string;
  lastTime: string;
  assignedTo: string | null;
  unreadCount: number;
  phone: string;
  email: string;
  messages: Message[];
  notes: string;
}

interface ChatDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  chatSession: ChatSession | null;
  onSendMessage: (chatId: number, message: string) => void;
}

export const ChatDetailModal: React.FC<ChatDetailModalProps> = ({
  visible,
  onDismiss,
  chatSession,
  onSendMessage
}) => {
  const theme = useTheme();
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !chatSession) {
      return;
    }

    logger.debug('Sending message', {
      chatId: chatSession.id,
      message: newMessage
    });

    onSendMessage(chatSession.id, newMessage);
    setNewMessage('');
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [newMessage, chatSession, onSendMessage]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Khẩn cấp': return '#f44336';
      case 'Cao': return '#ff9800';
      default: return '#4caf50';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Website': return 'web';
      case 'App': return 'cellphone';
      case 'Zalo': return 'chat';
      case 'Facebook': return 'facebook';
      default: return 'message-text';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCustomer = item.sender === 'customer';
    
    return (
      <View style={[
        styles.messageContainer,
        isCustomer ? styles.customerMessage : styles.staffMessage
      ]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isCustomer 
              ? theme.colors.surfaceVariant 
              : theme.colors.primary
          }
        ]}>
          <Text style={[
            styles.messageText,
            {
              color: isCustomer 
                ? theme.colors.onSurfaceVariant 
                : theme.colors.onPrimary
            }
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            {
              color: isCustomer 
                ? theme.colors.onSurfaceVariant 
                : theme.colors.onPrimary,
              opacity: 0.7
            }
          ]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  if (!chatSession) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outline }]}>
          <View style={styles.headerLeft}>
            <Avatar.Text 
              size={40} 
              label={chatSession.customerName.charAt(0)} 
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.headerInfo}>
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {chatSession.customerName}
              </Text>
              <View style={styles.headerMeta}>
                <Chip 
                  icon={getChannelIcon(chatSession.channel)}
                  compact
                  style={styles.channelChip}
                >
                  {chatSession.channel}
                </Chip>
                <Chip 
                  compact
                  style={[
                    styles.priorityChip,
                    { backgroundColor: getPriorityColor(chatSession.priority) }
                  ]}
                  textStyle={{ color: 'white' }}
                >
                  {chatSession.priority}
                </Chip>
              </View>
            </View>
          </View>
          <IconButton 
            icon="close" 
            onPress={onDismiss}
            iconColor={theme.colors.onSurface}
          />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={chatSession.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <View style={[styles.inputRow, { borderTopColor: theme.colors.outline }]}>
            <TextInput
              mode="outlined"
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChangeText={setNewMessage}
              style={styles.textInput}
              multiline
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <IconButton
              icon="send"
              size={24}
              onPress={handleSendMessage}
              disabled={!newMessage.trim()}
              iconColor={theme.colors.primary}
              style={styles.sendButton}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: spacing.md,
    borderRadius: 12,
    maxHeight: '90%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerMeta: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  channelChip: {
    height: 24,
  },
  priorityChip: {
    height: 24,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
  },
  messageContainer: {
    marginVertical: spacing.xs,
  },
  customerMessage: {
    alignItems: 'flex-start',
  },
  staffMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  inputContainer: {
    paddingTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
});

export default ChatDetailModal;