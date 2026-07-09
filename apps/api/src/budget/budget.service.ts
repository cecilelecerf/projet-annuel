import { BadRequestError } from "@api/errors";
import { BudgetRepository } from "./budget.repository";
import { ClinicService } from "@api/clinics/clinic.service";
import type { CreditBudget, UserId, UserRole } from "@armali/schemas";

const BUDGET_MANAGER_ROLES: UserRole[] = ["REFERENT", "DIRECTOR"];

export class BudgetService {
  constructor(
    private repository: BudgetRepository,
    private clinicService: ClinicService,
  ) {}

  private async assertRoleAndGetClinicId(userId: UserId, role: UserRole) {
    if (!BUDGET_MANAGER_ROLES.includes(role)) {
      throw new BadRequestError(
        "Seuls le référent et le directeur peuvent gérer le budget de la clinique",
      );
    }
    return this.clinicService.getClinicIdByUserId({ userId, role });
  }

  async getSummary(userId: UserId, role: UserRole) {
    const clinicId = await this.assertRoleAndGetClinicId(userId, role);
    const [balance, transactions] = await Promise.all([
      this.repository.getBalance(clinicId),
      this.repository.findByClinic(clinicId),
    ]);
    return {
      balance,
      transactions: transactions.map((tx) => ({
        ...tx,
        createdAt: tx.createdAt.toISOString(),
      })),
    };
  }

  async credit(userId: UserId, role: UserRole, data: CreditBudget) {
    const clinicId = await this.assertRoleAndGetClinicId(userId, role);
    return this.repository.create({
      clinicId,
      createdById: userId,
      type: "CREDIT",
      amount: data.amount,
      reason: data.reason,
    });
  }
}