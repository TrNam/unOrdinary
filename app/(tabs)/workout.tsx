import SplitModal from '@/components/SplitModal';
import resetDatabase from '@/database/init';
import { deleteSplit, getSplits, updateSplitOrder } from '@/database/splits';
import { Split } from '@/database/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutScreen() {
  const router = useRouter();
  const [splits, setSplits] = useState<Split[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Exit edit mode when tab changes
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsEditMode(false);
      };
    }, [])
  );

  // Load splits
  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      const loadedSplits = await getSplits();
      setSplits(loadedSplits);
    } catch (e) {
      console.error('Error loading splits:', e);
    }
  };

  // Filter splits based on search query
  const filteredSplits = splits.filter(split =>
    split.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle split selection
  const handleSplitPress = (split: Split) => {
    setSelectedSplit(split);
    setIsModalVisible(true);
  };

  // Handle split deletion
  const handleDeleteSplit = async (split: Split) => {
    try {
      if (split.is_default === 1) {
        Alert.alert(
          'Cannot Delete Default Split',
          'Please set another split as default before deleting this one.',
          [{ text: 'OK' }]
        );
        return;
      }
      await deleteSplit(split.id);
      setSplits(splits.filter(s => s.id !== split.id));
    } catch (e) {
      console.error('Error deleting split:', e);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedSplit(null);
    loadSplits();
  };

  // Add drag-and-drop functionality
  const handleDragEnd = async ({ data }: { data: Split[] }) => {
    // Update the order in the database for each split
    for (let i = 0; i < data.length; i++) {
      await updateSplitOrder(data[i].id, i);
    }
    // Update local state
    setSplits(data);
  };

  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      loadSplits();
    } catch (e) {
      console.error('Error resetting database:', e);
    }
  };

  const handleAddSplit = () => {
    setIsEditMode(false);
    setSelectedSplit(null);
    setIsModalVisible(true);
  };

  const renderSplitItem = ({ item, drag, isActive }: RenderItemParams<Split>) => (
    <ScaleDecorator>
      <Pressable
        onLongPress={isEditMode ? drag : undefined}
        disabled={isActive}
        onPress={() => {
          if (!isEditMode) {
            setSelectedSplit(item);
            setIsModalVisible(true);
          }
        }}
        style={[
          styles.splitItem,
          isActive && { backgroundColor: '#2A2A2A' }
        ]}
      >
        <View style={styles.splitContent}>
          <View style={styles.splitInfo}>
            {isEditMode && (
              <Pressable 
                style={styles.dragHandle}
                onPressIn={drag}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="drag-handle" size={24} color="#888" />
              </Pressable>
            )}
            <Text style={styles.splitName}>{item.name}</Text>
            {item.is_default === 1 && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          {isEditMode && (
            <Pressable 
              style={styles.deleteButton}
              onPress={() => handleDeleteSplit(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="delete" size={24} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </Pressable>
    </ScaleDecorator>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsSearchFocused(false);
        }}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Your Splits</Text>
              <View style={styles.headerButtons}>
                <Pressable 
                  style={styles.editButton}
                  onPress={() => setIsEditMode(!isEditMode)}
                >
                  <MaterialIcons 
                    name={isEditMode ? "check" : "edit"} 
                    size={24} 
                    color={isEditMode ? "#4CAF50" : "#3B82F6"} 
                  />
                </Pressable>
                <Pressable 
                  style={styles.addButton}
                  onPress={handleAddSplit}
                >
                  <Text>
                    <MaterialIcons name="add" size={24} color="#fff" />
                  </Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.searchContainer}>
              <Text>
                <MaterialIcons name="search" size={20} color="#888" />
              </Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery.length > 0 ? (
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text>
                    <MaterialIcons name="close" size={20} color="#888" />
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {filteredSplits.length === 0 ? (
              <View style={styles.emptyState}>
                <Text>
                  <MaterialIcons name="fitness-center" size={48} color="#888" />
                </Text>
                <Text style={styles.emptyStateText}>No splits yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first split workout</Text>
              </View>
            ) : (
              <GestureHandlerRootView style={{ flex: 1 }}>
                <DraggableFlatList
                  data={filteredSplits}
                  onDragEnd={handleDragEnd}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderSplitItem}
                  contentContainerStyle={styles.listContent}
                  simultaneousHandlers={[]}
                  activationDistance={20}
                  dragHitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  containerStyle={{ flex: 1 }}
                />
              </GestureHandlerRootView>
            )}
            <SplitModal
              visible={isModalVisible}
              onCancel={handleModalClose}
              onDone={handleModalClose}
              initialSplit={selectedSplit}
            />
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#232323',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 100,
  },
  splitItem: {
    backgroundColor: '#232323',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  splitItemPressed: {
    backgroundColor: '#2A2A2A',
    transform: [{ scale: 0.98 }],
  },
  splitInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  splitName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
  rightAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
    zIndex: 1,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitItemActive: {
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#2A2A2A',
  },
  splitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    flex: 1,
  },
  dragHandle: {
    padding: 4,
    zIndex: 1,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContent: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 4,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    borderRadius: 8,
  },
  menuOptionText: {
    color: '#fff',
    fontSize: 13,
  },
  deleteOptionText: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 2,
  },
  defaultBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  splitButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
}); 