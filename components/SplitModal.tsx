import { addSplit, addSplitDay, addSplitDayExercise, deleteSplit, deleteSplitDay, deleteSplitDayExercise, getSplitWithDaysAndExercises, getSplits, updateSplit, updateSplitDayExercise } from '@/database/splits';
import { Split } from '@/database/types';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
      setDayInputs(Array(7).fill('').map(() => ({ 
        input: '', 
        error: undefined, 
        exercises: [], 
        editingId: null, 
        editingText: '',
        shakeAnim: new Animated.Value(0)
      })));
      setIsEditing(false);
    } else if (initialSplit) {
      // Load initial split data
      setSplitName(initialSplit.name);
      loadSplitData(initialSplit.id);
      setIsEditing(true);
    }
  }, [visible, initialSplit]);

  const loadSplitData = async (splitId: number) => {
    try {
      const splitData = await getSplitWithDaysAndExercises(splitId);
      const newDayInputs: DayInput[] = Array(7).fill(null).map(() => ({ 
        input: '', 
        error: undefined, 
        exercises: [], 
        editingId: null, 
        editingText: '',
        shakeAnim: new Animated.Value(0)
      }));
      
      // Sort days by day_of_week to ensure correct order
      const sortedDays = [...splitData.days].sort((a, b) => a.day_of_week - b.day_of_week);
      
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
  const handleAddExercise = (dayIdx: number) => {
    const input = dayInputs[dayIdx].input.trim();
    if (!input) {
      updateDayInputs(dayIdx, { error: 'Cannot be empty' });
      shake(dayIdx);
      return;
    }
    if (dayInputs[dayIdx].exercises.some(e => e.name.toLowerCase() === input.toLowerCase())) {
      updateDayInputs(dayIdx, { error: 'Already exists' });
      shake(dayIdx);
      return;
    }
    updateDayInputs(dayIdx, {
      exercises: [...dayInputs[dayIdx].exercises, { 
        id: Math.random().toString(), 
        name: input, 
        order: dayInputs[dayIdx].exercises.length 
      }],
      input: '',
      error: undefined,
    });
  };

  // Delete exercise from a day
  const handleDeleteExercise = async (dayIdx: number, exerciseId: string) => {
    const exercise = dayInputs[dayIdx].exercises.find(ex => ex.id === exerciseId);
    if (exercise?.dbId) {
      try {
        await deleteSplitDayExercise(exercise.dbId);
      } catch (e) {
        console.error('Error deleting exercise:', e);
        return;
      }
    }
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
      let splitId;
      if (initialSplit) {
        // Update existing split
        await updateSplit(initialSplit.id, splitName.trim());
        splitId = initialSplit.id;

        // Get existing split data to compare
        const existingData = await getSplitWithDaysAndExercises(splitId);
        const existingDayMap = new Map(existingData.days.map(day => [day.day_of_week, day]));

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
  const handleClose = () => {
    if (isEditing) {
      // If editing, reload the data to discard changes
      if (initialSplit) {
        loadSplitData(initialSplit.id);
      }
    }
    onCancel();
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
                  <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                    <TextInput
                      style={[
                        styles.splitNameInput,
                        error && styles.inputError
                      ]}
                      placeholder="Split name (e.g. PPL, Bro Split)"
                      value={splitName}
                      onChangeText={setSplitName}
                      placeholderTextColor="#aaa"
                    />
                    {error && <Text style={styles.errorText}>{error}</Text>}
                  </Animated.View>
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
                              style={[
                                styles.input,
                                dayInputs[i].error && styles.inputError
                              ]}
                              placeholder="Add exercise"
                              value={dayInputs[i].input}
                              onChangeText={text => updateDayInputs(i, { input: text, error: undefined })}
                              placeholderTextColor="#aaa"
                              onSubmitEditing={() => Keyboard.dismiss()}
                            />
                            {dayInputs[i].input.length > 0 && (
                              <Pressable
                                style={styles.clearInputButton}
                                onPress={() => updateDayInputs(i, { input: '', error: undefined })}
                              >
                                <MaterialIcons name="close" size={20} color="#888" />
                              </Pressable>
                            )}
                          </View>
                          {dayInputs[i].error && <Text style={styles.errorText}>{dayInputs[i].error}</Text>}
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
            {initialSplit && (
              <View style={styles.modalFooter}>
                <Pressable 
                  style={[styles.footerButton, styles.deleteButton]} 
                  onPress={async () => {
                    try {
                      await deleteSplit(initialSplit.id);
                      onDone();
                    } catch (e) {
                      setError('Error deleting split');
                    }
                  }}
                >
                  <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
                </Pressable>
              </View>
            )}
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
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
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
  input: {
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
}); 