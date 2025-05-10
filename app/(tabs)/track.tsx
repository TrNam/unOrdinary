import { WorkoutHistoryModal } from '@/components/WorkoutHistoryModal';
import { getSplitWithDaysAndExercises, getSplits, getWorkoutHistory, saveWorkoutHistory } from '@/database/splits';
import { Split } from '@/database/types';
import { useSettingsStore } from '@/store/settings';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Exercise {
  id: number;
  name: string;
  order_index: number;
  sets: ExerciseSet[];
}

interface ExerciseSet {
  id: string;
  weight: number;
  reps: number;
}

interface WorkoutHistoryModalData {
  name: string;
  sets: { weight: string; reps: string; unit: 'kg' | 'lbs' }[];
}

interface WorkoutHistory {
  date: string;
  split_id: number;
  day_of_week: number;
  exercises: WorkoutHistoryModalData[];
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
  pickerContainer: {
    marginBottom: 16,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  splitTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  splitInfo: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  splitInfoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  splitInfoText: {
    color: '#888',
    fontSize: 16,
  },
  exerciseItem: {
    backgroundColor: '#232323',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  exerciseHeaderContent: {
    flex: 1,
  },
  exerciseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseDetails: {
    backgroundColor: '#1A1A1A',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginBottom: 8,
  },
  addSetText: {
    color: '#3B82F6',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  setNumber: {
    width: 50,
    marginRight: 8,
  },
  setNumberText: {
    color: '#fff',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    backgroundColor: '#232323',
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 40,
    minWidth: 80,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    minHeight: 40,
    minWidth: 40,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginLeft: 6,
    width: 20,
  },
  removeSetButton: {
    padding: 4,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  dayText: {
    color: '#888',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calendar: {
    marginBottom: 16,
    borderRadius: 12,
  },
  emptyExerciseText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 12,
    textAlign: 'center',
  },
  exerciseList: {
    // Add appropriate styles for the exercise list
  },
  footer: {
    // Add appropriate styles for the footer
  },
});

export default function TrackScreen() {
  const [splits, setSplits] = React.useState<Split[]>([]);
  const [selectedSplit, setSelectedSplit] = React.useState<Split | null>(null);
  const [currentDayWorkout, setCurrentDayWorkout] = React.useState<Exercise[]>([]);
  const [expandedExercises, setExpandedExercises] = React.useState<Set<number>>(new Set());
  const [currentDay, setCurrentDay] = React.useState<number>(0);
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [selectedHistory, setSelectedHistory] = React.useState<WorkoutHistory | null>(null);
  const { useMetric } = useSettingsStore();

  // Load splits and update selection whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSplits();
      return () => {
        // Don't reset the workout state when tab changes
      };
    }, [])
  );

  const loadSplits = async () => {
    try {
      const loadedSplits = await getSplits();
      setSplits(loadedSplits);
      
      if (loadedSplits.length > 0) {
        // Find the default split
        const defaultSplit = loadedSplits.find(split => split.is_default === 1) || loadedSplits[0];
        setSelectedSplit(defaultSplit);
        // Initialize current day workout with empty sets
        if (defaultSplit.days && defaultSplit.days.length > 0) {
          const initialWorkout: Exercise[] = defaultSplit.days[0].exercises.map(exercise => ({
            id: exercise.id,
            name: exercise.name,
            order_index: exercise.order_index,
            sets: []
          }));
          setCurrentDayWorkout(initialWorkout);
        }
      } else {
        setSelectedSplit(null);
        setCurrentDayWorkout([]);
      }
    } catch (e) {
      console.error('Track: Error loading splits:', e);
    }
  };

  // Also load data when component mounts
  React.useEffect(() => {
    loadSplits();
  }, []);

  const updateCurrentDayWorkout = (split: Split) => {
    // Get current day (0-6, where 0 is Sunday)
    const today = new Date().getDay();
    // Convert to our day format (0-6, where 0 is Monday)
    // If today is Sunday (0), show Monday's workout (0)
    // If today is Saturday (6), show Saturday's workout (5)
    // Otherwise, show the current day's workout (subtract 1 to convert from Sunday=0 to Monday=0)
    const adjustedDay = today === 0 ? 0 : today - 1;
    setCurrentDay(adjustedDay);
    
    // Get the workout for today from the split
    const dayWorkout = split.days?.find(d => d.day_of_week === adjustedDay)?.exercises || [];
    // Sort exercises by order_index to maintain the order
    const sortedExercises = [...dayWorkout].sort((a, b) => a.order_index - b.order_index);
    setCurrentDayWorkout(sortedExercises.map(ex => ({ ...ex, sets: [] })));
  };

