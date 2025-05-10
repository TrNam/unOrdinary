import { addSplit, addSplitDay, addSplitDayExercise, deleteSplitDay, deleteSplitDayExercise, getSplitWithDaysAndExercises, getSplits, setDefaultSplit, updateSplit, updateSplitDayExercise } from '@/database/splits';
import { Split } from '@/database/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface Exercise {
  id: string;
  name: string;
  order: number;
  dbId?: number;
}

interface DayInput {
  input: string;
  error: string | undefined;
  exercises: Exercise[];
  editingId: string | null;
  editingText: string;
  shakeAnim: Animated.Value;
}

export default function SplitModal({
  visible,
  onCancel,
  onDone,
  initialSplit,
}: {
  visible: boolean;
  onCancel: () => void;
  onDone: () => void;
  initialSplit?: Split | null;
}) {
  const [splitName, setSplitName] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [isDefault, setIsDefault] = useState(initialSplit?.is_default === 1);
  const [showDefaultConfirm, setShowDefaultConfirm] = useState(false);
  const [defaultConfirmMessage, setDefaultConfirmMessage] = useState('');
  const [exerciseInputs, setExerciseInputs] = useState<{ [key: number]: string }>({});
  const [splitData, setSplitData] = useState<Split | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [dayInputs, setDayInputs] = useState<DayInput[]>(
    Array(7).fill('').map(() => ({ 
      input: '', 
      error: undefined, 
      exercises: [], 
      editingId: null, 
      editingText: '',
      shakeAnim: new Animated.Value(0)
    }))
  );
  const [isEditing, setIsEditing] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSplitName('');
      setError(undefined);
      setLoading(false);
      setIsDefault(false);
      setShowDefaultConfirm(false);
      setDefaultConfirmMessage('');
      setExerciseInputs({});
      setDayInputs(Array(7).fill('').map(() => ({ 
        input: '', 
        error: undefined, 
        exercises: [], 
        editingId: null, 
        editingText: '',
        shakeAnim: new Animated.Value(0)
      })));
      setIsEditing(false);
      setSplitData(null);
    } else if (initialSplit) {
      setSplitName(initialSplit.name);
      setIsDefault(initialSplit.is_default === 1);
      setIsEditing(true);
    }
  }, [visible, initialSplit]);

  // Load split data when modal becomes visible
  useEffect(() => {
    if (visible && initialSplit) {
      loadSplitData(initialSplit.id);
    } else if (visible) {
      // Reset state for new split
      setSplitName('');
      setIsDefault(false);
      setDayInputs(Array(7).fill('').map(() => ({ 
        input: '', 
        error: undefined, 
        exercises: [], 
        editingId: null, 
        editingText: '',
        shakeAnim: new Animated.Value(0)
      })));
      setExerciseInputs({});
      setError(undefined);

      // Check if this is the first split
      getSplits().then(splits => {
        if (splits.length === 0) {
          setIsDefault(true);
        }
      });
    }
  }, [visible, initialSplit]);

  const loadSplitData = async (splitId: number) => {
    try {
      const splitData = await getSplitWithDaysAndExercises(splitId);
      setSplitData(splitData);
      
      const newDayInputs: DayInput[] = Array(7).fill(null).map(() => ({ 
        input: '', 
        error: undefined, 
        exercises: [], 
        editingId: null, 
        editingText: '',
        shakeAnim: new Animated.Value(0)
      }));
      
      // Sort days by day_of_week to ensure correct order
      const sortedDays = [...(splitData.days || [])].sort((a, b) => a.day_of_week - b.day_of_week);
      
      sortedDays.forEach(day => {
        // Sort exercises by order_index
        const sortedExercises = [...day.exercises].sort((a, b) => a.order_index - b.order_index);
        
        newDayInputs[day.day_of_week] = {
          input: '',
          error: undefined,
          exercises: sortedExercises.map(ex => ({
            id: Math.random().toString(),
            name: ex.name,
            order: ex.order_index,
            dbId: ex.id
          })),
          editingId: null,
          editingText: '',
          shakeAnim: new Animated.Value(0)
        };
      });
      
      setDayInputs(newDayInputs);
      setExerciseInputs({});
    } catch (e) {
      console.error('Error loading split data:', e);
      setError('Error loading split data');
    }
  };

  const shake = (dayIdx?: number) => {
    if (dayIdx !== undefined) {
      // Shake the specific day's input
      const dayInput = dayInputs[dayIdx];
      dayInput.shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(dayInput.shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(dayInput.shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(dayInput.shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(dayInput.shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Shake the split name input
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Helper to update a day's state
  function updateDayInputs(dayIdx: number, patch: Partial<DayInput>) {
    setDayInputs(inputs => inputs.map((d, i) => i === dayIdx ? { ...d, ...patch } : d));
  }

  // Add exercise to a day
  const handleAddExercise = async (dayIndex: number) => {
    const exerciseName = exerciseInputs[dayIndex]?.trim();
    if (!exerciseName) {
      console.log('No exercise name provided');
      return;
    }

    try {
      // Update local state only
      const newDayInputs = [...dayInputs];
      const currentExercises = newDayInputs[dayIndex].exercises || [];
      const newExercise = {
        id: Math.random().toString(),
        name: exerciseName,
        order: currentExercises.length,
        dbId: undefined
      };
      
      newDayInputs[dayIndex] = {
        ...newDayInputs[dayIndex],
        exercises: [...currentExercises, newExercise]
      };
      
      setDayInputs(newDayInputs);
      // Clear the input field
      setExerciseInputs({ ...exerciseInputs, [dayIndex]: '' });
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  // Delete exercise from a day
  const handleDeleteExercise = async (dayIdx: number, exerciseId: string) => {
    updateDayInputs(dayIdx, {
      exercises: dayInputs[dayIdx].exercises.filter(ex => ex.id !== exerciseId)
    });
  };

  // Handle exercise reordering
  const handleDragEnd = (dayIdx: number, exercises: Exercise[]) => {
    const updatedExercises = exercises.map((ex, index) => ({
      ...ex,
      order: index,
    }));
    updateDayInputs(dayIdx, { exercises: updatedExercises });
  };

  // Save split and all exercises
  const handleDone = async () => {
    if (!splitName.trim()) {
      setError('Split name cannot be empty');
      shake();
      return;
    }

    // Check for existing split name
    const existingSplits = await getSplits();
    const isDuplicate = existingSplits.some(
      split => split.name.toLowerCase() === splitName.trim().toLowerCase() && 
      (!initialSplit || split.id !== initialSplit.id)
    );
    if (isDuplicate) {
      setError('A split with this name already exists');
      shake();
      return;
    }

    setLoading(true);
    try {
      let splitId: number | undefined;
      if (initialSplit) {
        // Update existing split
        await updateSplit(initialSplit.id, splitName.trim(), initialSplit.is_favorite === 1);
        splitId = initialSplit.id;

        // If this split is being set as default, update all other splits
        if (isDefault) {
          await Promise.all(existingSplits.map(split => 
            setDefaultSplit(split.id, split.id === splitId)
          ));
        }

        // Get existing split data to compare
        const existingData = await getSplitWithDaysAndExercises(splitId);
        const existingDayMap = new Map((existingData.days || []).map(day => [day.day_of_week, day]));

        // Update exercises for each day
        for (let i = 0; i < 7; ++i) {
          const day = dayInputs[i];
          const existingDay = existingDayMap.get(i);
          
          if (day.exercises.length === 0) {
            // If no exercises, delete the day if it exists
            if (existingDay) {
              await deleteSplitDay(existingDay.id);
            }
            continue;
          }

          let splitDayId;
          if (existingDay) {
            splitDayId = existingDay.id;
          } else {
            splitDayId = await addSplitDay(splitId, i, DAYS[i]);
          }

          // Create a map of existing exercises
          const existingExercises = existingDay?.exercises || [];
          const existingExerciseMap = new Map(existingExercises.map(ex => [ex.id, ex]));

          // Update or add exercises
          for (const ex of day.exercises) {
            if (ex.dbId && existingExerciseMap.has(ex.dbId)) {
              // Update existing exercise
              await updateSplitDayExercise(ex.dbId, ex.name, ex.order);
              existingExerciseMap.delete(ex.dbId);
            } else {
              // Add new exercise
              await addSplitDayExercise(splitDayId!, ex.name, ex.order);
            }
          }

          // Delete any remaining exercises that weren't updated
          for (const id of Array.from(existingExerciseMap.keys())) {
            await deleteSplitDayExercise(id);
          }
        }
      } else {
        // Create new split
        splitId = await addSplit(splitName.trim());
        
        // If this is the first split or being set as default, update all splits
        if (isDefault) {
          await Promise.all(existingSplits.map(split => 
            setDefaultSplit(split.id, false)
          ));
          await setDefaultSplit(splitId!, true);
        } else if (existingSplits.length === 0) {
          // If this is the first split, set it as default
          await setDefaultSplit(splitId!, true);
        }

        // For each day, save split_day and exercises
        for (let i = 0; i < 7; ++i) {
          if (dayInputs[i].exercises.length === 0) continue;
          const splitDayId = await addSplitDay(splitId!, i, DAYS[i]);
          for (const ex of dayInputs[i].exercises) {
            await addSplitDayExercise(splitDayId!, ex.name, ex.order);
          }
        }
      }
      setLoading(false);
      onDone();
    } catch (e) {
      console.error('Error saving split:', e);
      setError('Error saving split');
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = async () => {
    if (initialSplit) {
      // Reset to initial state
      setSplitName(initialSplit.name);
      setIsDefault(initialSplit.is_default === 1);
      setError(undefined);
      setExerciseInputs({});
      
      // Reload original data
      const originalData = await getSplitWithDaysAndExercises(initialSplit.id);
      if (originalData) {
        setSplitData(originalData);
        
        // Reset day inputs with original data
        const newDayInputs: DayInput[] = Array(7).fill(null).map(() => ({ 
          input: '', 
          error: undefined, 
          exercises: [], 
          editingId: null, 
          editingText: '',
          shakeAnim: new Animated.Value(0)
        }));
        
        if (originalData.days) {
          originalData.days.forEach(day => {
            newDayInputs[day.day_of_week] = {
              input: '',
              error: undefined,
              exercises: day.exercises.map(ex => ({
                id: Math.random().toString(),
                name: ex.name,
                order: ex.order_index,
                dbId: ex.id
              })),
              editingId: null,
              editingText: '',
              shakeAnim: new Animated.Value(0)
            };
          });
        }
        
        setDayInputs(newDayInputs);
      }
    }
    onCancel();
  };

  const handleDefaultToggle = async () => {
    if (!isDefault) {
      // When turning ON default, just update state
      setIsDefault(true);
      setError(undefined);
    } else {
      // When turning OFF default, show error message
      setError('To change the default split, please select another split and set it as default');
    }
  };

  const confirmDefaultToggle = async () => {
    try {
      // Set all other splits as non-default
      const splits = await getSplits();
      await Promise.all(splits.map(split => 
        setDefaultSplit(split.id, split.id === initialSplit?.id)
      ));
      setIsDefault(true);
      setShowDefaultConfirm(false);
    } catch (e) {
      console.error('Error setting default split:', e);
      setError('Error setting default split');
    }
  };

  const renderExerciseItem = ({ item, drag, isActive }: RenderItemParams<Exercise>) => {
    // Find which day this exercise belongs to
    const dayIdx = dayInputs.findIndex(day => 
      day.exercises.some(ex => ex.id === item.id)
    );
    
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.exerciseItem,
            isActive && { backgroundColor: '#2A2A2A' }
          ]}
        >
          <MaterialIcons name="drag-handle" size={20} color="#888" style={{ marginRight: 8 }} />
          <Text style={styles.exerciseText}>{item.name}</Text>
          <Pressable 
            style={styles.deleteExerciseButton}
            onPress={() => handleDeleteExercise(dayIdx, item.id)}
          >
            <MaterialIcons name="close" size={20} color="#888" />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable style={styles.headerButton} onPress={handleClose}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Split' : 'New Split'}</Text>
              <Pressable 
                style={[styles.headerButton, styles.doneButton]} 
                onPress={handleDone} 
                disabled={loading}
              >
                <Text style={[styles.headerButtonText, styles.doneButtonText, loading && { opacity: 0.5 }]}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <ScrollView 
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <TextInput
                    style={[
                      styles.splitNameInput,
                      error && !error.includes('default split') && styles.inputError
                    ]}
                    placeholder="Split name (e.g. PPL, Bro Split)"
                    value={splitName}
                    onChangeText={setSplitName}
                    placeholderTextColor="#aaa"
                  />
                  {error && !error.includes('default split') && <Text style={styles.errorText}>{error}</Text>}

                  <View style={styles.defaultToggleContainer}>
                    <Text style={styles.defaultToggleLabel}>Set as default split</Text>
                    <Switch
                      value={isDefault}
                      onValueChange={handleDefaultToggle}
                      trackColor={{ false: '#767577', true: '#4CAF50' }}
                      thumbColor={isDefault ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                  {error && error.includes('default split') && (
                    <Text style={[styles.errorText, styles.defaultToggleError]}>
                      {error}
                    </Text>
                  )}

                  {showDefaultConfirm && (
                    <View style={styles.confirmDialog}>
                      <Text style={styles.confirmText}>Are you sure you want to set this split as default?</Text>
                      <View style={styles.confirmButtons}>
                        <Pressable 
                          style={[styles.confirmButton, styles.cancelButton]}
                          onPress={() => setShowDefaultConfirm(false)}
                        >
                          <Text style={styles.confirmButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable 
                          style={[styles.confirmButton, styles.confirmButtonPrimary]}
                          onPress={confirmDefaultToggle}
                        >
                          <Text style={[styles.confirmButtonText, styles.confirmButtonTextPrimary]}>Confirm</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {DAYS.map((day, i) => (
                    <View key={day} style={styles.daySection}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayTitle}>{day}</Text>
                      </View>
                      {/* List of exercises for this day */}
                      <View style={styles.exerciseListContainer}>
                        <DraggableFlatList
                          data={dayInputs[i].exercises}
                          onDragEnd={({ data }) => handleDragEnd(i, data)}
                          keyExtractor={(item) => item.id}
                          renderItem={renderExerciseItem}
                          scrollEnabled={false}
                          contentContainerStyle={styles.exerciseListContent}
                        />
                      </View>
                      {/* Add input */}
                      <View style={styles.inputRow}>
                        <Animated.View style={{ flex: 1, transform: [{ translateX: dayInputs[i].shakeAnim }] }}>
                          <View style={styles.inputContainer}>
                            <TextInput
                              style={styles.exerciseInput}
                              value={exerciseInputs[i] || ''}
                              onChangeText={(text) => setExerciseInputs(prev => ({ ...prev, [i]: text }))}
                              placeholder="Add exercise"
                              placeholderTextColor="#666"
                              autoCapitalize="none"
                              autoCorrect={false}
                            />
                          </View>
                        </Animated.View>
                        <Pressable 
                          style={styles.addButton} 
                          onPress={() => {
                            Keyboard.dismiss();
                            handleAddExercise(i);
                          }}
                        >
                          <MaterialIcons name="add" size={22} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </KeyboardAvoidingView>
              </ScrollView>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    height: '80%',
    maxHeight: 600,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#2A2A2A',
  },
  cancelButtonText: {
    color: '#fff',
  },
  doneButton: {
    backgroundColor: '#3B82F6',
  },
  doneButtonText: {
    color: '#fff',
  },
  splitNameInput: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 80,
  },
  daySection: {
    marginBottom: 16,
  },
  dayHeader: {
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseListContainer: {
    minHeight: 0,
    marginBottom: 8,
  },
  exerciseListContent: {
    paddingVertical: 4,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseText: {
    color: '#fff',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  exerciseInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 15,
  },
  clearInputButton: {
    padding: 8,
  },
  deleteExerciseButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    marginRight: 'auto',
  },
  deleteButtonText: {
    color: '#fff',
  },
  defaultToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  defaultToggleLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  defaultToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    padding: 2,
  },
  defaultToggleActive: {
    backgroundColor: '#3B82F6',
  },
  defaultToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  defaultToggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
  confirmDialog: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButtonTextPrimary: {
    color: '#fff',
  },
  defaultToggleError: {
    marginTop: 8,
    marginBottom: 0,
  },
}); 