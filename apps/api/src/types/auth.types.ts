import { Register } from "@armali/schemas";

export interface RegisterDirector extends Register {
  clinic: {
    name: string;
    address: string;
    siret: string;
    phone: string;
    website: string;
    description?: string;
  };
}