  // Update current day's workout when selected split changes
  React.useEffect(() => {
    if (selectedSplit) {
      const loadSplitData = async () => {
        try {
          const fullSplitData = await getSplitWithDaysAndExercises(selectedSplit.id);
          updateCurrentDayWorkout(fullSplitData);
        } catch (e) {
          console.error('Track: Error loading split data:', e);
        }
      };
      loadSplitData();
    }
  }, [selectedSplit]);

  const selectedSplitName = splits.find(s => s.id === selectedSplit?.id)?.name || 'Select a split';

  const toggleExercise = (index: number) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExercises(newExpanded);
  };

  const addSet = (exerciseIndex: number) => {
    setCurrentDayWorkout(prev => [
      ...prev.slice(0, exerciseIndex + 1),
      { ...prev[exerciseIndex], sets: [...(prev[exerciseIndex].sets || []), { id: Date.now().toString(), weight: 0, reps: 0 }] },
      ...prev.slice(exerciseIndex + 1)
    ]);
  };

  const removeSet = (exerciseIndex: number, setId: string) => {
    setCurrentDayWorkout(prev => [
      ...prev.slice(0, exerciseIndex),
      {
        ...prev[exerciseIndex],
        sets: prev[exerciseIndex].sets.filter(set => set.id !== setId)
      },
      ...prev.slice(exerciseIndex + 1)
    ]);
  };

  const handleSetChange = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setCurrentDayWorkout(prev => {
      const newWorkout = [...prev];
      const exercise = newWorkout[exerciseIndex];
      const set = exercise.sets[setIndex];
      
      if (field === 'weight') {
        const numericValue = value ? Number(value) : 0;
        set.weight = numericValue;
      } else {
        set.reps = value ? Number(value) : 0;
      }
      
      return newWorkout;
    });
  };

  const handleAddSet = (exerciseIndex: number) => {
    setCurrentDayWorkout(prev => {
      const newWorkout = [...prev];
      const exercise = newWorkout[exerciseIndex];
      exercise.sets.push({
        id: Date.now().toString(),
        weight: 0,
        reps: 0
      });
      return newWorkout;
    });
  };

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    setCurrentDayWorkout(prev => {
      const newWorkout = [...prev];
      const exercise = newWorkout[exerciseIndex];
      exercise.sets.splice(setIndex, 1);
      return newWorkout;
    });
  };

  const handleSave = async () => {
    if (!selectedSplit) return;

    const exercisesWithSets = currentDayWorkout.filter(exercise => 
      exercise.sets.length > 0
    );

    if (exercisesWithSets.length === 0) {
      Alert.alert('No Sets Added', 'Please add at least one set to save your workout.');
      return;
    }

    try {
      const exercisesToSave: WorkoutHistoryModalData[] = currentDayWorkout.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets.map(set => ({
          weight: set.weight.toString(),
          reps: set.reps.toString(),
          unit: useMetric ? 'kg' : 'lbs'
        }))
      }));
      
      await saveWorkoutHistory(
        selectedSplit.id,
        new Date().toISOString().split('T')[0], // Get today's date in YYYY-MM-DD format
        exercisesToSave,
        useMetric
      );
      
      Alert.alert('Success', 'Workout saved successfully!');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  const handleDayPress = async (day: { dateString: string }) => {
    const date = day.dateString;
    setSelectedDate(date);
    if (!selectedSplit) return;

    try {
      const selectedDateObj = new Date(date + 'T00:00:00');
      const dayOfWeek = selectedDateObj.getDay();
      const adjustedDayOfWeek = dayOfWeek === 0 ? 0 : dayOfWeek - 1;

      const history = await getWorkoutHistory(date, selectedSplit.id, adjustedDayOfWeek);
      
      const workoutHistory: WorkoutHistory = {
        date: date,
        split_id: selectedSplit.id,
        day_of_week: adjustedDayOfWeek,
        exercises: history ? (Array.isArray(history.exercises)
          ? history.exercises.map((ex: any) => ({
              name: ex.name,
              sets: Array.isArray(ex.sets)
                ? ex.sets.map((set: any) => ({
                    weight: set.weight.toString(),
                    reps: set.reps.toString(),
                    unit: set.unit || (useMetric ? 'kg' : 'lbs') // Use saved unit or current setting
                  }))
                : []
            }))
          : []) : []
      };
      setSelectedHistory(workoutHistory);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading workout history:', error);
    }
  };

  // Update the exercise item rendering to include set management
  const renderExerciseItem = (exercise: Exercise, index: number) => (
    <View key={index} style={styles.exerciseItem}>
      <Pressable 
        style={styles.exerciseHeader}
        onPress={() => toggleExercise(index)}
      >
        <View style={styles.exerciseHeaderContent}>
          <Text style={styles.exerciseText}>{exercise.name}</Text>
        </View>
        <MaterialIcons 
          name={expandedExercises.has(index) ? "expand-less" : "expand-more"} 
          size={24} 
          color="#888" 
        />
      </Pressable>
      {expandedExercises.has(index) && (
        <View style={styles.exerciseDetails}>
          <Pressable
            style={styles.addSetButton}
            onPress={() => handleAddSet(index)}
          >
            <MaterialIcons name="add" size={24} color="#3B82F6" />
            <Text style={styles.addSetText}>Add Set</Text>
          </Pressable>
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <Text style={[styles.setNumber, styles.setNumberText]}>Set {setIndex + 1}</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={set.weight.toString()}
                  onChangeText={(text) => handleSetChange(index, setIndex, 'weight', text.replace(/[^0-9]/g, ''))}
                />
                <Text style={styles.inputLabel}>{useMetric ? 'kg' : 'lbs'}</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="numeric"
                  value={set.reps.toString()}
                  onChangeText={(text) => handleSetChange(index, setIndex, 'reps', text.replace(/[^0-9]/g, ''))}
                />
                <Text style={styles.inputLabel}>rs</Text>
              </View>
              <Pressable
                style={styles.removeSetButton}
                onPress={() => handleDeleteSet(index, setIndex)}
              >
                <MaterialIcons name="remove-circle-outline" size={24} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (splits.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Track your progress</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Calendar
              onDayPress={handleDayPress}
              theme={{
                backgroundColor: '#000',
                calendarBackground: '#000',
                textSectionTitleColor: '#fff',
                selectedDayBackgroundColor: '#3B82F6',
                selectedDayTextColor: '#fff',
                todayTextColor: '#3B82F6',
                dayTextColor: '#fff',
                textDisabledColor: '#444',
                monthTextColor: '#fff',
                arrowColor: '#3B82F6',
              }}
              style={styles.calendar}
            />
            <View style={styles.emptyState}>
              <MaterialIcons name="fitness-center" size={48} color="#888" />
              <Text style={styles.emptyStateText}>No splits yet</Text>
              <Text style={styles.emptyStateSubtext}>Create a split workout first to start tracking</Text>
            </View>
          </View>
        </ScrollView>
        <WorkoutHistoryModal
          visible={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          workoutHistory={selectedHistory}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Track your progress</Text>
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView style={styles.scrollContent}>
          <Calendar
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: '#000',
              calendarBackground: '#000',
              textSectionTitleColor: '#fff',
              selectedDayBackgroundColor: '#3B82F6',
              selectedDayTextColor: '#fff',
              todayTextColor: '#3B82F6',
              dayTextColor: '#fff',
              textDisabledColor: '#444',
              monthTextColor: '#fff',
              arrowColor: '#3B82F6',
            }}
            style={styles.calendar}
          />
          <View style={styles.pickerContainer}>
            <View style={styles.splitHeader}>
              <Text style={styles.splitTitle}>{selectedSplitName}</Text>
              <Text style={styles.dayText}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][currentDay]}
              </Text>
            </View>
          </View>
          {selectedSplit && (
            <View style={styles.splitInfo}>
              <Text style={styles.splitInfoTitle}>Today's Workout</Text>
              {currentDayWorkout.length > 0 ? (
                <>
                  {currentDayWorkout.map((exercise, index) => renderExerciseItem(exercise, index))}
                  <Pressable 
                    style={styles.saveButton}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveButtonText}>I'm done!</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.splitInfoText}>No exercises scheduled for today</Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <WorkoutHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        workoutHistory={selectedHistory}
      />
    </SafeAreaView>
  );
}

 