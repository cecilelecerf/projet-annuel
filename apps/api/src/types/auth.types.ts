import { Register } from "@armali/schemas";

export interface RegisterDirector extends Register {
  clinic: {
    name: string;
    street: string;
    postalCode: string;
    city: string;
    country: string;
    siret: string;
    phone: string;
    website: string;
    description?: string;
  };
}
