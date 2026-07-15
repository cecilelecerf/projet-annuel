import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccueilScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 items-center justify-center bg-white px-6 pb-24"
      style={{ paddingTop: insets.top + 16 }}
    >
      <Text className="text-2xl font-bold text-primary">Bienvenue sur Armali</Text>
      <Text className="mt-2 text-center text-gray-500">
        Retrouvez ici l&apos;essentiel pour prendre soin de vos animaux.
      </Text>
    </View>
  );
}
