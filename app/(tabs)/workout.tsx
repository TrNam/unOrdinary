import InputModal from '@/components/InputModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Collection, getCollections, getSplitCollections } from '@/database/collections';
import { getExercises } from '@/database/exercises';
import { Exercise } from '@/database/types';
import { useCollectionModal, useSplitCollectionModal } from '@/hooks/useCollectionModal';
import { useThemeColor } from '@/hooks/useThemeColor';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, SafeAreaView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';

const TABS = ["Exercises", "Splits"];

export default function WorkoutScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const { width } = useWindowDimensions();
  const backgroundColor = useThemeColor({}, 'background');
  const horizontalPadding = Math.max(16, width * 0.05); // Responsive padding
  const tabWidth = width / 2;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [splitCollections, setSplitCollections] = useState<any[]>([]);
  const collectionModal = useCollectionModal(setCollections);
  const splitCollectionModal = useSplitCollectionModal(setSplitCollections);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeTab === 0) {
      getExercises().then(data => {
        // Only exercises not in a collection
        const filtered = data.filter(e => !e.collection_id);
        setExercises(filtered.sort((a, b) => a.name.localeCompare(b.name)));
      });
    }
  }, [activeTab, showExerciseModal]);

  // Animate scale when any modal is open/closed
  useEffect(() => {
    const anyModalOpen = collectionModal.visible || splitCollectionModal.visible || showExerciseModal;
    Animated.timing(scaleAnim, {
      toValue: anyModalOpen ? 0.9 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [collectionModal.visible, splitCollectionModal.visible, showExerciseModal]);

  // Debug: Log table contents on mount
  useEffect(() => {
    (async () => {
      try {
        const collections = await getCollections();
        console.log('Current collections table:', collections);
      } catch (e) {
        console.error('Error reading collections table:', e);
      }
      try {
        const splitCollections = await getSplitCollections();
        console.log('Current split_collections table:', splitCollections);
      } catch (e) {
        console.error('Error reading split_collections table:', e);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}> 
      {/* Overlay for depth when modal is open */}
      {(collectionModal.visible || splitCollectionModal.visible || showExerciseModal) && (
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.18)' }]} pointerEvents="none" />
      )}
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
        <ThemedView style={[styles.container, { paddingHorizontal: horizontalPadding }]}> 
          <View style={styles.topTabs}>
            {TABS.map((tab, idx) => (
              <Pressable
                key={tab}
                style={[styles.tabButton, { width: tabWidth }]}
                onPress={() => setActiveTab(idx)}
              >
                <ThemedText
                  style={activeTab === idx ? styles.activeTabText : styles.inactiveTabText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tab}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <View style={styles.content}>
            {activeTab === 0 && (
              <FlatList
                data={collections.concat(exercises)}
                keyExtractor={item => ('collection_id' in item ? `exercise-${item.id}` : `collection-${item.id}`)}
                renderItem={({ item }) =>
                  'collection_id' in item ? (
                    <TouchableOpacity style={[styles.listItem, styles.exerciseItem]}>
                      <MaterialIcons name="fitness-center" size={22} color={styles.listIcon.color} />
                      <ThemedText style={styles.listText}>{item.name}</ThemedText>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.listItem, styles.collectionItem]}>
                      <MaterialIcons name="folder-open" size={22} color={styles.listIcon.color} />
                      <ThemedText style={[styles.listText, styles.collectionText]}>{item.name}</ThemedText>
                    </TouchableOpacity>
                  )
                }
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No exercises or collections yet.</ThemedText>}
              />
            )}
            {activeTab === 1 && (
              <FlatList
                data={splitCollections}
                keyExtractor={item => `split-collection-${item.id}`}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.listItem, styles.collectionItem]}>
                    <MaterialIcons name="folder-open" size={22} color={styles.listIcon.color} />
                    <ThemedText style={[styles.listText, styles.collectionText]}>{item.name}</ThemedText>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<ThemedText style={styles.emptyText}>No splits yet.</ThemedText>}
              />
            )}
          </View>
          {/* Floating Action Buttons */}
          <View style={styles.fabContainer} pointerEvents="box-none">
            <View style={styles.fabRow}>
              {activeTab === 0 && (
                <Pressable
                  style={styles.iconButton}
                  onPress={collectionModal.open}
                  accessibilityLabel="Add Collection"
                >
                  <MaterialIcons name="folder-open" size={32} color="#fff" />
                </Pressable>
              )}
              {activeTab === 1 && (
                <Pressable
                  style={styles.iconButton}
                  onPress={splitCollectionModal.open}
                  accessibilityLabel="Add Split Collection"
                >
                  <MaterialIcons name="folder-open" size={32} color="#fff" />
                </Pressable>
              )}
              <Pressable
                style={[styles.iconButton, { marginLeft: 16 }]}
                onPress={() => setShowExerciseModal(true)}
                accessibilityLabel="Add Exercise"
              >
                <MaterialIcons name="add-circle-outline" size={32} color="#fff" />
              </Pressable>
            </View>
          </View>
          {/* Collection Modal */}
          <InputModal
            visible={collectionModal.visible}
            title="New Collection"
            placeholder="New Collection (eg. Chest)"
            value={collectionModal.input}
            onChangeText={collectionModal.onChangeText}
            onOk={(ref?: React.RefObject<any>) => collectionModal.onOk(ref)}
            onCancel={collectionModal.close}
            error={collectionModal.error}
            shake={collectionModal.shake}
            onClearError={collectionModal.onClearError}
            loading={collectionModal.loading}
          />
          <InputModal
            visible={splitCollectionModal.visible}
            title="New Split"
            placeholder="New Split (eg. Push Day)"
            value={splitCollectionModal.input}
            onChangeText={splitCollectionModal.onChangeText}
            onOk={(ref?: React.RefObject<any>) => splitCollectionModal.onOk(ref)}
            onCancel={splitCollectionModal.close}
            error={splitCollectionModal.error}
            shake={splitCollectionModal.shake}
            onClearError={splitCollectionModal.onClearError}
            loading={splitCollectionModal.loading}
          />
          {/* Exercise Modal */}
          <InputModal
            visible={showExerciseModal}
            title={activeTab === 1 ? "New Split" : "New Exercise"}
            placeholder={activeTab === 1 ? "New Split (eg. Push Day)" : "New Exercise (eg. Barbell Row)"}
            value={exerciseName}
            onChangeText={setExerciseName}
            onOk={async () => {
              setShowExerciseModal(false);
              return true;
            }}
            onCancel={() => setShowExerciseModal(false)}
          />
        </ThemedView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  activeTabText: {
    opacity: 1,
    fontSize: 16,
  },
  inactiveTabText: {
    opacity: 0.5,
    fontSize: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    alignItems: 'flex-end',
    zIndex: 10,
    pointerEvents: 'box-none',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  fabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'transparent',
  },
  listIcon: {
    color: '#1A4862',
    marginRight: 12,
  },
  listText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#888',
  },
  collectionItem: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: 0,
    paddingVertical: 16,
  },
  collectionText: {
    fontWeight: '600',
    fontSize: 18,
  },
  exerciseItem: {
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
}); 