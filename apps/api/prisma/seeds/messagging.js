export async function seedMessaging(prisma, { users }) {
    const { vetoUser1, vetoUser2, secretaryUser1 } = users;
    const conv1 = await prisma.conversation.create({
        data: { name: "Équipe Clinique du Parc" },
    });
    const member1 = await prisma.conversationMember.create({
        data: { role: "ADMIN", userId: vetoUser1.id, conversationId: conv1.id },
    });
    const member2 = await prisma.conversationMember.create({
        data: { role: "MEMBER", userId: vetoUser2.id, conversationId: conv1.id },
    });
    const member3 = await prisma.conversationMember.create({
        data: {
            role: "MEMBER",
            userId: secretaryUser1.id,
            conversationId: conv1.id,
        },
    });
    const msg1 = await prisma.message.create({
        data: {
            content: "Bonjour à tous ! Réunion demain à 8h30.",
            conversationId: conv1.id,
        },
    });
    const msg2 = await prisma.message.create({
        data: { content: "Reçu, je serai là !", conversationId: conv1.id },
    });
    await prisma.messageRead.createMany({
        data: [
            { readAt: new Date(), messageId: msg1.id, readById: member1.id },
            { readAt: new Date(), messageId: msg1.id, readById: member2.id },
            { readAt: new Date(), messageId: msg2.id, readById: member1.id },
        ],
    });
}
//# sourceMappingURL=messagging.js.map