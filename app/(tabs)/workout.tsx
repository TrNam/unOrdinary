import SplitModal from '@/components/SplitModal';
import { resetDatabase } from '@/database/init';
import { deleteSplit, getSplits, updateSplitOrder } from '@/database/splits';
import { Split } from '@/database/types';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorkoutScreen() {
  const router = useRouter();
  const [splits, setSplits] = useState<Split[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<Split | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Load splits
  useEffect(() => {
    loadSplits();
  }, []);

  const loadSplits = async () => {
    try {
      console.log('Loading splits...');
      const loadedSplits = await getSplits();
      console.log('Loaded splits:', loadedSplits);
      setSplits(loadedSplits);
    } catch (e) {
      console.error('Error loading splits:', e);
    }
  };

  // Add effect to log state changes
  useEffect(() => {
    console.log('Splits state updated:', splits);
  }, [splits]);

  // Filter splits based on search query
  const filteredSplits = splits.filter(split =>
    split.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  console.log('Filtered splits:', filteredSplits); // Add logging for filtered splits

  // Handle split selection
  const handleSplitPress = (split: Split) => {
    setSelectedSplit(split);
    setIsModalVisible(true);
  };

  // Handle split deletion
  const handleDeleteSplit = async (split: Split) => {
    try {
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
    loadSplits(); // Reload splits to get any updates
  };

  // Handle split reordering
  const handleDragEnd = async ({ data }: { data: Split[] }) => {
    setSplits(data);
    // Update order in database
    for (let i = 0; i < data.length; i++) {
      await updateSplitOrder(data[i].id, i);
    }
  };

  const handleResetDatabase = async () => {
    try {
      await resetDatabase();
      loadSplits(); // Reload the splits list
    } catch (e) {
      console.error('Error resetting database:', e);
    }
  };

  const renderSplitItem = ({ item, drag, isActive }: RenderItemParams<Split>) => {
    console.log('Rendering split item:', item); // Add debug logging
    return (
      <ScaleDecorator>
        <Swipeable
          friction={2}
          overshootFriction={8}
          renderRightActions={(progress: Animated.AnimatedInterpolation<any>, dragX: Animated.AnimatedInterpolation<any>) => (
            <Animated.View style={{ opacity: progress }}>
              <Pressable
                style={[styles.swipeAction, { backgroundColor: '#EF4444' }]}
                onPress={() => handleDeleteSplit(item)}
              >
                <MaterialIcons name="delete-outline" size={20} color="#fff" />
              </Pressable>
            </Animated.View>
          )}
        >
          <Pressable
            style={({ pressed }) => [
              styles.splitItem,
              pressed && styles.splitItemPressed,
              isActive && styles.splitItemActive,
              { borderWidth: 1, borderColor: '#333' } // Add border for visibility
            ]}
            onLongPress={drag}
            onPress={() => handleSplitPress(item)}
          >
            <MaterialIcons name="drag-handle" size={20} color="#888" style={{ marginRight: 8 }} />
            <Text style={styles.splitName}>{item.name}</Text>
          </Pressable>
        </Swipeable>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Splits</Text>
          <Pressable 
            style={styles.resetButton}
            onPress={handleResetDatabase}
          >
            <MaterialIcons name="refresh" size={24} color="#EF4444" />
          </Pressable>
        </View>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <MaterialIcons name="close" size={20} color="#888" />
            </Pressable>
          )}
        </View>
        <View style={{ flex: 1 }}>
          {filteredSplits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No splits yet</Text>
            </View>
          ) : (
            <DraggableFlatList
              data={filteredSplits}
              onDragEnd={handleDragEnd}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSplitItem}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
        <Pressable
          style={styles.fab}
          onPress={() => {
            setSelectedSplit(null);
            setIsModalVisible(true);
          }}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </Pressable>
        <SplitModal
          visible={isModalVisible}
          onCancel={handleModalClose}
          onDone={handleModalClose}
          initialSplit={selectedSplit}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
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
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 18,
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    minHeight: 60,
  },
  splitItemPressed: {
    backgroundColor: '#2A2A2A',
    transform: [{ scale: 0.98 }],
  },
  splitItemActive: {
    backgroundColor: '#2A2A2A',
    transform: [{ scale: 0.98 }],
  },
  splitName: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  swipeAction: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 4,
  },
  resetButton: {
    padding: 8,
  },
}); 