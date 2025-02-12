import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { Link } from "expo-router";

// Mock complaint data (replace with real data from your backend later)
const mockComplaints = [
  {
    id: "1",
    status: "Pending",
    date: "2024-03-15",
    description: "Large pothole near city center",
    location: "Main Street, Downtown"
  },
  {
    id: "2",
    status: "Resolved",
    date: "2024-03-10",
    description: "Cracked road surface",
    location: "Oak Avenue"
  },
];

export default function ComplaintScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Complaints</Text>
      
      <FlatList
        data={mockComplaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.complaintCard}>
            <View style={styles.statusRow}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'Resolved' ? '#4CAF50' : '#FF9800' }
              ]}>
                {item.status}
              </Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            
            <Text style={styles.descriptionText}>{item.description}</Text>
            <Text style={styles.locationText}>📍 {item.location}</Text>
            
            <Pressable 
              style={styles.detailsButton}
              onPress={() => console.log("View details", item.id)}>
              <Text style={styles.buttonText}>View Details</Text>
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Link href="/registerComplaint" style={styles.newComplaintButton}>
        <Text style={styles.newComplaintText}>+ New Complaint</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listContent: {
    paddingBottom: 80,
  },
  complaintCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 16,
  },
  dateText: {
    color: '#666',
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 16,
    marginBottom: 4,
    color: '#444',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  detailsButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  newComplaintButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
  },
  newComplaintText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});