import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ApiError, http } from "@/lib/api";
import { BookingClinic, BookingSlot, BookingVet } from "@/lib/booking-types";

type Props = {
  clinic: BookingClinic;
  petId: string;
  specialityId: string | null;
  initialDate?: string;
  selectedVet: BookingVet | null;
  onSelectVet: (vet: BookingVet) => void;
  selectedSlot: BookingSlot | null;
  onSelectSlot: (slot: BookingSlot) => void;
};

function formatSlotTime(iso: string) {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export default function BookingStepVet({
  clinic,
  petId,
  specialityId,
  initialDate,
  selectedVet,
  onSelectVet,
  selectedSlot,
  onSelectSlot,
}: Props) {
  const [vets, setVets] = useState<BookingVet[] | null>(null);
  const [error, setError] = useState("");
  const [date, setDate] = useState(initialDate ?? new Date().toISOString().slice(0, 10));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slots, setSlots] = useState<BookingSlot[] | null>(null);
  const [slotsError, setSlotsError] = useState("");

  const loadVets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (specialityId) params.set("specialityId", specialityId);
      params.set("petId", petId);
      const data = await http.get<BookingVet[]>(`/booking/clinics/${clinic.id}/vets?${params.toString()}`);
      setVets(data);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Impossible de charger les vétérinaires.");
    }
  }, [clinic.id, date, specialityId, petId]);

  useEffect(() => {
    loadVets();
  }, [loadVets]);

  const loadSlots = useCallback(
    async (vetId: string) => {
      try {
        const data = await http.get<BookingSlot[]>(
          `/meetings/veterinarians/${vetId}/slots?date=${date}&clinicId=${clinic.id}`,
        );
        setSlots(data);
        setSlotsError("");
      } catch (e: unknown) {
        setSlotsError(e instanceof ApiError ? e.message : "Impossible de charger les créneaux.");
      }
    },
    [clinic.id, date],
  );

  useEffect(() => {
    if (selectedVet) loadSlots(selectedVet.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVet?.id, date]);

  function handleSelectVet(vet: BookingVet) {
    onSelectVet(vet);
    setSlots(null);
  }

  function handleDateChange(_event: unknown, picked?: Date) {
    setShowDatePicker(Platform.OS === "ios");
    if (picked) {
      setDate(picked.toISOString().slice(0, 10));
      setSlots(null);
    }
  }

  const morning = (slots ?? []).filter((s) => new Date(s.startTime).getUTCHours() < 12);
  const afternoon = (slots ?? []).filter((s) => new Date(s.startTime).getUTCHours() >= 12);

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-gray-900">Choisissez un vétérinaire</Text>
        <Text className="text-gray-500 text-sm mt-1">
          📍 {clinic.name} — {clinic.address}
        </Text>
      </View>

      <View>
        <Text className="text-gray-900 font-semibold mb-2">Vétérinaires disponibles</Text>
        {vets === null ? (
          <ActivityIndicator color="#4873a2" />
        ) : error ? (
          <Text className="text-danger text-sm">{error}</Text>
        ) : vets.length === 0 ? (
          <Text className="text-gray-500 text-sm">Aucun vétérinaire disponible pour cette clinique.</Text>
        ) : (
          <View className="gap-2">
            {vets.map((vet) => {
              const selected = selectedVet?.id === vet.id;
              return (
                <TouchableOpacity
                  key={vet.id}
                  className={`flex-row items-center gap-3 rounded-2xl p-3 border ${
                    selected ? "border-primary bg-blue-50" : "border-gray-100 bg-gray-50"
                  }`}
                  onPress={() => handleSelectVet(vet)}
                >
                  <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                    <Text className="text-white font-bold text-xs">
                      {vet.user.firstname[0]}
                      {vet.user.lastname[0]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-sm">
                      Dr {vet.user.firstname} {vet.user.lastname}
                    </Text>
                    <Text className="text-gray-500 text-xs" numberOfLines={1}>
                      {vet.specialities.map((s) => s.name).join(", ")}
                    </Text>
                  </View>
                  {selected ? <Text className="text-primary text-lg">✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View>
        <Text className="text-gray-900 font-semibold mb-2">Créneaux disponibles</Text>

        <TouchableOpacity
          className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4 py-3 mb-3"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-gray-400 mr-2">📅</Text>
          <Text className="text-gray-900">{date}</Text>
        </TouchableOpacity>
        {showDatePicker ? (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        ) : null}

        {!selectedVet ? (
          <Text className="text-gray-500 text-sm">
            👤 Sélectionnez un vétérinaire pour voir ses disponibilités.
          </Text>
        ) : slots === null ? (
          <ActivityIndicator color="#4873a2" />
        ) : slotsError ? (
          <Text className="text-danger text-sm">{slotsError}</Text>
        ) : slots.length === 0 ? (
          <Text className="text-gray-500 text-sm">Aucun créneau disponible ce jour.</Text>
        ) : (
          <View className="gap-4">
            {morning.length > 0 ? (
              <View>
                <Text className="text-gray-500 text-xs font-medium mb-2">🌅 Matin</Text>
                <View className="flex-row flex-wrap gap-2">
                  {morning.map((slot, i) => {
                    const selected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <TouchableOpacity
                        key={i}
                        className={`rounded-xl px-3 py-2 border ${
                          selected ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
                        }`}
                        onPress={() => onSelectSlot(slot)}
                      >
                        <Text className={selected ? "text-white text-sm" : "text-gray-700 text-sm"}>
                          {formatSlotTime(slot.startTime)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {afternoon.length > 0 ? (
              <View>
                <Text className="text-gray-500 text-xs font-medium mb-2">🌇 Après-midi</Text>
                <View className="flex-row flex-wrap gap-2">
                  {afternoon.map((slot, i) => {
                    const selected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <TouchableOpacity
                        key={i}
                        className={`rounded-xl px-3 py-2 border ${
                          selected ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
                        }`}
                        onPress={() => onSelectSlot(slot)}
                      >
                        <Text className={selected ? "text-white text-sm" : "text-gray-700 text-sm"}>
                          {formatSlotTime(slot.startTime)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
