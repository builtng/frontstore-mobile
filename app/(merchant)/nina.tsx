import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Send, RotateCcw, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useNinaStore, NinaMessage } from '@/stores/ninaStore';
import { ninaApi } from '@/services/ninaApi';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing, Shadow } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const QUICK_PROMPTS = [
  'How do I get more customers?',
  'What should I add to my store?',
  'Help me write a product description',
  'How do I increase my sales?',
  'Should I run a promotion?',
];

const WELCOME_MESSAGE: NinaMessage = {
  id: 'nina-welcome',
  role: 'assistant',
  content: "Hi, I'm Nina. I'll help you create your store and start selling.\n\nTell me what you need — whether it's getting more customers, adding products, or growing your revenue.",
  timestamp: 0,
};

function TypingIndicator({ theme }: { theme: any }) {
  const dot1 = useRef(new RNAnimated.Value(0)).current;
  const dot2 = useRef(new RNAnimated.Value(0)).current;
  const dot3 = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: RNAnimated.Value, delay: number) =>
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.delay(delay),
          RNAnimated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          RNAnimated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          RNAnimated.delay(600 - delay),
        ])
      ).start();

    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  return (
    <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: theme.card }]}>
      <View style={styles.typingRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <RNAnimated.View
            key={i}
            style={[
              styles.typingDot,
              { backgroundColor: Colors.primary, opacity: dot, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ msg, theme }: { msg: NinaMessage; theme: any }) {
  const isUser = msg.role === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.ninaBadge}>
          <Bot size={14} color={Colors.white} strokeWidth={2} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: Colors.primary }]
            : [styles.bubbleAssistant, { backgroundColor: theme.card, borderColor: theme.border }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? Colors.white : theme.text },
          ]}
        >
          {msg.content}
        </Text>
      </View>
    </View>
  );
}

export default function NinaScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { messages, isTyping, addUserMessage, addAssistantMessage, setTyping, clearChat } = useNinaStore();
  const [input, setInput] = useState('');
  const flatRef = useRef<FlatList>(null);

  const displayMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    addUserMessage(trimmed);
    setTyping(true);

    const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const reply = await ninaApi.chat(trimmed, historyForApi);
      addAssistantMessage(reply);
    } catch {
      addAssistantMessage("Sorry, I'm having trouble connecting right now. Please try again in a moment.");
    }
  }, [isTyping, messages, addUserMessage, addAssistantMessage, setTyping]);

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearChat();
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <LinearGradient
          colors={['#128C7E', '#25D366']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ninaAvatar}
        >
          <Bot size={20} color={Colors.white} strokeWidth={2} />
        </LinearGradient>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: theme.text }]}>Nina</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>Your store assistant</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClear} style={[styles.clearBtn, { backgroundColor: theme.surface }]}>
          <RotateCcw size={16} color={theme.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={displayMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MessageBubble msg={item} theme={theme} />}
          ListFooterComponent={isTyping ? <TypingIndicator theme={theme} /> : null}
        />

        {/* Quick prompts — only show when no conversation yet */}
        {messages.length === 0 && (
          <View style={styles.quickPromptsWrap}>
            <View style={styles.quickPromptsRow}>
              <Sparkles size={13} color={Colors.primary} strokeWidth={2} />
              <Text style={[styles.quickPromptsLabel, { color: theme.textSecondary }]}>Try asking</Text>
            </View>
            <FlatList
              data={QUICK_PROMPTS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.quickPromptsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: Colors.primaryDim, borderColor: Colors.primary + '30' }]}
                  onPress={() => sendMessage(item)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.quickChipText, { color: Colors.primary }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.surface }]}
            placeholder={`Ask Nina anything, ${firstName}...`}
            placeholderTextColor={theme.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: input.trim() && !isTyping ? Colors.primary : theme.border },
            ]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Send size={18} color={Colors.white} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    gap: Spacing[3],
  },
  ninaAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  headerName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg, letterSpacing: -0.3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  statusText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageList: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
    gap: Spacing[3],
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing[2],
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },

  ninaBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },

  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: 21,
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing[1],
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  quickPromptsWrap: {
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[2],
    gap: Spacing[2],
  },
  quickPromptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  quickPromptsLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  quickPromptsList: {
    gap: Spacing[2],
    paddingRight: Spacing[5],
  },
  quickChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    gap: Spacing[3],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
