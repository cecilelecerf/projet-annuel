import { Text, View } from "react-native";

export default function RendezVousScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6 pb-24">
      <Text className="text-2xl font-bold text-gray-900">Rendez-vous</Text>
      <Text className="mt-2 text-center text-gray-500">
        Vos rendez-vous vétérinaires apparaîtront ici.
      </Text>
    </View>
  );
}
