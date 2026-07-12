import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, SectionList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, http } from "@/lib/api";

type AnimalMeeting = {
  animal: { name: string };
  speciality: { name: string } | null;
  meeting: { id: string; date: string; startTime: string };
  veterinarianClinic: {
    clinic: { name: string };
    veterinarian: { firstname: string; lastname: string };
  } | null;
};

// Les colonnes Prisma @db.Date/@db.Time sont sérialisées en UTC peu importe le
// fuseau du serveur : on lit les deux en UTC puis on construit un Date local
// avec ces valeurs, pour que l'heure affichée ne dépende pas du fuseau de l'appareil.
function meetingDateTime(m: AnimalMeeting): Date {
  const d = new Date(m.meeting.date);
  const t = new Date(m.meeting.startTime);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), t.getUTCHours(), t.getUTCMinutes(), 0, 0);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function filterMeetings(meetings: AnimalMeeting[], search: string): AnimalMeeting[] {
  const query = search.trim().toLowerCase();
  if (!query) return meetings;
  return meetings.filter((m) => {
    const vetName = m.veterinarianClinic
      ? `${m.veterinarianClinic.veterinarian.firstname} ${m.veterinarianClinic.veterinarian.lastname}`
      : "";
    return (
      m.animal.name.toLowerCase().includes(query) ||
      m.speciality?.name.toLowerCase().includes(query) ||
      m.veterinarianClinic?.clinic.name.toLowerCase().includes(query) ||
      vetName.toLowerCase().includes(query)
    );
  });
}

export default function RendezVousScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [meetings, setMeetings] = useState<AnimalMeeting[] | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await http.get<AnimalMeeting[]>(`/users/${user.id}/animal-meetings`);
      setMeetings(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger vos rendez-vous.");
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (meetings === null && !error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#4873a2" />
      </View>
    );
  }

  const now = new Date();
  const filtered = filterMeetings(meetings ?? [], search);
  const upcoming = filtered
    .filter((m) => meetingDateTime(m) >= now)
    .sort((a, b) => meetingDateTime(a).getTime() - meetingDateTime(b).getTime());
  const past = filtered
    .filter((m) => meetingDateTime(m) < now)
    .sort((a, b) => meetingDateTime(b).getTime() - meetingDateTime(a).getTime());

  const sections = [
    ...(upcoming.length ? [{ title: "À venir", data: upcoming }] : []),
    ...(past.length ? [{ title: "Passés", data: past }] : []),
  ];

  return (
    <View className="flex-1 bg-white">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.meeting.id}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: 96, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4873a2" />
        }
        ListHeaderComponent={
          <View className="mb-2">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-2xl font-bold text-gray-900">Rendez-vous</Text>
              <TouchableOpacity
                className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                onPress={() => router.push("/booking")}
              >
                <Text className="text-white text-lg font-bold">+</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4">
              <Text className="text-gray-400 mr-2">🔍</Text>
              <TextInput
                className="flex-1 py-3 text-gray-900"
                placeholder="Rechercher un animal, spécialité, clinique..."
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
              {error ||
                (search
                  ? "Aucun rendez-vous ne correspond à votre recherche."
                  : "Vous n'avez pas encore de rendez-vous.")}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text className="text-gray-500 font-semibold text-sm mt-4 mb-2">{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const dt = meetingDateTime(item);
          return (
            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100 gap-1 mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-900 font-semibold">{item.animal.name}</Text>
                <Text className="text-primary font-bold text-sm">{formatTime(dt)}</Text>
              </View>
              <Text className="text-gray-500 text-xs capitalize">{formatDate(dt)}</Text>
              {item.veterinarianClinic ? (
                <Text className="text-gray-600 text-sm mt-1">
                  Dr {item.veterinarianClinic.veterinarian.firstname}{" "}
                  {item.veterinarianClinic.veterinarian.lastname} ·{" "}
                  {item.veterinarianClinic.clinic.name}
                </Text>
              ) : null}
              {item.speciality ? (
                <Text className="text-gray-400 text-xs">{item.speciality.name}</Text>
              ) : null}
            </View>
          );
        }}
      />
    </View>
  );
}
