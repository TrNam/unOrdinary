import { resetDatabase } from '@/database/init';
import { useSettingsStore } from '@/store/settings';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { isDarkMode, useMetric, toggleTheme, toggleUnit } = useSettingsStore();

  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'Are you sure you want to reset the database? This will delete all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'Database has been reset successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset database.');
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
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="dark-mode" size={24} color="#fff" />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#3B82F6' }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="scale" size={24} color="#fff" />
              <Text style={styles.settingText}>Use Metric Units</Text>
            </View>
            <Switch
              value={useMetric}
              onValueChange={toggleUnit}
              trackColor={{ false: '#767577', true: '#3B82F6' }}
              thumbColor={useMetric ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Pressable style={styles.settingItem} onPress={handleResetDatabase}>
            <View style={styles.settingInfo}>
              <MaterialIcons name="delete" size={24} color="#EF4444" />
              <Text style={[styles.settingText, { color: '#EF4444' }]}>Reset Database</Text>
            </View>
          </Pressable>
        </View>
      </View>
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
    backgroundColor: '#232323',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
  },
}); 