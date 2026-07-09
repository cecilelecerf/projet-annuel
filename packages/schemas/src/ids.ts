import { z } from "zod";

export const userIdSchema = z.uuid().brand("UserId");
export const clientIdSchema = userIdSchema;
export const veterinarianIdSchema = userIdSchema;
export const secretaryIdSchema = userIdSchema;
export const directorClinicIdSchema = userIdSchema;
export const referentClinicIdSchema = userIdSchema;
export const clinicIdSchema = z.uuid().brand("ClinicId");
export const petIdSchema = z.uuid().brand("PetId");
export const animalIdSchema = z.uuid().brand("AnimalId");
export const raceIdSchema = z.uuid().brand("RaceId");
export const meetingIdSchema = z.uuid().brand("MeetingId");
export const meetingRecurringIdSchema = z.uuid().brand("MeetingRecurringId");
export const internalMeetingParticipantIdSchema = z
  .uuid()
  .brand("InternalMeetingParticipantId");
export const vaccineIdSchema = z.uuid().brand("VaccineId");
export const petVaccineIdSchema = z.uuid().brand("PetVaccineId");
export const brandIdSchema = z.uuid().brand("BrandId");
export const productIdSchema = z.uuid().brand("ProductId");
export const foodIdSchema = z.uuid().brand("FoodId");
export const productClinicIdSchema = z.uuid().brand("ProductClinicId");
export const reviewIdSchema = z.uuid().brand("ReviewId");
export const petFoodIdSchema = z.number().int().brand("PetFoodId");
export const productRequestIdSchema = z.uuid().brand("ProductRequestId");
export const clientPetHealthConditionIdSchema = z
  .uuid()
  .brand("ClientPetHealthConditionId");
export const veterinarianClinicIdSchema = z
  .uuid()
  .brand("VeterinarianClinicId");
export const availabilityIdSchema = z.uuid().brand("AvailabilityId");
export const specialityIdSchema = z.uuid().brand("SpecialityId");
export const clinicPetIdSchema = z.uuid().brand("ClinicPetId");
export const veterinarianPetIdSchema = z.uuid().brand("VeterinarianPetId");
export const orderIdSchema = z.uuid().brand("OrderId");
export const orderItemIdSchema = z.uuid().brand("OrderItemId");
export const conversationIdSchema = z.uuid().brand("ConversationId");
export const conversationMemberIdSchema = z
  .uuid()
  .brand("ConversationMemberId");
export const messageIdSchema = z.uuid().brand("MessageId");
export const healthConditionIdSchema = z.uuid().brand("HealthConditionId");
export const actIdSchema = z.uuid().brand("ActId");
export const clinicActIdSchema = z.uuid().brand("ClinicActId");
export const medicalHistoryIdSchema = z.uuid().brand("AnimalMeetingActId");
export const prescriptionIdSchema = z.uuid().brand("PrescriptionId");
export const prescriptionItemIdSchema = z.uuid().brand("PrescriptionItemId");
export const hospitalizationIdSchema = z.uuid().brand("HospitalizationId");
export const hospitalizationReportIdSchema = z
  .uuid()
  .brand("HospitalizationReportId");
export const imagingIdSchema = z.uuid().brand("ImagingId");
export const analysisIdSchema = z.uuid().brand("AnalysisId");
export const surgeryIdSchema = z.uuid().brand("SurgeryId");
export const clinicProductIdSchema = z.uuid().brand("ClinicProductId");
export const clinicRequestIdSchema = z.uuid().brand("ClinicRequestId");
export const fileIdSchema = z.uuid().brand("FileId");
export const budgetTransactionIdSchema = z.uuid().brand("BudgetTransactionId");
export const supplierIdSchema = z.uuid().brand("SupplierId");
export const supplierProductIdSchema = z.uuid().brand("SupplierProductId");
export const supplierOrderIdSchema = z.uuid().brand("SupplierOrderId");
export const supplierOrderItemIdSchema = z.uuid().brand("SupplierOrderItemId");

export type UserId = z.infer<typeof userIdSchema>;
export type ClientId = z.infer<typeof clientIdSchema>;
export type VeterinarianId = z.infer<typeof veterinarianIdSchema>;
export type SecretaryId = z.infer<typeof secretaryIdSchema>;
export type DirectorClinicId = z.infer<typeof directorClinicIdSchema>;
export type ReferentClinicId = z.infer<typeof referentClinicIdSchema>;
export type ClinicId = z.infer<typeof clinicIdSchema>;
export type PetId = z.infer<typeof petIdSchema>;
export type AnimalId = z.infer<typeof animalIdSchema>;
export type RaceId = z.infer<typeof raceIdSchema>;
export type MeetingId = z.infer<typeof meetingIdSchema>;
export type VaccineId = z.infer<typeof vaccineIdSchema>;
export type PetVaccineId = z.infer<typeof petVaccineIdSchema>;
export type BrandId = z.infer<typeof brandIdSchema>;
export type ProductId = z.infer<typeof productIdSchema>;
export type FoodId = z.infer<typeof foodIdSchema>;
export type ProductClinicId = z.infer<typeof productClinicIdSchema>;
export type ReviewId = z.infer<typeof reviewIdSchema>;
export type PetFoodId = z.infer<typeof petFoodIdSchema>;
export type VeterinarianClinicId = z.infer<typeof veterinarianClinicIdSchema>;
export type AvailabilityId = z.infer<typeof availabilityIdSchema>;
export type SpecialityId = z.infer<typeof specialityIdSchema>;
export type ClinicPetId = z.infer<typeof clinicPetIdSchema>;
export type VeterinarianPetId = z.infer<typeof veterinarianPetIdSchema>;
export type OrderId = z.infer<typeof orderIdSchema>;
export type OrderItemId = z.infer<typeof orderItemIdSchema>;
export type ConversationId = z.infer<typeof conversationIdSchema>;
export type ConversationMemberId = z.infer<typeof conversationMemberIdSchema>;
export type MessageId = z.infer<typeof messageIdSchema>;
export type HealthConditionId = z.infer<typeof healthConditionIdSchema>;
export type ActId = z.infer<typeof actIdSchema>;
export type ClinicActId = z.infer<typeof clinicActIdSchema>;
export type MedicalHistoryId = z.infer<typeof medicalHistoryIdSchema>;
export type PrescriptionId = z.infer<typeof prescriptionIdSchema>;
export type PrescriptionItemId = z.infer<typeof prescriptionItemIdSchema>;
export type HospitalizationId = z.infer<typeof hospitalizationIdSchema>;
export type HospitalizationReportId = z.infer<
  typeof hospitalizationReportIdSchema
>;
export type ImagingId = z.infer<typeof imagingIdSchema>;
export type AnalysisId = z.infer<typeof analysisIdSchema>;
export type SurgeryId = z.infer<typeof surgeryIdSchema>;
export type ClinicProductId = z.infer<typeof clinicProductIdSchema>;
export type MeetingRecurringId = z.infer<typeof meetingRecurringIdSchema>;
export type ProductRequestId = z.infer<typeof productRequestIdSchema>;
export type ClinicRequestId = z.infer<typeof clinicRequestIdSchema>;
export type BudgetTransactionId = z.infer<typeof budgetTransactionIdSchema>;
export type SupplierId = z.infer<typeof supplierIdSchema>;
export type SupplierProductId = z.infer<typeof supplierProductIdSchema>;
export type SupplierOrderId = z.infer<typeof supplierOrderIdSchema>;
export type SupplierOrderItemId = z.infer<typeof supplierOrderItemIdSchema>;