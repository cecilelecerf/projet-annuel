import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { ApiError, http } from "@/lib/api";
import { geocodeAddress } from "@/lib/nominatim";
import { BookingAnimal, BookingClinic } from "@/lib/booking-types";

export type ClinicFilters = {
  lat?: number;
  lng?: number;
  address: string;
  radiusKm: number;
  date?: string;
};

type Props = {
  animal: BookingAnimal;
  specialityId: string | null;
  filters: ClinicFilters;
  onChangeFilters: (filters: ClinicFilters) => void;
  selectedClinic: BookingClinic | null;
  onSelectClinic: (clinic: BookingClinic) => void;
};

const RADIUS_OPTIONS = [5, 10, 20, 50];

export default function BookingStepClinic({
  animal,
  specialityId,
  filters,
  onChangeFilters,
  selectedClinic,
  onSelectClinic,
}: Props) {
  const [clinics, setClinics] = useState<BookingClinic[] | null>(null);
  const [error, setError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);
  const [isGeolocated, setIsGeolocated] = useState(false);

  const search = useCallback(
    async (f: ClinicFilters, geolocated: boolean) => {
      try {
        const params = new URLSearchParams();
        if (f.lat) params.set("lat", String(f.lat));
        if (f.lng) params.set("lng", String(f.lng));
        if (!geolocated && f.address) params.set("address", f.address);
        params.set("radiusKm", String(f.radiusKm));
        if (f.date) params.set("date", f.date);
        if (specialityId) params.set("specialityId", specialityId);
        params.set("petId", animal.race.petId);

        const data = await http.get<BookingClinic[]>(`/booking/clinics?${params.toString()}`);
        setClinics([...data].sort((a, b) => a.distanceKm - b.distanceKm));
        setError("");
      } catch (e: unknown) {
        setError(e instanceof ApiError ? e.message : "Impossible de rechercher des cliniques.");
      }
    },
    [animal, specialityId],
  );

  useEffect(() => {
    (async () => {
      const initial = { ...filters, date: filters.date ?? new Date().toISOString().slice(0, 10) };
      if (!initial.address && !initial.lat) {
        await handleGeolocate(initial);
      } else {
        onChangeFilters(initial);
        await search(initial, isGeolocated);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGeolocate(base?: ClinicFilters) {
    setLocating(true);
    setLocationError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError("Géolocalisation refusée. Saisissez une adresse.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const next: ClinicFilters = {
        ...(base ?? filters),
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        address: "Ma position actuelle",
      };
      setIsGeolocated(true);
      onChangeFilters(next);
      await search(next, true);
    } catch {
      setLocationError("Géolocalisation refusée. Saisissez une adresse.");
    } finally {
      setLocating(false);
    }
  }

  async function handleAddressChange(address: string) {
    setIsGeolocated(false);
    const next: ClinicFilters = { ...filters, address };
    if (!address) {
      onChangeFilters({ ...next, lat: undefined, lng: undefined });
      await search({ ...next, lat: undefined, lng: undefined }, false);
      return;
    }
    const coords = await geocodeAddress(address);
    if (!coords) {
      setLocationError("Adresse introuvable, vérifiez la saisie.");
      onChangeFilters({ ...next, lat: undefined, lng: undefined });
      await search({ ...next, lat: undefined, lng: undefined }, false);
      return;
    }
    setLocationError("");
    const withCoords = { ...next, lat: coords.lat, lng: coords.lng };
    onChangeFilters(withCoords);
    await search(withCoords, false);
  }

  async function handleRadiusChange(radiusKm: number) {
    const next = { ...filters, radiusKm };
    onChangeFilters(next);
    await search(next, isGeolocated);
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text className="text-xl font-bold text-gray-900">Choisissez une clinique</Text>
        <Text className="text-gray-500 text-sm mt-1">
          Recherche pour {animal.name} ({animal.race.pet.name} · {animal.race.name})
        </Text>
      </View>

      <View>
        <Text className="text-gray-700 font-medium text-sm mb-1">Localisation</Text>
        <View className="flex-row items-center border border-gray-200 rounded-2xl bg-gray-50 px-4">
          <Text className="text-gray-400 mr-2">📍</Text>
          <TextInput
            className="flex-1 py-3 text-gray-900"
            placeholder="Ville, adresse..."
            placeholderTextColor="#9ca3af"
            value={filters.address}
            onChangeText={(text) => onChangeFilters({ ...filters, address: text })}
            onEndEditing={(e) => handleAddressChange(e.nativeEvent.text)}
          />
          <TouchableOpacity onPress={() => handleGeolocate()} disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color="#4873a2" />
            ) : (
              <Text className="text-lg px-1">🎯</Text>
            )}
          </TouchableOpacity>
        </View>
        {locationError ? <Text className="text-danger text-xs mt-1">{locationError}</Text> : null}
      </View>

      <View>
        <Text className="text-gray-700 font-medium text-sm mb-1">Rayon</Text>
        <View className="flex-row gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              className={`rounded-full px-3 py-1.5 border ${
                filters.radiusKm === r ? "bg-primary border-primary" : "bg-gray-50 border-gray-200"
              }`}
              onPress={() => handleRadiusChange(r)}
            >
              <Text className={filters.radiusKm === r ? "text-white text-sm" : "text-gray-700 text-sm"}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {clinics === null ? (
        <ActivityIndicator color="#4873a2" />
      ) : (
        <View>
          <Text className="text-gray-500 text-sm mb-2">{clinics.length} cliniques trouvées</Text>
          {error ? <Text className="text-danger text-sm mb-2">{error}</Text> : null}
          {clinics.length === 0 && filters.address ? (
            <Text className="text-gray-500 text-center py-4">
              Aucune clinique trouvée dans ce rayon. Essayez d&apos;élargir la recherche.
            </Text>
          ) : (
            <View className="gap-2">
              {clinics.map((clinic) => {
                const selected = selectedClinic?.id === clinic.id;
                return (
                  <TouchableOpacity
                    key={clinic.id}
                    className={`rounded-2xl p-3 border ${
                      selected ? "border-primary bg-blue-50" : "border-gray-100 bg-gray-50"
                    }`}
                    onPress={() => onSelectClinic(clinic)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-900 font-semibold flex-1" numberOfLines={1}>
                        {clinic.name}
                      </Text>
                      {selected ? <Text className="text-primary text-lg">✓</Text> : null}
                    </View>
                    <Text className="text-gray-500 text-xs mt-0.5">📍 {clinic.address}</Text>
                    <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                      <Text className="text-gray-500 text-xs">{clinic.distanceKm} km</Text>
                      {clinic.specialities.slice(0, 2).map((s) => (
                        <View key={s} className="bg-white border border-gray-200 rounded-full px-2 py-0.5">
                          <Text className="text-gray-500 text-xs">{s}</Text>
                        </View>
                      ))}
                      {clinic.specialities.length > 2 ? (
                        <Text className="text-gray-400 text-xs">+{clinic.specialities.length - 2}</Text>
                      ) : null}
                    </View>
                    {clinic.nextSlot ? (
                      <Text className="text-gray-400 text-xs mt-1">🕐 {clinic.nextSlot}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
