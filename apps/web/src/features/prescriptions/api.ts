import { http } from '@/lib/api'
import {
  prescriptionSchema,
  type CreatePrescription,
  type UpdatePrescription,
  type Prescription,
  type MeetingId,
  type PrescriptionId,
} from '@armali/schemas'

export const prescriptionApi = {
  getByMeeting: async (meetingId: MeetingId): Promise<Prescription[]> => {
    const data = await http.get(`/prescriptions/meeting/${meetingId}`)
    return prescriptionSchema.array().parse(data)
  },

  getById: async (id: PrescriptionId): Promise<Prescription> => {
    const data = await http.get(`/prescriptions/${id}`)
    return prescriptionSchema.parse(data)
  },

  create: async (prescription: CreatePrescription): Promise<Prescription> => {
    const data = await http.post(`/prescriptions`, prescription)
    return prescriptionSchema.parse(data)
  },

  update: async (id: PrescriptionId, prescription: UpdatePrescription): Promise<Prescription> => {
    const data = await http.patch(`/prescriptions/${id}`, prescription)
    return prescriptionSchema.parse(data)
  },

  delete: async (id: PrescriptionId): Promise<void> => {
    await http.delete(`/prescriptions/${id}`)
  },
}
