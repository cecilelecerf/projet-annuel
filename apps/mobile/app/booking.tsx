import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BookingStepAnimal from "@/components/booking/BookingStepAnimal";
import BookingStepClinic, { type ClinicFilters } from "@/components/booking/BookingStepClinic";
import BookingStepVet from "@/components/booking/BookingStepVet";
import BookingStepConfirm from "@/components/booking/BookingStepConfirm";
import { BookingAnimal, BookingClinic, BookingSlot, BookingVet } from "@/lib/booking-types";

const STEP_LABELS = ["Animal", "Clinique", "Vétérinaire & créneau", "Confirmation"];

export default function BookingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedAnimal, setSelectedAnimal] = useState<BookingAnimal | null>(null);
  const [specialityId, setSpecialityId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [filters, setFilters] = useState<ClinicFilters>({ address: "", radiusKm: 20 });
  const [selectedClinic, setSelectedClinic] = useState<BookingClinic | null>(null);
  const [selectedVet, setSelectedVet] = useState<BookingVet | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);

  const canGoNext =
    (step === 1 && !!selectedAnimal) ||
    (step === 2 && !!selectedClinic) ||
    (step === 3 && !!selectedVet && !!selectedSlot);

  function handleBack() {
    if (step > 1) {
      setStep((s) => (s - 1) as typeof step);
    } else {
      router.back();
    }
  }

  function handleNext() {
    if (step < 4) setStep((s) => (s + 1) as typeof step);
  }

  function handleStepPress(index: number) {
    if (index + 1 < step) setStep((index + 1) as typeof step);
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
        <TouchableOpacity onPress={handleBack} className="pr-3">
          <Text className="text-primary text-lg">←</Text>
        </TouchableOpacity>
        <View className="flex-1 flex-row justify-between">
          {STEP_LABELS.map((label, i) => (
            <TouchableOpacity key={label} onPress={() => handleStepPress(i)} className="items-center">
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  i + 1 === step ? "bg-primary" : i + 1 < step ? "bg-primary/60" : "bg-gray-200"
                }`}
              >
                <Text className="text-white text-xs font-bold">{i + 1}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="flex-1">
        {step === 1 ? (
          <BookingStepAnimal
            selectedAnimal={selectedAnimal}
            onSelectAnimal={setSelectedAnimal}
            specialityId={specialityId}
            onSelectSpeciality={setSpecialityId}
            reason={reason}
            onChangeReason={setReason}
          />
        ) : null}

        {step === 2 && selectedAnimal ? (
          <BookingStepClinic
            animal={selectedAnimal}
            specialityId={specialityId}
            filters={filters}
            onChangeFilters={setFilters}
            selectedClinic={selectedClinic}
            onSelectClinic={setSelectedClinic}
          />
        ) : null}

        {step === 3 && selectedClinic && selectedAnimal ? (
          <BookingStepVet
            clinic={selectedClinic}
            petId={selectedAnimal.race.petId}
            specialityId={specialityId}
            initialDate={filters.date}
            selectedVet={selectedVet}
            onSelectVet={setSelectedVet}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />
        ) : null}

        {step === 4 && selectedAnimal && selectedClinic && selectedVet && selectedSlot ? (
          <BookingStepConfirm
            animal={selectedAnimal}
            clinic={selectedClinic}
            vet={selectedVet}
            slot={selectedSlot}
            specialityId={specialityId}
            reason={reason}
            onConfirmed={() => router.replace("/(tabs)/rendez-vous")}
          />
        ) : null}
      </View>

      {step < 4 ? (
        <View className="px-4 py-3 border-t border-gray-100" style={{ paddingBottom: insets.bottom + 12 }}>
          <Text className="text-gray-400 text-xs text-center mb-2">Étape {step} sur 4</Text>
          <TouchableOpacity
            className={`rounded-2xl py-4 items-center ${canGoNext ? "bg-primary" : "bg-gray-200"}`}
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Text className={`font-semibold text-base ${canGoNext ? "text-white" : "text-gray-400"}`}>
              {step === 3 ? "Voir le récapitulatif →" : "Continuer →"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
