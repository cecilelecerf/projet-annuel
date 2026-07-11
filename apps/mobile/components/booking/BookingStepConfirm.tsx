import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ApiError, http } from "@/lib/api";
import { BookingAnimal, BookingClinic, BookingSlot, BookingVet } from "@/lib/booking-types";

type Props = {
  animal: BookingAnimal;
  clinic: BookingClinic;
  vet: BookingVet;
  slot: BookingSlot;
  specialityId: string | null;
  reason: string;
  onConfirmed: () => void;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCHours()}h${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

export default function BookingStepConfirm({
  animal,
  clinic,
  vet,
  slot,
  specialityId,
  reason,
  onConfirmed,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setConfirming(true);
    setError("");
    try {
      await http.post("/meetings/animals", {
        animalId: animal.id,
        veterinarianId: vet.id,
        clinicId: clinic.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        specialityId: specialityId ?? null,
        description: reason || null,
      });
      setConfirmed(true);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setConfirming(false);
    }
  }

  if (confirmed) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-6xl mb-4">✅</Text>
        <Text className="text-xl font-bold text-gray-900 text-center">Rendez-vous confirmé !</Text>
        <Text className="text-gray-500 text-center mt-2">
          Un email de confirmation a été envoyé. Vous pouvez retrouver ce rendez-vous dans votre
          espace.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 px-8 items-center mt-8 shadow-md"
          onPress={onConfirmed}
        >
          <Text className="text-white font-semibold text-base">Voir mes rendez-vous</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-bold text-gray-900">Confirmez votre rendez-vous</Text>

      <View className="bg-gray-50 rounded-2xl border border-gray-100 p-4 gap-3">
        <View>
          <Text className="text-gray-500 text-xs">Animal</Text>
          <Text className="text-gray-900 font-semibold">{animal.name}</Text>
          <Text className="text-gray-500 text-xs">
            {animal.race.pet.name} · {animal.race.name}
          </Text>
        </View>
        <View className="h-px bg-gray-200" />
        <View>
          <Text className="text-gray-500 text-xs">Clinique</Text>
          <Text className="text-gray-900 font-semibold">{clinic.name}</Text>
          <Text className="text-gray-500 text-xs">{clinic.address}</Text>
        </View>
        <View className="h-px bg-gray-200" />
        <View>
          <Text className="text-gray-500 text-xs">Vétérinaire</Text>
          <Text className="text-gray-900 font-semibold">
            Dr {vet.user.firstname} {vet.user.lastname}
          </Text>
          <Text className="text-gray-500 text-xs">
            {vet.specialities.map((s) => s.name).join(", ")}
          </Text>
        </View>
        <View className="h-px bg-gray-200" />
        <View>
          <Text className="text-gray-500 text-xs">Date &amp; heure</Text>
          <Text className="text-gray-900 font-semibold capitalize">{formatDate(slot.date)}</Text>
          <Text className="text-gray-500 text-xs">
            {formatTime(slot.startTime)} — {formatTime(slot.endTime)}
          </Text>
        </View>
        {reason ? (
          <>
            <View className="h-px bg-gray-200" />
            <View>
              <Text className="text-gray-500 text-xs">Motif</Text>
              <Text className="text-gray-900 font-semibold">{reason}</Text>
            </View>
          </>
        ) : null}
      </View>

      <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <Text className="text-primary font-semibold text-sm mb-1">Rappel</Text>
        <Text className="text-gray-600 text-xs">
          Les annulations sont possibles jusqu&apos;à 48h avant le rendez-vous. Passé ce délai,
          contactez directement la clinique.
        </Text>
      </View>

      {error ? <Text className="text-danger text-sm">{error}</Text> : null}

      <TouchableOpacity
        className="bg-primary rounded-2xl py-4 items-center shadow-md"
        onPress={handleConfirm}
        disabled={confirming}
      >
        {confirming ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Confirmer le rendez-vous</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
