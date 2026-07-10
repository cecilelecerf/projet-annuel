import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!firstname || !lastname || !email || !password || !confirm) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({ email, password, firstname, lastname });
      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 32, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center pb-4">
          <Text style={{ fontFamily: "BlueWinter", color: "#4873a2", fontSize: 28 }}>Armali</Text>
          <Text className="text-gray-500 text-center mt-2">Créez votre compte</Text>
        </View>

        <TextInput
          className="border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 bg-gray-50"
          placeholder="Nom"
          placeholderTextColor="#9ca3af"
          value={lastname}
          onChangeText={setLastname}
        />

        <TextInput
          className="border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 bg-gray-50"
          placeholder="Prénom"
          placeholderTextColor="#9ca3af"
          value={firstname}
          onChangeText={setFirstname}
        />

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

        <TextInput
          className="border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 bg-gray-50"
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TextInput
          className="border border-gray-200 rounded-2xl px-4 py-3.5 text-gray-900 bg-gray-50"
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
        />

        {error ? <Text className="text-danger text-sm">{error}</Text> : null}

        <TouchableOpacity
          className="bg-primary rounded-2xl py-4 items-center mt-2 shadow-md"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">{"S'inscrire"}</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-2">
          <Text className="text-gray-500">{"Déjà un compte ? "}</Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text className="text-primary font-semibold">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
