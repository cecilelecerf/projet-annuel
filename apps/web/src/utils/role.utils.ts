import type { UserRole } from '@armali/schemas'
import { match } from 'ts-pattern'

export const getStringRole = (role: UserRole) =>
  match(role)
    .with('CLIENT', () => 'client')
    .with('VETERINARIAN', () => 'vétérinaire')
    .with('SECRETARY', () => 'secrétaire')
    .with('DIRECTOR', () => 'directeur')
    .with('REFERANT', () => 'référant')
    .with('ADMIN', () => 'administrateur')
    .exhaustive()
