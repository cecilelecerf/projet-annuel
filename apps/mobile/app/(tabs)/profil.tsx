import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth, type MobileUser } from "@/contexts/auth-context";
import { ApiError, http } from "@/lib/api";

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  clinic: { name: string };
  veterinarian: { firstname: string; lastname: string };
};

type ReviewStats = { average: number | null; count: number };

function initials(user: MobileUser) {
  return `${user.firstname[0] ?? ""}${user.lastname[0] ?? ""}`.toUpperCase();
}

export default function ProfilScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [reviewsError, setReviewsError] = useState("");

  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "otp">("idle");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const [statsData, reviewsData] = await Promise.all([
        http.get<ReviewStats>("/reviews/stats"),
        http.get<Review[]>("/reviews"),
      ]);
      setStats(statsData);
      setReviews(reviewsData);
      setReviewsError("");
    } catch (e: unknown) {
      setReviewsError(
        e instanceof ApiError ? e.message : "Impossible de charger les avis pour le moment.",
      );
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";

    setUploading(true);
    try {
      const { fileId, uploadUrl } = await http.post<{ fileId: string; uploadUrl: string }>(
        "/users/me/avatar/upload",
        { mimeType, size: asset.fileSize },
      );

      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: blob,
      });

      const updated = await http.patch<MobileUser>("/users/me/avatar/confirm", { fileId });
      updateUser(updated);
    } catch {
      // upload échoué silencieusement, l'avatar reste inchangé
    } finally {
      setUploading(false);
    }
  }

  async function handleRequestDeleteCode() {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await http.post("/auth/delete-account/request", {});
      setDeleteStep("otp");
    } catch (e: unknown) {
      setDeleteError(e instanceof ApiError ? e.message : "Une erreur est survenue.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (deleteCode.length !== 6) {
      setDeleteError("Le code doit contenir 6 chiffres.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await http.delete("/auth/delete-account", { code: deleteCode });
      await logout();
      router.replace("/login");
    } catch (e: unknown) {
      setDeleteError(e instanceof ApiError ? e.message : "Code invalide.");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (!user) return null;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 96 }}
    >
      <Text className="text-2xl font-bold text-gray-900 mb-4">Profil</Text>

      <View className="items-center mb-6">
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploading}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} className="w-20 h-20 rounded-full bg-gray-200" />
          ) : (
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-2xl font-bold">{initials(user)}</Text>
            </View>
          )}
          {uploading ? (
            <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center">
              <ActivityIndicator color="white" />
            </View>
          ) : null}
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-gray-900 mt-3">
          {user.firstname} {user.lastname}
        </Text>
        <View className="bg-blue-50 rounded-full px-3 py-0.5 mt-1">
          <Text className="text-primary text-xs font-medium">Propriétaire</Text>
        </View>
      </View>

      <View className="bg-gray-50 rounded-2xl border border-gray-100 mb-6">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <Text className="text-gray-500 text-sm">Email</Text>
          <Text className="text-gray-900 font-medium">{user.email}</Text>
        </View>
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <Text className="text-gray-500 text-sm">Prénom</Text>
          <Text className="text-gray-900 font-medium">{user.firstname}</Text>
        </View>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className="text-gray-500 text-sm">Nom</Text>
          <Text className="text-gray-900 font-medium">{user.lastname}</Text>
        </View>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-lg font-bold text-gray-900">Mes avis clients</Text>
          {stats && stats.count > 0 ? (
            <Text className="text-gray-500 text-sm">
              ⭐ {stats.average?.toFixed(1)} · {stats.count} avis
            </Text>
          ) : null}
        </View>

        {reviews === null && !reviewsError ? (
          <ActivityIndicator color="#4873a2" />
        ) : reviewsError ? (
          <Text className="text-gray-500 text-sm">{reviewsError}</Text>
        ) : (reviews ?? []).length === 0 ? (
          <Text className="text-gray-500 text-sm">Aucun avis pour le moment.</Text>
        ) : (
          <View className="gap-2">
            {(reviews ?? []).map((review) => (
              <View key={review.id} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 font-semibold text-sm">
                    Dr {review.veterinarian.firstname} {review.veterinarian.lastname}
                  </Text>
                  <Text className="text-armali-yellow text-sm">
                    {"⭐".repeat(review.rating)}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-0.5">{review.clinic.name}</Text>
                {review.comment ? (
                  <Text className="text-gray-600 text-sm mt-1">{review.comment}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        className="border border-gray-200 rounded-2xl py-3 items-center mb-3"
        onPress={() => logout()}
      >
        <Text className="text-gray-700 font-semibold text-base">Se déconnecter</Text>
      </TouchableOpacity>

      {deleteStep === "idle" ? (
        <TouchableOpacity
          className="items-center py-2"
          onPress={() => setDeleteStep("confirm")}
        >
          <Text className="text-danger text-sm font-medium">Supprimer mon compte</Text>
        </TouchableOpacity>
      ) : null}

      {deleteStep === "confirm" ? (
        <View className="bg-red-50 rounded-2xl p-4 border border-red-100 gap-3">
          <Text className="text-danger font-semibold text-sm">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </Text>
          <Text className="text-gray-600 text-xs">
            Un code de confirmation vous sera envoyé par email.
          </Text>
          {deleteError ? <Text className="text-danger text-xs">{deleteError}</Text> : null}
          <TouchableOpacity
            className="bg-danger rounded-2xl py-3 items-center"
            onPress={handleRequestDeleteCode}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-sm">
                Recevoir le code de confirmation
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteStep("idle")} className="items-center">
            <Text className="text-gray-500 text-xs">Annuler</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {deleteStep === "otp" ? (
        <View className="bg-red-50 rounded-2xl p-4 border border-red-100 gap-3">
          <Text className="text-gray-700 text-sm">
            Entrez le code à 6 chiffres reçu par email :
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900"
            placeholder="123456"
            placeholderTextColor="#9ca3af"
            value={deleteCode}
            onChangeText={setDeleteCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          {deleteError ? <Text className="text-danger text-xs">{deleteError}</Text> : null}
          <TouchableOpacity
            className="bg-danger rounded-2xl py-3 items-center"
            onPress={handleConfirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-sm">
                Supprimer définitivement mon compte
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteStep("idle")} className="items-center">
            <Text className="text-gray-500 text-xs">Annuler</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}
