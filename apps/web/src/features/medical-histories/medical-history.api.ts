import { http } from '@/lib/api'
import {
  clinicActSchema,
  fileSchema,
  fileWithUrlSchema,
  initiateImageUploadSchema,
  medicalHistoryMetaSchema,
  medicalHistorySchema,
  uploadResponseSchema,
  type AnimalId,
  type ClinicId,
  type CreateMedicalHistory,
  type File as FileEntity,
  type FileWithUrl,
  type InitiateImageUploadInput,
  type MedicalHistoryId,
  type MeetingId,
  type UpdateMedicalHistory,
} from '@armali/schemas'

export const medicalHistoriesApi = {
  getAll: async () => {
    const data = await http.get(`/medical-histories`)
    return clinicActSchema.array().parse(data)
  },
  getByClinic: async (clinicId: ClinicId) => {
    const data = await http.get(`/clinics/${clinicId}/medical-histories`)
    return clinicActSchema.array().parse(data)
  },
  getByMeeting: async (meetingId: MeetingId) => {
    const data = await http.get(`/meetings/animals/${meetingId}/medical-histories`)
    return medicalHistoryMetaSchema.array().parse(data)
  },
  getByAnimal: async (animalId: AnimalId) => {
    const data = await http.get(`/animals/${animalId}/medical-histories`)
    return medicalHistoryMetaSchema.array().parse(data)
  },
  update: async ({
    medicalHistoryId,
    body,
  }: {
    medicalHistoryId: MedicalHistoryId
    body: UpdateMedicalHistory
  }) => {
    const data = await http.patch(`/medical-histories/${medicalHistoryId}`, body)
    return medicalHistorySchema.parse(data)
  },
  get: async (meetingId: MeetingId, meetingActId: MedicalHistoryId) => {
    const data = await http.get(`/medical-histories/${meetingId}/${meetingActId}`)
    return medicalHistorySchema.parse(data)
  },
  create: async ({ body }: { body: CreateMedicalHistory }) => {
    const data = await http.post(`/medical-histories`, body)
    return medicalHistorySchema.parse(data)
  },
  delete: async (medicalHistoryId: MedicalHistoryId) => {
    await http.delete(`/medical-histories/${medicalHistoryId}`)
  },

  files: {
    getByHistory: async (medicalHistoryId: string): Promise<FileWithUrl[]> => {
      const data = await http.get(`/medical-histories/${medicalHistoryId}/files`)
      return fileWithUrlSchema.array().parse(data)
    },

    upload: async ({ medicalHistoryId, file }: { medicalHistoryId: string; file: File }) => {
      const payload: InitiateImageUploadInput = initiateImageUploadSchema.parse({
        mimeType: file.type,
        size: file.size,
      })

      // 1. Demander une URL S3
      const { uploadUrl, fileId } = await http
        .post(`/medical-histories/${medicalHistoryId}/files/upload`, payload)
        .then((data) => uploadResponseSchema.parse(data))

      // 2. Upload direct vers S3
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      return { fileId }
    },

    confirm: async ({ medicalHistoryId, fileId }: { medicalHistoryId: string; fileId: string }) => {
      const data = await http.patch(
        `/medical-histories/${medicalHistoryId}/files/${fileId}/confirm`,
        {},
      )
      return fileWithUrlSchema.parse(data)
    },
  },
}
