import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { mockApi } from '../services/mockApi';
import { ChatMessage } from '../data/mockData';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Send, MessageCircle } from 'lucide-react-native';

const ChatScreen: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    if (currentUser) {
      try {
        const session = await mockApi.getChatSession(currentUser.id);
        if (session) {
          setMessages(session.messages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUser || loading) return;

    const userMessage: ChatMessage = {
      sender_type: 'user',
      message_text: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Simulate typing delay
      setTimeout(async () => {
        const botResponse = await mockApi.sendChatMessage(currentUser.id, inputText.trim());
        setMessages(prev => [...prev, botResponse]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.sender_type === 'user';
    
    return (
      <Animated.View
        entering={isUser ? FadeInRight.delay(50) : FadeInDown.delay(50)}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessage : styles.botMessage,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
            {item.message_text}
          </Text>
          <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.botMessageTime]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => (
    <Animated.View entering={FadeInDown} style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, styles.typingDot1]} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#000000', '#1a1a1a']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <MessageCircle color="#D4AF37" size={24} />
          <Text style={styles.headerTitle}>Chat Assistant</Text>
          <Text style={styles.headerSubtitle}>How can we help you today?</Text>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={loading ? renderTypingIndicator : null}
          showsVerticalScrollIndicator={false}
        />

        {/* Welcome Message */}
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome to our chat!</Text>
            <Text style={styles.welcomeText}>
              Ask me anything about our menu, reservations, or dining experience.
            </Text>
            <View style={styles.suggestionsContainer}>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => setInputText('Show me the menu')}
              >
                <Text style={styles.suggestionText}>Show me the menu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => setInputText('Help with reservations')}
              >
                <Text style={styles.suggestionText}>Help with reservations</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionButton}
                onPress={() => setInputText('What are your signature dishes?')}
              >
                <Text style={styles.suggestionText}>Signature dishes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your message..."
              placeholderTextColor="#666666"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
            >
              <Send color={(!inputText.trim() || loading) ? '#666666' : '#000000'} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginTop: 8,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
    fontFamily: 'Lato-Regular',
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userMessage: {
    backgroundColor: '#D4AF37',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Lato-Regular',
  },
  userMessageText: {
    color: '#000000',
  },
  botMessageText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Lato-Regular',
  },
  userMessageTime: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  botMessageTime: {
    color: '#CCCCCC',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  welcomeText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Lato-Regular',
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  suggestionText: {
    fontSize: 14,
    color: '#D4AF37',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'Lato-SemiBold',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginVertical: 8,
  },
  typingBubble: {
    backgroundColor: '#2a2a2a',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4AF37',
    marginHorizontal: 2,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.7,
  },
  typingDot3: {
    opacity: 1,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#2a2a2a',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: 8,
    fontFamily: 'Lato-Regular',
  },
  sendButton: {
    backgroundColor: '#D4AF37',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#666666',
  },
});

export default ChatScreen;