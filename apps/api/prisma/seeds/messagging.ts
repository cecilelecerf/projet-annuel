import type { PrismaClient } from "../generated/prisma/client";

export async function seedMessaging(
  prisma: PrismaClient,
  {
    users,
    clinics,
  }: {
    users: any;
    clinics: ReturnType<typeof import("./clinics").seedClinics> extends Promise<
      infer T
    >
      ? T
      : never;
  },
) {
  const { vetoUser1, vetoUser3, secretaryUser1, directorUser1, directorUser2 } =
    users;

  const clinicGroup = await prisma.conversation.create({
    data: {
      type: "GROUP",
      scope: "CLINIC",
      name: "Équipe Clinique du Parc",
      clinicId: clinics.clinic1.id,
      createdById: vetoUser1.id,
      lastMessageAt: new Date(),
      conversationMembers: {
        createMany: {
          data: [
            { role: "ADMIN", userId: vetoUser1.id },
            { role: "MEMBER", userId: vetoUser3.id },
            { role: "MEMBER", userId: secretaryUser1.id },
            { role: "MEMBER", userId: directorUser1.id },
          ],
        },
      },
    },
  });

  await prisma.message.create({
    data: {
      content: "Bonjour à tous ! Réunion demain à 8h30.",
      conversationId: clinicGroup.id,
      senderId: vetoUser1.id,
    },
  });
  await prisma.message.create({
    data: {
      content: "Reçu, je serai là !",
      conversationId: clinicGroup.id,
      senderId: secretaryUser1.id,
    },
  });

  const directorsConversation = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      scope: "DIRECTOR_NETWORK",
      createdById: directorUser1.id,
      lastMessageAt: new Date(),
      conversationMembers: {
        createMany: {
          data: [
            { role: "ADMIN", userId: directorUser1.id },
            { role: "ADMIN", userId: directorUser2.id },
          ],
        },
      },
    },
  });

  await prisma.message.create({
    data: {
      content:
        "Bonjour confrère, avez-vous un créneau pour échanger cette semaine ?",
      conversationId: directorsConversation.id,
      senderId: directorUser1.id,
    },
  });
}
