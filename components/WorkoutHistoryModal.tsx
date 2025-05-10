import { convertWeight, useSettingsStore } from '@/store/settings';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface WorkoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  date: string;
  exercises: {
    name: string;
    sets: { weight: string; reps: string }[];
  }[];
  useMetric?: boolean;
}

export function WorkoutHistoryModal({ visible, onClose, date, exercises, useMetric: savedUseMetric }: WorkoutHistoryModalProps) {
  const { useMetric } = useSettingsStore();
  const pan = React.useRef(new Animated.ValueXY()).current;
  const [modalHeight] = React.useState(80); // 80% of screen height

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) { // Only allow dragging down
          pan.y.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 100) { // If dragged down more than 100 units
          onClose();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  console.log('Modal received date:', date);
  // Parse the date string into year, month, and day
  const formattedDate = date ? (() => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  })() : 'No date available';
  console.log('Formatted date:', formattedDate);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderExercise = (exercise: WorkoutHistoryModalProps['exercises'][0]) => {
    return (
      <View key={exercise.name} style={styles.exerciseItem}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <View style={styles.setsList}>
          {exercise.sets.map((set, setIndex) => {
            const weight = Number(set.weight);
            const convertedWeight = savedUseMetric !== undefined ? 
              convertWeight(weight, savedUseMetric, useMetric) : 
              weight;
            
            return (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setNumber}>Set {setIndex + 1}</Text>
                <Text style={styles.setDetails}>
                  {convertedWeight.toFixed(1)} {useMetric ? 'kg' : 'lbs'} × {set.reps} reps
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: pan.y }] }
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <View style={styles.dragIndicator} />
          </View>
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Workout History</Text>
            <Text style={styles.modalDate}>{formattedDate}</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#888" />
            </Pressable>
          </View>
          
          <ScrollView style={styles.scrollView}>
            {exercises.length > 0 ? (
              <View style={styles.exercisesList}>
                {exercises.map(renderExercise)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="fitness-center" size={48} color="#888" />
                <Text style={styles.emptyStateText}>No workout recorded</Text>
                <Text style={styles.emptyStateSubtext}>You didn't work out on this day</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
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
  dragHandle: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDate: {
    color: '#888',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  exercisesList: {
    padding: 20,
    gap: 16,
  },
  exerciseItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  setsList: {
    gap: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 12,
  },
  setNumber: {
    color: '#888',
    fontSize: 14,
    width: 60,
  },
  setDetails: {
    color: '#fff',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
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
}); 