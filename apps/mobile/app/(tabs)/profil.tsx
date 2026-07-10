import { Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/contexts/auth-context";

export default function ProfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 pb-24">
      <Text className="text-2xl font-bold text-gray-900">Profil</Text>
      {user ? (
        <Text className="mt-2 text-center text-gray-500">
          {user.firstname} {user.lastname} · {user.email}
        </Text>
      ) : null}
      <Text className="mt-2 text-center text-gray-500">
        Vos informations personnelles arrivent bientôt ici.
      </Text>

      <TouchableOpacity
        className="bg-danger rounded-xl py-3 px-6 items-center mt-8"
        onPress={() => logout()}
      >
        <Text className="text-white font-semibold text-base">Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}
