import { prisma } from "@api/lib/prisma";
import { NotFoundError, ForbiddenError } from "@api/errors";
// TODO jade : Pas de prisma ici
export async function getClientClinicIds(
  clientUserId: string,
): Promise<string[]> {
  const animals = await prisma.animal.findMany({
    where: { clientId: clientUserId },
    select: {
      attendingVeterinarianClinic: { select: { clinicId: true } },
      animalMeeting: {
        select: {
          veterinarianClinic: { select: { clinicId: true } },
        },
      },
    },
  });

  const clinicIds = new Set<string>();
  for (const animal of animals) {
    if (animal.attendingVeterinarianClinic)
      clinicIds.add(animal.attendingVeterinarianClinic?.clinicId);

    for (const meeting of animal.animalMeeting) {
      if (meeting.veterinarianClinic?.clinicId) {
        clinicIds.add(meeting.veterinarianClinic.clinicId);
      }
    }
  }
  return [...clinicIds];
}

export class ClientShopService {
  async getProducts(clientUserId: string) {
    const clinicIds = await getClientClinicIds(clientUserId);
    if (clinicIds.length === 0) return [];

    return prisma.clinicProduct.findMany({
      where: { clinicId: { in: clinicIds } },
      include: {
        product: { include: { brand: true } },
        clinic: { select: { id: true, name: true } },
      },
      orderBy: { product: { name: "asc" } },
    });
  }

  async getProductById(clientUserId: string, clinicProductId: string) {
    const clinicIds = await getClientClinicIds(clientUserId);

    const clinicProduct = await prisma.clinicProduct.findUnique({
      where: { id: clinicProductId },
      include: {
        product: { include: { brand: true } },
        clinic: { select: { id: true, name: true } },
      },
    });

    if (!clinicProduct) throw new NotFoundError("Produit");
    if (!clinicIds.includes(clinicProduct.clinicId)) {
      throw new ForbiddenError();
    }
    return clinicProduct;
  }
}
