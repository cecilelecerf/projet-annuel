import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!email.includes("@")) return "Email invalide.";
    if (code.length !== 6) return "Le code doit contenir 6 chiffres.";
    if (newPassword.length < 8) return "Mot de passe : minimum 8 caractères.";
    if (newPassword !== confirm) return "Les mots de passe ne correspondent pas.";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      router.replace("/login");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6 gap-4" style={{ paddingTop: insets.top }}>
      <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
        Réinitialiser le mot de passe
      </Text>
      <Text className="text-gray-500 text-center mb-2">
        Saisissez le code reçu par email ainsi que votre nouveau mot de passe.
      </Text>

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
        placeholder="exemple@email.com"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
        placeholder="Code à 6 chiffres"
        placeholderTextColor="#9ca3af"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
        placeholder="Nouveau mot de passe"
        placeholderTextColor="#9ca3af"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoComplete="new-password"
      />

      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
        placeholder="Confirmer le mot de passe"
        placeholderTextColor="#9ca3af"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
      />

      {error ? <Text className="text-danger text-sm">{error}</Text> : null}

      <TouchableOpacity
        className="bg-primary rounded-xl py-4 items-center mt-2"
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Réinitialiser le mot de passe</Text>
        )}
      </TouchableOpacity>

      <View className="flex-row justify-center mt-6">
        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text className="text-primary font-semibold">Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
