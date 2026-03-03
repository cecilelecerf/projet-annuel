import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth } from "@/firebaseConfig";

export default function RegisterScreen() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");

const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !confirm) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6 gap-4">
      <Text className="text-3xl font-bold text-gray-900 text-center mb-2">Inscription</Text>

        <View>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
            placeholder="Nom"
            placeholderTextColor="#9ca3af"
            value={lastname}
            onChangeText={setLastname}
          />
          </View>
        <View>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
            placeholder="Prénom"
            placeholderTextColor="#9ca3af"
            value={firstname}
            onChangeText={setFirstname}
          />
          </View>
      <View>
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
        </View>

        <View>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        <View>
          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-gray-50"
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>

        {error ? (
          <Text className="text-red-500 text-sm">{error}</Text>
        ) : null}

        <TouchableOpacity
          className="bg-indigo-600 rounded-xl py-4 items-center mt-2"
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">{"S'inscrire"}</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">{"Déjà un compte ? "}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/login")}>
            <Text className="text-indigo-600 font-semibold">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
}

function getErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-email":
      return "Adresse email invalide.";
    case "auth/email-already-in-use":
      return "Cet email est déjà utilisé.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible.";
    default:
      return "Une erreur est survenue. Veuillez réessayer.";
  }
}
