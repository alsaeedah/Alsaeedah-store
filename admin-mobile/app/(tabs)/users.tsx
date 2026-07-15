import { StyleSheet, View, Text } from 'react-native';

export default function UsersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
});
