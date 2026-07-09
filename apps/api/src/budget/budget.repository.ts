import { PrismaClient } from "../../prisma/generated/prisma/client";

const WITH_AUTHOR = {
  createdBy: { select: { firstname: true, lastname: true } },
} as const;

export interface CreateTransactionInput {
  clinicId: string;
  createdById: string;
  type: "CREDIT" | "DEBIT" | "REFUND";
  amount: number;
  reason?: string;
  supplierOrderId?: string;
}

export class BudgetRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateTransactionInput) {
    return this.prisma.budgetTransaction.create({
      data,
      include: WITH_AUTHOR,
    });
  }

  async findByClinic(clinicId: string) {
    return this.prisma.budgetTransaction.findMany({
      where: { clinicId },
      include: WITH_AUTHOR,
      orderBy: { createdAt: "desc" },
    });
  }

  // Le solde n'est jamais stocké : toujours recalculé à partir de l'historique,
  // pour ne jamais risquer une désynchronisation entre un champ "balance" et
  // les transactions réelles.
  async getBalance(clinicId: string): Promise<number> {
    const [credits, debits, refunds] = await Promise.all([
      this.prisma.budgetTransaction.aggregate({
        where: { clinicId, type: "CREDIT" },
        _sum: { amount: true },
      }),
      this.prisma.budgetTransaction.aggregate({
        where: { clinicId, type: "DEBIT" },
        _sum: { amount: true },
      }),
      this.prisma.budgetTransaction.aggregate({
        where: { clinicId, type: "REFUND" },
        _sum: { amount: true },
      }),
    ]);
    const total =
      Number(credits._sum.amount ?? 0) +
      Number(refunds._sum.amount ?? 0) -
      Number(debits._sum.amount ?? 0);
    return Math.round(total * 100) / 100;
  }
}