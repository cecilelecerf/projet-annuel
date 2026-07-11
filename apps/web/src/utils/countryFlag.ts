/**
 * Convertit un code pays ISO 3166-1 alpha-2 (FR, BE, CH...) en emoji drapeau.
 * Fonctionne côté client sans appel réseau — chaque lettre est transformée
 * en "regional indicator symbol" Unicode, que les navigateurs/OS rendent
 * automatiquement comme un drapeau quand les deux lettres sont adjacentes.
 */
export function countryFlag(countryCode: string): string {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return '🏳️'

  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('')
}
