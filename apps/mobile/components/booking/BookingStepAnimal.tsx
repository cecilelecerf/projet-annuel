import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ApiError, http } from "@/lib/api";
import { BookingAnimal, REASON_CHIPS, Speciality } from "@/lib/booking-types";

type Props = {
  selectedAnimal: BookingAnimal | null;
  onSelectAnimal: (animal: BookingAnimal) => void;
  specialityId: string | null;
  onSelectSpeciality: (id: string | null) => void;
  reason: string;
  onChangeReason: (reason: string) => void;
};

export default function BookingStepAnimal({
  selectedAnimal,
  onSelectAnimal,
  specialityId,
  onSelectSpeciality,
  reason,
  onChangeReason,
}: Props) {
  const [animals, setAnimals] = useState<BookingAnimal[] | null>(null);
  const [specialities, setSpecialities] = useState<Speciality[]>([]);
  const [error, setError] = useState("");
  const [customReason, setCustomReason] = useState(
    REASON_CHIPS.includes(reason as (typeof REASON_CHIPS)[number]) ? "" : reason,
  );
  const [showCustom, setShowCustom] = useState(reason === "Autre" || (!!reason && !REASON_CHIPS.includes(reason as (typeof REASON_CHIPS)[number])));

  const load = useCallback(async () => {
    try {
      const [animalsData, specialitiesData] = await Promise.all([
        http.get<BookingAnimal[]>("/animals"),
        http.get<Speciality[]>("/specialities"),
      ]);
      setAnimals(animalsData);
      setSpecialities(specialitiesData);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger vos animaux.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleChip(chip: string) {
    if (chip === "Autre") {
      setShowCustom(true);
      onChangeReason(customReason);
      return;
    }
    setShowCustom(false);
    onChangeReason(reason === chip ? "" : chip);
  }

  if (animals === null) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#4873a2" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-gray-900">Pour quel animal ?</Text>
        <Text className="text-gray-500 text-sm mt-1">
          Sélectionnez l&apos;animal concerné par ce rendez-vous.
        </Text>
      </View>

      {error ? <Text className="text-danger text-sm">{error}</Text> : null}

      {animals.length === 0 ? (
        <Text className="text-gray-500 text-center">
          Vous n&apos;avez pas encore d&apos;animal enregistré.
        </Text>
      ) : (
        <View className="gap-2">
          {animals.map((animal) => {
            const selected = selectedAnimal?.id === animal.id;
            return (
              <TouchableOpacity
                key={animal.id}
                className={`flex-row items-center gap-3 rounded-2xl p-3 border ${
                  selected ? "border-primary bg-blue-50" : "border-gray-100 bg-gray-50"
                }`}
                onPress={() => onSelectAnimal(animal)}
              >
                <Text className="text-2xl">🐾</Text>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{animal.name}</Text>
                  <Text className="text-gray-500 text-xs">
                    {animal.race.pet.name} · {animal.race.name}
                  </Text>
                </View>
                {selected ? <Text className="text-primary text-lg">✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View>
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-gray-900 font-semibold">Motif de la visite</Text>
          <View className="bg-gray-100 rounded-full px-2 py-0.5">
            <Text className="text-gray-500 text-xs">facultatif</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {REASON_CHIPS.map((chip) => {
            const active = chip === "Autre" ? showCustom : reason === chip;
            return (
              <TouchableOpacity
                key={chip}
                className={`rounded-full px-3 py-1.5 border ${
                  active ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
                }`}
                onPress={() => handleChip(chip)}
              >
                <Text className={active ? "text-white text-sm" : "text-gray-700 text-sm"}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {showCustom ? (
          <TextInput
            className="border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 bg-gray-50 mt-2"
            placeholder="Décrivez le motif..."
            placeholderTextColor="#9ca3af"
            value={customReason}
            onChangeText={(text) => {
              setCustomReason(text);
              onChangeReason(text);
            }}
            multiline
            numberOfLines={2}
          />
        ) : null}
      </View>

      <View>
        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-gray-900 font-semibold">Spécialité souhaitée</Text>
          <View className="bg-gray-100 rounded-full px-2 py-0.5">
            <Text className="text-gray-500 text-xs">facultatif</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          <TouchableOpacity
            className={`rounded-full px-3 py-1.5 border ${
              specialityId === null ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
            }`}
            onPress={() => onSelectSpeciality(null)}
          >
            <Text className={specialityId === null ? "text-white text-sm" : "text-gray-700 text-sm"}>
              Toutes les spécialités
            </Text>
          </TouchableOpacity>
          {specialities.map((s) => (
            <TouchableOpacity
              key={s.id}
              className={`rounded-full px-3 py-1.5 border ${
                specialityId === s.id ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
              }`}
              onPress={() => onSelectSpeciality(s.id)}
            >
              <Text className={specialityId === s.id ? "text-white text-sm" : "text-gray-700 text-sm"}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
