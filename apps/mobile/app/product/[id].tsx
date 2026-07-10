import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ApiError, http } from "@/lib/api";
import { useCart } from "@/contexts/cart-context";

type Product = {
  id: string;
  price: string; // Decimal Prisma sérialisé en string par l'API
  stock: number;
  minimumRequired: number;
  product: {
    name: string;
    description?: string | null;
    picture?: string | null;
    brand: { name: string };
  };
  clinic: { name: string };
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await http.get<Product>(`/shop/${id}`);
      setProduct(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger ce produit.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        {error ? (
          <Text className="text-gray-500 text-center">{error}</Text>
        ) : (
          <ActivityIndicator color="#4873a2" />
        )}
      </View>
    );
  }

  const outOfStock = product.stock <= 0;
  const price = Number(product.price);

  function handleAdd() {
    if (!product) return;
    addItem(
      {
        productId: product.id,
        productName: product.product.name,
        brandName: product.product.brand.name,
        clinicName: product.clinic.name,
        price,
        picture: product.product.picture,
        maxStock: product.stock,
      },
      quantity,
    );
    setAdded(true);
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 40 }}>
      {product.product.picture ? (
        <Image source={{ uri: product.product.picture }} className="w-full h-64 bg-gray-100" />
      ) : (
        <View className="w-full h-64 bg-gray-100 items-center justify-center">
          <Text className="text-6xl">🐾</Text>
        </View>
      )}

      <View className="px-6 pt-6 gap-1">
        <Text className="text-gray-500 font-medium">{product.product.brand.name}</Text>
        <Text className="text-2xl font-bold text-gray-900">{product.product.name}</Text>
        <Text className="text-gray-500 text-sm">Vendu par {product.clinic.name}</Text>

        {product.product.description ? (
          <Text className="text-gray-600 mt-3">{product.product.description}</Text>
        ) : null}

        <Text className="text-primary text-2xl font-bold mt-4">{price.toFixed(2)} €</Text>

        {outOfStock ? (
          <View className="bg-red-50 rounded-2xl py-3 items-center mt-6">
            <Text className="text-danger font-semibold">Rupture de stock</Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-center gap-4 mt-6">
              <Text className="text-gray-900 font-medium">Quantité</Text>
              <View className="flex-row items-center border border-gray-200 rounded-xl">
                <TouchableOpacity
                  className="px-4 py-2"
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Text className="text-lg text-gray-700">−</Text>
                </TouchableOpacity>
                <Text className="px-3 text-gray-900 font-semibold">{quantity}</Text>
                <TouchableOpacity
                  className="px-4 py-2"
                  onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                >
                  <Text className="text-lg text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 items-center mt-6 shadow-md"
              onPress={handleAdd}
            >
              <Text className="text-white font-semibold text-base">
                {added ? "Ajouté ✓" : "Ajouter au panier"}
              </Text>
            </TouchableOpacity>

            {added ? (
              <TouchableOpacity onPress={() => router.push("/cart")} className="items-center mt-3">
                <Text className="text-primary font-medium text-sm">Voir le panier</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </ScrollView>
  );
}
