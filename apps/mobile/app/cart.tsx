import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "@/contexts/cart-context";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice, clear } = useCart();

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-gray-500 text-center mb-4">Votre panier est vide.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-semibold">Retour à la boutique</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
        ListHeaderComponent={
          <Text className="text-2xl font-bold text-gray-900 mb-2">Mon panier</Text>
        }
        renderItem={({ item }) => (
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 font-semibold flex-1" numberOfLines={1}>
                {item.productName}
              </Text>
              <TouchableOpacity onPress={() => removeItem(item.productId)}>
                <Text className="text-danger text-sm">Retirer</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-xs">
              {item.brandName} · {item.clinicName}
            </Text>

            <View className="flex-row items-center justify-between mt-1">
              <View className="flex-row items-center border border-gray-200 rounded-xl">
                <TouchableOpacity
                  className="px-3 py-1.5"
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Text className="text-lg text-gray-700">−</Text>
                </TouchableOpacity>
                <Text className="px-3 text-gray-900 font-semibold">{item.quantity}</Text>
                <TouchableOpacity
                  className="px-3 py-1.5"
                  onPress={() =>
                    updateQuantity(item.productId, Math.min(item.maxStock, item.quantity + 1))
                  }
                >
                  <Text className="text-lg text-gray-700">+</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-primary font-bold">
                {(item.price * item.quantity).toFixed(2)} €
              </Text>
            </View>
          </View>
        )}
      />

      <View className="px-6 py-4 border-t border-gray-100 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-500">Total</Text>
          <Text className="text-gray-900 text-xl font-bold">{totalPrice.toFixed(2)} €</Text>
        </View>
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center shadow-md"
          onPress={() => {
            clear();
            router.back();
          }}
        >
          <Text className="text-white font-semibold text-base">Passer commande</Text>
        </TouchableOpacity>
        <Text className="text-gray-400 text-xs text-center">
          Paiement non connecté pour l&apos;instant — front uniquement.
        </Text>
      </View>
    </View>
  );
}
