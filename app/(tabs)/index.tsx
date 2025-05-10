import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForYouScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>For You</Text>
      </View>
      <Calendar
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
  calendar: {
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 16,
  },
});
