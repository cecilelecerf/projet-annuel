import { BadRequestError } from "@api/errors";
import { BudgetRepository } from "./budget.repository";
import { ClinicService } from "@api/clinics/clinic.service";
import type { CreditBudget, UserId, UserRole } from "@armali/schemas";

const BUDGET_VIEW_ROLES: UserRole[] = ["REFERENT", "DIRECTOR"];
const BUDGET_CREDIT_ROLES: UserRole[] = ["DIRECTOR"];

export class BudgetService {
  constructor(
    private repository: BudgetRepository,
    private clinicService: ClinicService,
  ) {}

  private async assertViewRoleAndGetClinicId(userId: UserId, role: UserRole) {
    if (!BUDGET_VIEW_ROLES.includes(role)) {
      throw new BadRequestError(
        "Seuls le référent et le directeur peuvent consulter le budget de la clinique",
      );
    }
    return this.clinicService.getClinicIdByUserId({ userId, role });
  }

  private async assertCreditRoleAndGetClinicId(userId: UserId, role: UserRole) {
    if (!BUDGET_CREDIT_ROLES.includes(role)) {
      throw new BadRequestError(
        "Seul le directeur peut créditer le budget de la clinique",
      );
    }
    return this.clinicService.getClinicIdByUserId({ userId, role });
  }

  async getSummary(userId: UserId, role: UserRole) {
    const clinicId = await this.assertViewRoleAndGetClinicId(userId, role);
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
    const clinicId = await this.assertCreditRoleAndGetClinicId(userId, role);
    return this.repository.create({
      clinicId,
      createdById: userId,
      type: "CREDIT",
      amount: data.amount,
      reason: data.reason,
    });
  }
}