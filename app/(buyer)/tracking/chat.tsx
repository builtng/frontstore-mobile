import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreHorizontal,
  Phone,
  Paperclip,
  Send,
  CheckCheck,
} from 'lucide-react-native';
import { FontFamily } from '@/constants/typography';

const QUICK_REPLIES = [
  'Hello, I am ready at home',
  'Are you near the gate?',
  'Please call when outside',
  'Thank you!',
];

export default function CourierChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      sender: 'courier',
      text: 'Hello, I am your package courier. I will deliver your package soon, please stay ready at home. Thank you!',
      time: '13:00',
    },
    {
      id: 2,
      sender: 'user',
      text: "Okay, I'll wait at home. Thank you for the information!",
      time: '13:00',
    },
    {
      id: 3,
      sender: 'courier',
      text: 'Okay 👍',
      time: '13:01',
    },
  ]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const sendQuickReply = (text: string) => {
    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerProfile}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
                }}
                style={styles.avatarImage}
              />
            </View>
            <View>
              <Text style={styles.headerName}>Ralph Edwards</Text>
              <Text style={styles.headerRole}>Delivery Man</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => router.push(`/(buyer)/tracking/call?id=${id}` as any)}
            >
              <Phone size={20} color="#0F172A" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <MoreHorizontal size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageBubbleWrapper,
                  isUser ? styles.userBubbleWrapper : styles.courierBubbleWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.courierBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userMessageText : styles.courierMessageText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <View style={styles.timeRow}>
                    <Text
                      style={[
                        styles.messageTime,
                        isUser ? styles.userMessageTime : styles.courierMessageTime,
                      ]}
                    >
                      {msg.time}
                    </Text>
                    {isUser && <CheckCheck size={14} color="#25D366" />}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Reply Chips */}
        <View style={styles.quickRepliesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesScroll}
          >
            {QUICK_REPLIES.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickReplyChip}
                activeOpacity={0.8}
                onPress={() => sendQuickReply(chip)}
              >
                <Text style={styles.quickReplyText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn} activeOpacity={0.7}>
            <Paperclip size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type message..."
            placeholderTextColor="#94A3B8"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={styles.sendBtn}
            activeOpacity={0.85}
            onPress={handleSend}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginLeft: 4,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerName: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  headerRole: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
  },
  courierBubbleWrapper: {
    justifyContent: 'flex-start',
  },
  userBubbleWrapper: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  courierBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#128C7E',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 20,
    fontFamily: FontFamily.bodyRegular,
  },
  courierMessageText: {
    color: '#0F172A',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  courierMessageTime: {
    color: '#94A3B8',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  quickRepliesContainer: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickRepliesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
  },
  quickReplyText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#475569',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
    color: '#0F172A',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});
