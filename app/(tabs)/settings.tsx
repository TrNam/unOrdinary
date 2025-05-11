import { initDB } from '@/database/init';
import { useSettingsStore } from '@/store/settings';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { useMetric, setUseMetric } = useSettingsStore();
  const router = useRouter();

  const handleClearWorkoutHistory = async () => {
    Alert.alert(
      'Clear Workout History',
      'Are you sure you want to clear all your workout history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await initDB();
              await db.runAsync('DELETE FROM workout_history;');
              Alert.alert('Success', 'Workout history has been cleared.');
            } catch (error) {
              console.error('Error clearing workout history:', error);
              Alert.alert('Error', 'Failed to clear workout history. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units</Text>
          <View style={styles.option}>
            <Text style={styles.optionText}>Use Metric System</Text>
            <Pressable
              style={[styles.toggle, useMetric && styles.toggleActive]}
              onPress={() => setUseMetric(!useMetric)}
            >
              <View style={[styles.toggleHandle, useMetric && styles.toggleHandleActive]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Pressable
            style={styles.dangerButton}
            onPress={handleClearWorkoutHistory}
          >
            <MaterialIcons name="delete-outline" size={24} color="#EF4444" />
            <Text style={styles.dangerButtonText}>Clear Workout History</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#232323',
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: '#444',
    borderRadius: 14,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  toggleHandleActive: {
    transform: [{ translateX: 22 }],
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dangerButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
}); 