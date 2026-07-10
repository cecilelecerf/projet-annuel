import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.includes("@")) {
      setError("Email invalide.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-gray-900 mb-4 text-center">Mot de passe oublié</Text>

      {!sent ? (
        <>
          <Text className="text-gray-500 text-center mb-8">
            Indiquez votre email, nous vous enverrons un code pour réinitialiser votre mot de
            passe.
          </Text>

          <View className="gap-4">
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

            {error ? <Text className="text-danger text-sm">{error}</Text> : null}

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center mt-2"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">Envoyer le code</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text className="text-gray-500 text-center mb-8">
            Si un compte existe pour {email}, un code vous a été envoyé par email.
          </Text>

          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={() => router.push({ pathname: "/reset-password", params: { email } })}
          >
            <Text className="text-white font-semibold text-base">{"J'ai reçu mon code"}</Text>
          </TouchableOpacity>
        </>
      )}

      <View className="flex-row justify-center mt-6">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-semibold">Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
