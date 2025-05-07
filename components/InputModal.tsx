import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface InputModalProps {
  visible: boolean;
  title: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onOk: (ref?: React.RefObject<any>) => Promise<boolean>;
  onCancel: () => void;
  error?: string;
  shake?: boolean;
  onClearError?: () => void;
  loading?: boolean;
}

export default function InputModal({
  visible,
  title,
  placeholder,
  value,
  onChangeText,
  onOk,
  onCancel,
  error,
  shake,
  onClearError,
  loading,
}: InputModalProps) {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const palette = Colors[colorScheme];
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // PanResponder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 2,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          if (!loading) handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (shake) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [shake]);

  // Reset translateY when modal opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  // Local handler to keep keyboard open if error
  const handleOk = async () => {
    const result = await onOk(inputRef);
    if (result === false && inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClose = () => {
    translateY.setValue(0);
    if (onClearError) onClearError();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={loading ? undefined : onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centeredView}
      >
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: palette.background },
            {
              transform: [
                { translateY },
                { translateX: shake ? shakeAnim : 0 },
              ],
            },
          ]}
        >
          {/* Full-size overlay for pan responder */}
          <View
            style={StyleSheet.absoluteFill}
            {...panResponder.panHandlers}
            pointerEvents="box-none"
          />
          <View style={styles.headerRow}>
            <Pressable style={styles.headerButton} onPress={handleClose} disabled={loading}>
              <ThemedText style={[styles.headerButtonText, { color: loading ? '#aaa' : palette.tint, opacity: loading ? 0.7 : 1 }]}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={[styles.sheetTitle, { color: '#fff' }]}>{title}</ThemedText>
            <Pressable style={styles.headerButton} onPress={handleOk} disabled={loading}>
              <ThemedText style={[styles.headerButtonText, { color: palette.tint, opacity: loading ? 0.5 : 1 }]}>
                {loading ? 'Saving...' : 'Done'}
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.sheetContent}>
            <Animated.View style={{ width: '100%', transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: '#fff', borderColor: error ? '#ff4d4f' : palette.tint, backgroundColor: colorScheme === 'light' ? '#f9f9f9' : '#223' }]}
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                placeholderTextColor={palette.icon}
                autoFocus
                onSubmitEditing={() => { if (!loading && inputRef.current) inputRef.current.blur(); }}
                returnKeyType="default"
                returnKeyLabel="Return"
              />
            </Animated.View>
            {!!error && (
              <ThemedText style={[styles.errorText, { color: '#ff4d4f' }]}>{error}</ThemedText>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  centeredView: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    height: Dimensions.get('window').height * 0.6,
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  sheetContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    alignSelf: 'flex-start',
  },
}); 