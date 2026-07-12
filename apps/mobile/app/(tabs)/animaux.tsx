import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import type { AnimalWithRaceMeta } from "@armali/schemas";
import { ApiError, http } from "@/lib/api";

export default function AnimauxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [animals, setAnimals] = useState<AnimalWithRaceMeta[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAnimals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return animals ?? [];
    return (animals ?? []).filter(
      (a) =>
        a.name.toLowerCase().includes(query) ||
        a.race.name.toLowerCase().includes(query) ||
        a.race.pet.name.toLowerCase().includes(query),
    );
  }, [animals, search]);

  const load = useCallback(async () => {
    try {
      const data = await http.get<AnimalWithRaceMeta[]>("/animals");
      setAnimals(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger vos animaux.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (animals === null && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#4873a2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filteredAnimals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 96, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4873a2" />
        }
        ListHeaderComponent={
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold text-gray-900">Mes animaux</Text>
            </View>

            <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4">
              <Text className="text-gray-400 mr-2">🔍</Text>
              <TextInput
                className="flex-1 py-3 text-gray-900"
                placeholder="Rechercher un animal, une race..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Text className="text-gray-400 text-lg px-1">×</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-16">
            <Text className="text-gray-500 text-center">
              {error || (search ? "Aucun animal ne correspond à votre recherche." : "Aucun animal enregistré pour le moment.")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center bg-gray-50 rounded-2xl p-3 gap-3 border border-gray-100"
            onPress={() => router.push({ pathname: "/animaux/[id]", params: { id: item.id } })}
          >
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} className="w-14 h-14 rounded-full bg-gray-200" />
            ) : (
              <View className="w-14 h-14 rounded-full bg-green-50 items-center justify-center">
                <Text className="text-primary text-xl font-bold">{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                {item.race.pet.name} · {item.race.name}
              </Text>
            </View>
            <Text className="text-gray-300 text-lg">›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
