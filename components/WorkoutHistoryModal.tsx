import { useSettingsStore } from '@/store/settings';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface WorkoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  workoutHistory: {
    date: string;
    exercises: {
      name: string;
      sets: { weight: string; reps: string; unit: string }[];
    }[];
  } | null;
}

export function WorkoutHistoryModal({ visible, onClose, workoutHistory }: WorkoutHistoryModalProps) {
  const { useMetric } = useSettingsStore();
  const pan = React.useRef(new Animated.ValueXY()).current;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date available';
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const convertWeight = (weight: number, fromUnit: string, toMetric: boolean): number => {
    if (fromUnit === 'kg' && !toMetric) {
      // Convert kg to lbs
      return weight * 2.20462;
    } else if (fromUnit === 'lbs' && toMetric) {
      // Convert lbs to kg
      return weight / 2.20462;
    }
    return weight;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Workout History</Text>
            <Text style={styles.modalDate}>{formatDate(workoutHistory?.date || '')}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
          </View>
          <ScrollView style={styles.exercisesList}>
            {workoutHistory?.exercises && workoutHistory.exercises.length > 0 ? (
              workoutHistory.exercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.sets.map((set, setIndex) => {
                    const weight = Number(set.weight);
                    const convertedWeight = convertWeight(weight, set.unit, useMetric);
                    return (
                      <View key={setIndex} style={styles.setItem}>
                        <Text style={styles.setText}>
                          Set {setIndex + 1}: {convertedWeight.toFixed(1)} {useMetric ? 'kg' : 'lbs'} x {set.reps} reps
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))
            ) : (
              <Text style={styles.noWorkoutText}>No workout recorded for this day</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#232323',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalDate: {
    color: '#888',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 16,
    padding: 4,
  },
  exercisesList: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  exerciseItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  setItem: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 12,
  },
  setText: {
    color: '#fff',
    fontSize: 16,
  },
  noWorkoutText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
}); 