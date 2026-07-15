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
import { ApiError, http } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";

type Product = {
  id: string;
  price: string; // Decimal Prisma sérialisé en string par l'API
  stock: number;
  minimumRequired: number;
  product: {
    name: string;
    picture?: string | null;
    brand: { name: string };
  };
  clinic: { name: string };
};

export default function BoutiqueScreen() {
  const router = useRouter();
  const { totalItems } = useCart();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products ?? [];
    return (products ?? []).filter(
      (p) =>
        p.product.name.toLowerCase().includes(query) ||
        p.product.brand.name.toLowerCase().includes(query),
    );
  }, [products, search]);

  const load = useCallback(async () => {
    try {
      const data = await http.get<Product[]>("/shop");
      setProducts(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger la boutique.");
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

  if (products === null && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#4873a2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 96, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4873a2" />
        }
        ListHeaderComponent={
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold text-gray-900">Boutique</Text>
              <TouchableOpacity
                className="flex-row items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5"
                onPress={() => router.push("/cart")}
              >
                <Text className="text-lg">🛒</Text>
                {totalItems > 0 ? (
                  <View className="bg-primary rounded-full min-w-[18px] h-[18px] items-center justify-center ml-1.5 px-1">
                    <Text className="text-white text-xs font-bold">{totalItems}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4">
              <Text className="text-gray-400 mr-2">🔍</Text>
              <TextInput
                className="flex-1 py-3 text-gray-900"
                placeholder="Rechercher un produit ou une marque..."
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
              {error || (search ? "Aucun produit ne correspond à votre recherche." : "Aucun produit disponible pour le moment.")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row bg-gray-50 rounded-2xl p-3 gap-3 border border-gray-100"
            onPress={() => router.push(`/product/${item.id}`)}
          >
            {item.product.picture ? (
              <Image
                source={{ uri: item.product.picture }}
                className="w-16 h-16 rounded-xl bg-gray-200"
              />
            ) : (
              <View className="w-16 h-16 rounded-xl bg-gray-200 items-center justify-center">
                <Text className="text-2xl">🐾</Text>
              </View>
            )}
            <View className="flex-1">
              <Text className="text-gray-900 font-semibold" numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                {item.product.brand.name} · {item.clinic.name}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-primary font-bold">{Number(item.price).toFixed(2)} €</Text>
                {item.stock <= 0 ? (
                  <View className="bg-red-50 rounded-full px-2 py-0.5">
                    <Text className="text-danger text-xs font-medium">Rupture de stock</Text>
                  </View>
                ) : item.stock <= item.minimumRequired ? (
                  <View className="bg-yellow-50 rounded-full px-2 py-0.5">
                    <Text className="text-armali-yellow text-xs font-medium">Stock limité</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
