import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const { login, devLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  function handleDevLogin() {
    devLogin();
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center pb-8">
          <Text style={{ fontFamily: "BlueWinter", color: "#4873a2", fontSize: 28 }}>Armali</Text>
          <Text className="text-gray-500 text-center mt-2">Connectez-vous à votre espace</Text>
        </View>

        <View className="gap-4">
          <View>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 bg-gray-50"
              placeholder="exemple@email.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View>
            <TextInput
              className="border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 bg-gray-50"
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? <Text className="text-danger text-sm">{error}</Text> : null}

          <TouchableOpacity onPress={() => router.push("/forgot-password")}>
            <Text className="text-primary text-sm text-right">Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-2 shadow-md"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">Pas de compte ? </Text>
          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text className="text-primary font-semibold">{"S'inscrire"}</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ ? (
          <TouchableOpacity
            className="border border-dashed border-gray-300 rounded-2xl py-3 items-center mt-8"
            onPress={handleDevLogin}
          >
            <Text className="text-gray-500 font-medium text-sm">🧪 Connexion (dev)</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
