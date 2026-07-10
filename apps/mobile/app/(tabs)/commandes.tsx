import { Text, View } from "react-native";

export default function CommandesScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6 pb-24">
      <Text className="text-2xl font-bold text-gray-900">Mes commandes</Text>
      <Text className="mt-2 text-center text-gray-500">
        L&apos;historique de vos commandes apparaîtra ici.
      </Text>
    </View>
  );
}
