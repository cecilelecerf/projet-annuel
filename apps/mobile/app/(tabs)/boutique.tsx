import { Text, View } from "react-native";

export default function BoutiqueScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6 pb-24">
      <Text className="text-2xl font-bold text-gray-900">Boutique</Text>
      <Text className="mt-2 text-center text-gray-500">
        Les produits pour vos animaux arriveront bientôt ici.
      </Text>
    </View>
  );
}
