import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ApiError, http } from "@/lib/api";

type OrderStatus = "PENDING" | "CONFIRMED" | "READY" | "PICKED_UP" | "CANCELLED";

type Order = {
  id: string;
  status: OrderStatus;
  pickupCode?: string | null;
  createdAt: string;
  clinic: { name: string };
  orderItems: {
    id: string;
    quantity: number;
    unitPrice: string; // Decimal Prisma sérialisé en string par l'API
    productClinic: { product: { name: string } };
  }[];
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "En attente de paiement",
  CONFIRMED: "Confirmée",
  READY: "Prête à récupérer",
  PICKED_UP: "Récupérée",
  CANCELLED: "Annulée",
};

const STATUS_COLOR: Record<OrderStatus, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-armali-yellow" },
  CONFIRMED: { bg: "bg-blue-50", text: "text-primary" },
  READY: { bg: "bg-green-50", text: "text-success" },
  PICKED_UP: { bg: "bg-gray-100", text: "text-gray-600" },
  CANCELLED: { bg: "bg-red-50", text: "text-danger" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function CommandesScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await http.get<Order[]>("/orders/mine");
      setOrders(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger vos commandes.");
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

  if (orders === null && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#4873a2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={orders ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 96, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4873a2" />
        }
        ListHeaderComponent={
          <Text className="text-2xl font-bold text-gray-900 mb-2">Mes commandes</Text>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-16">
            <Text className="text-gray-500 text-center">
              {error || "Vous n'avez pas encore passé de commande."}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const total = item.orderItems.reduce(
            (sum, i) => sum + Number(i.unitPrice) * i.quantity,
            0,
          );
          const statusStyle = STATUS_COLOR[item.status];
          return (
            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold">{item.clinic.name}</Text>
                <View className={`${statusStyle.bg} rounded-full px-2 py-0.5`}>
                  <Text className={`${statusStyle.text} text-xs font-medium`}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <Text className="text-gray-500 text-xs">{formatDate(item.createdAt)}</Text>

              <View className="gap-0.5 mt-1">
                {item.orderItems.map((oi) => (
                  <Text key={oi.id} className="text-gray-600 text-sm">
                    {oi.quantity} × {oi.productClinic.product.name}
                  </Text>
                ))}
              </View>

              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-primary font-bold">{total.toFixed(2)} €</Text>
                {item.pickupCode ? (
                  <Text className="text-gray-500 text-xs">Code : {item.pickupCode}</Text>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
