import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import type {
  AnimalDetail,
  AnimalMeetingWithMeeting,
  MedicalHistoryMeta,
  VaccineMeta,
} from "@armali/schemas";
import { ApiError, http } from "@/lib/api";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function ageLabel(dateOfBirth: Date | string) {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${months} mois`;
  if (months === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
}

const VACCINE_STATUS_LABEL: Record<VaccineMeta["status"], string> = {
  UP_TO_DATE: "À jour",
  OVERDUE: "En retard",
  MANDATORY_MISSING: "Obligatoire manquant",
  RECOMMENDED_MISSING: "Recommandé manquant",
  NOT_APPLICABLE: "Non applicable",
};

const VACCINE_STATUS_STYLE: Record<VaccineMeta["status"], { bg: string; text: string }> = {
  UP_TO_DATE: { bg: "bg-green-50", text: "text-success" },
  OVERDUE: { bg: "bg-red-50", text: "text-danger" },
  MANDATORY_MISSING: { bg: "bg-red-50", text: "text-danger" },
  RECOMMENDED_MISSING: { bg: "bg-yellow-50", text: "text-armali-yellow" },
  NOT_APPLICABLE: { bg: "bg-gray-100", text: "text-gray-500" },
};

type Tab = "acts" | "vaccines" | "conditions";

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<AnimalDetail | null>(null);
  const [meetings, setMeetings] = useState<AnimalMeetingWithMeeting[]>([]);
  const [vaccines, setVaccines] = useState<VaccineMeta[]>([]);
  const [medicalHistories, setMedicalHistories] = useState<MedicalHistoryMeta[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("acts");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [animalData, meetingsData, vaccinesData, historiesData] = await Promise.all([
        http.get<AnimalDetail>(`/animals/${id}`),
        http.get<AnimalMeetingWithMeeting[]>(`/animals/${id}/animal-meetings`),
        http.get<VaccineMeta[]>(`/animals/${id}/vaccines`),
        http.get<MedicalHistoryMeta[]>(`/animals/${id}/medical-histories`),
      ]);
      setAnimal(animalData);
      setMeetings(meetingsData);
      setVaccines(vaccinesData);
      setMedicalHistories(historiesData);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger cet animal.");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePickPhoto() {
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
        `/animals/${id}/photo/upload`,
        { mimeType, size: asset.fileSize },
      );

      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
        body: blob,
      });

      const updated = await http.patch<{ photoUrl: string | null }>(
        `/animals/${id}/photo/confirm`,
        { fileId },
      );
      setAnimal((prev) => (prev ? { ...prev, photoUrl: updated.photoUrl } : prev));
    } catch {
      // upload échoué silencieusement, la photo reste inchangée
    } finally {
      setUploading(false);
    }
  }

  if (!animal) {
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

  const weightPoints = meetings
    .filter((m) => m.petWeight != null)
    .sort((a, b) => new Date(a.meeting.date).getTime() - new Date(b.meeting.date).getTime())
    .map((m) => ({ date: m.meeting.date, weight: Number(m.petWeight) }));
  const lastWeight = weightPoints.length ? `${weightPoints[weightPoints.length - 1].weight} kg` : "—";

  const sizePoints = meetings
    .filter((m) => m.petSize != null)
    .sort((a, b) => new Date(a.meeting.date).getTime() - new Date(b.meeting.date).getTime());
  const lastSize = sizePoints.length ? `${Number(sizePoints[sizePoints.length - 1].petSize)} cm` : "—";

  const overdueVaccines = vaccines.filter((v) => !v.isUpToDate).length;
  const maxWeight = Math.max(...weightPoints.map((p) => p.weight), 1);
  const minWeight = Math.min(...weightPoints.map((p) => p.weight), 0);

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}>
      {/* Profile card */}
      <View className="items-center bg-gray-50 border border-gray-100 rounded-2xl p-6 gap-1">
        <TouchableOpacity onPress={handlePickPhoto} disabled={uploading} className="mb-2">
          {animal.photoUrl ? (
            <Image source={{ uri: animal.photoUrl }} className="w-16 h-16 rounded-full bg-gray-200" />
          ) : (
            <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center">
              <Text className="text-success text-2xl font-bold">{animal.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {uploading ? (
            <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center">
              <ActivityIndicator color="white" />
            </View>
          ) : null}
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">{animal.name}</Text>
        <Text className="text-gray-500 text-xs">
          {animal.race.pet.name} · {animal.race.name}
        </Text>

        <View className="w-full mt-4 gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 text-xs">Âge</Text>
            <Text className="text-gray-900 font-semibold text-xs">{ageLabel(animal.dateOfBirth)}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 text-xs">Poids</Text>
            <Text className="text-gray-900 font-semibold text-xs">{lastWeight}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500 text-xs">Taille</Text>
            <Text className="text-gray-900 font-semibold text-xs">{lastSize}</Text>
          </View>
          {animal.activity ? (
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500 text-xs">Activité</Text>
              <Text className="text-armali-yellow text-xs">
                {"★".repeat(Math.round(animal.activity / 2))}
                {"☆".repeat(5 - Math.round(animal.activity / 2))}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Owner / referring vet */}
      {animal.client ? (
        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl p-3 gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
            <Text className="text-primary font-bold">{animal.client.user.firstname.charAt(0)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-sm">
              {animal.client.user.firstname} {animal.client.user.lastname}
            </Text>
            <Text className="text-gray-500 text-xs">Propriétaire</Text>
          </View>
        </View>
      ) : null}
      {animal.attendingVeterinarianClinic ? (
        <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl p-3 gap-3">
          <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
            <Text className="text-primary font-bold">
              {animal.attendingVeterinarianClinic.veterinarian.user.firstname.charAt(0)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold text-sm">
              Dr. {animal.attendingVeterinarianClinic.veterinarian.user.lastname}
            </Text>
            <Text className="text-gray-500 text-xs">Vétérinaire référent</Text>
          </View>
        </View>
      ) : null}

      {/* Description */}
      {animal.description ? (
        <View className="gap-1">
          <Text className="text-gray-500 text-xs uppercase font-semibold">Description</Text>
          <Text className="text-gray-700 text-sm">{animal.description}</Text>
        </View>
      ) : null}

      {/* Stats */}
      <View className="flex-row flex-wrap gap-2">
        <View className="flex-1 min-w-[45%] items-center bg-gray-50 border border-gray-100 rounded-2xl py-4">
          <Text className="text-2xl font-bold text-gray-900">{meetings.length}</Text>
          <Text className="text-gray-500 text-[10px] uppercase mt-1">Rendez-vous</Text>
        </View>
        <View className="flex-1 min-w-[45%] items-center bg-gray-50 border border-gray-100 rounded-2xl py-4">
          <Text className="text-2xl font-bold text-gray-900">{vaccines.length}</Text>
          <Text className="text-gray-500 text-[10px] uppercase mt-1">Vaccins</Text>
        </View>
        <View className="flex-1 min-w-[45%] items-center bg-gray-50 border border-gray-100 rounded-2xl py-4">
          <Text className="text-2xl font-bold text-gray-900">{animal.animalConditionHealths?.length ?? 0}</Text>
          <Text className="text-gray-500 text-[10px] uppercase mt-1">Conditions</Text>
        </View>
        <View className="flex-1 min-w-[45%] items-center bg-gray-50 border border-gray-100 rounded-2xl py-4">
          <Text className="text-2xl font-bold text-danger">{overdueVaccines}</Text>
          <Text className="text-danger text-[10px] uppercase mt-1">À renouveler</Text>
        </View>
      </View>

      {/* Weight chart */}
      {weightPoints.length > 1 ? (
        <View className="gap-2">
          <Text className="text-gray-500 text-xs uppercase font-semibold">Évolution du poids</Text>
          <View className="flex-row items-end gap-2 bg-gray-50 border border-gray-100 rounded-2xl p-4 h-32">
            {weightPoints.map((point, index) => {
              const range = maxWeight - minWeight || 1;
              const heightPct = 20 + ((point.weight - minWeight) / range) * 80;
              return (
                <View key={index} className="flex-1 items-center justify-end h-full">
                  <Text className="text-gray-900 text-[9px] font-semibold mb-1">{point.weight}</Text>
                  <View
                    className="w-full bg-primary rounded-t-md"
                    style={{ height: `${heightPct}%` }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Tabs */}
      <View className="gap-3">
        <View className="flex-row bg-gray-100 rounded-2xl p-1">
          {(
            [
              { key: "acts", label: "Actes", count: medicalHistories.length },
              { key: "vaccines", label: "Vaccination", count: vaccines.length },
              { key: "conditions", label: "Conditions", count: animal.animalConditionHealths?.length ?? 0 },
            ] as { key: Tab; label: string; count: number }[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 items-center py-2 rounded-xl ${activeTab === tab.key ? "bg-white" : ""}`}
            >
              <Text
                className={`text-xs font-semibold ${activeTab === tab.key ? "text-primary" : "text-gray-500"}`}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "acts" ? (
          medicalHistories.length ? (
            <View className="gap-2">
              {medicalHistories.map((history) => (
                <View key={history.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-semibold text-sm flex-1" numberOfLines={1}>
                      {history.act?.name ?? history.clinicAct?.act?.name ?? "Acte"}
                    </Text>
                    <Text className="text-primary font-bold text-sm">
                      {Number(history.priceApplied).toFixed(2)} €
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs mt-0.5">{formatDate(history.performedAt)}</Text>
                  {history.notes ? (
                    <Text className="text-gray-600 text-xs mt-1">{history.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-400 text-xs italic text-center py-4">Aucun acte réalisé</Text>
          )
        ) : null}

        {activeTab === "vaccines" ? (
          vaccines.length ? (
            <View className="gap-2">
              {vaccines.map((vaccine, index) => (
                <View key={vaccine.id ?? index} className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-semibold text-sm flex-1" numberOfLines={1}>
                      {vaccine.vaccine?.act?.name ?? "Vaccin"}
                    </Text>
                    <View
                      className={`rounded-full px-2 py-0.5 ${(VACCINE_STATUS_STYLE[vaccine.status] ?? VACCINE_STATUS_STYLE.NOT_APPLICABLE).bg}`}
                    >
                      <Text
                        className={`text-[10px] font-medium ${(VACCINE_STATUS_STYLE[vaccine.status] ?? VACCINE_STATUS_STYLE.NOT_APPLICABLE).text}`}
                      >
                        {VACCINE_STATUS_LABEL[vaccine.status] ?? vaccine.status}
                      </Text>
                    </View>
                  </View>
                  {vaccine.nextDue ? (
                    <Text className="text-gray-500 text-xs mt-0.5">
                      Prochain rappel : {formatDate(vaccine.nextDue)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-400 text-xs italic text-center py-4">Aucun vaccin enregistré</Text>
          )
        ) : null}

        {activeTab === "conditions" ? (
          animal.animalConditionHealths?.length ? (
            <View className="gap-2">
              {animal.animalConditionHealths.map((condition) => (
                <View key={condition.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                  <Text className="text-gray-900 font-semibold text-sm">
                    {condition.healthCondition?.name ?? "Condition de santé"}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-0.5">
                    Diagnostiqué le {formatDate(condition.diagnosedAt)}
                  </Text>
                  {condition.notes ? (
                    <Text className="text-gray-600 text-xs mt-1">{condition.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-400 text-xs italic text-center py-4">Aucune condition de santé enregistrée</Text>
          )
        ) : null}
      </View>

      {/* Meetings */}
      <View className="gap-2">
        <Text className="text-gray-500 text-xs uppercase font-semibold">Rendez-vous</Text>
        {meetings.length ? (
          meetings
            .slice()
            .sort((a, b) => new Date(b.meeting.date).getTime() - new Date(a.meeting.date).getTime())
            .map((meeting, index) => (
              <View key={index} className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-900 font-semibold text-sm">{formatDate(meeting.meeting.date)}</Text>
                  {meeting.speciality ? (
                    <Text className="text-primary text-xs font-medium">{meeting.speciality.name}</Text>
                  ) : null}
                </View>
                <Text className="text-gray-500 text-xs mt-0.5">
                  Dr. {meeting.veterinarianClinic.veterinarian.lastname} · {meeting.veterinarianClinic.clinic.name}
                </Text>
                {meeting.description ? (
                  <Text className="text-gray-600 text-xs mt-1">{meeting.description}</Text>
                ) : null}
              </View>
            ))
        ) : (
          <Text className="text-gray-400 text-xs italic text-center py-4">Aucun rendez-vous</Text>
        )}
      </View>
    </ScrollView>
  );
}
