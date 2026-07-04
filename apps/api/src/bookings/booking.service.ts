import { BadRequestError, NotFoundError } from "@api/errors";
import type { BookingSearchQuery, CreateBooking } from "@armali/schemas";
import { BookingRepository } from "./booking.repository";
import { prisma } from "@api/lib/prisma";
import dayjs from "dayjs";
import { ClinicRepository } from "@api/clinics/clinic.repository";
import { haversineKm } from "@api/utils/distance";

const SLOT_DURATION_MINUTES = 30;

export class BookingService {
  constructor(
    private repository: BookingRepository,
    private clinicRepository: ClinicRepository,
  ) {}
  // ── Recherche de cliniques ─────────────────────────────────────────────────
  async searchClinics(query: BookingSearchQuery) {
    console.log(query);
    const clinics = await this.clinicRepository.searchClinics(query);

    return clinics
      .map((clinic) => {
        // Récupère toutes les spécialités des vetos de la clinique
        const specialities = [
          ...new Set(
            clinic.veterinarianClinics.flatMap((vc) =>
              vc.veterinarian.specialities.map((s) => s.name),
            ),
          ),
        ];

        // Prochain créneau disponible parmi tous les vetos
        const nextSlot = this._getNextSlotLabel(clinic.veterinarianClinics);
        const distance =
          query.lat &&
          query.lng &&
          haversineKm(query.lat, query.lng, clinic.lat, clinic.lng);
        return {
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
          description: clinic.description,
          openingHours: clinic.openingHours,
          lat: clinic.lat,
          lng: clinic.lng,
          distanceKm: Math.round((distance ?? 0) * 10) / 10,
          vetCount: clinic.veterinarianClinics.length,
          specialities,
          nextSlot,
          rating: null,
        };
      })
      .filter((c) => {
        // Filtre par rayon si lat/lng fournis
        if (!query.lat || !query.lng) return true;
        return c.distanceKm <= (query.radiusKm ?? 20);
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // ── Vétérinaires d'une clinique ────────────────────────────────────────────
  async getClinicVets(params: {
    clinicId: string;
    date?: string;
    specialityId?: string;
    petId?: string;
  }) {
    const vets = await this.repository.getClinicVets(params);

    return vets.map((vc) => ({
      id: vc.veterinarian.id,
      bio: vc.veterinarian.bio,
      user: {
        firstname: vc.veterinarian.user.firstname,
        lastname: vc.veterinarian.user.lastname,
        picture: vc.veterinarian.user.picture ?? null,
      },
      specialities: vc.veterinarian.specialities.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      rating: null,
    }));
  }

  // ── Créneaux disponibles ───────────────────────────────────────────────────
  async getVetSlots(params: {
    veterinarianId: string;
    clinicId: string;
    date: string;
  }) {
    const { availabilities, existingMeetings } =
      await this.repository.getVetSlots(params);

    if (availabilities.length === 0) return [];

    const targetDate = new Date(params.date);

    // Récupère les plages horaires de disponibilité
    const timeRanges = availabilities
      .map((avail) => {
        const base = avail.meeting ?? avail.recurring;
        if (!base) return null;
        return {
          startTime: dayjs(base.startTime),
          endTime: dayjs(base.endTime),
        };
      })
      .filter(Boolean) as { startTime: dayjs.Dayjs; endTime: dayjs.Dayjs }[];

    // Génère les créneaux de SLOT_DURATION_MINUTES minutes
    const slots: { date: Date; startTime: Date; endTime: Date }[] = [];

    for (const range of timeRanges) {
      let cursor = range.startTime;
      while (cursor.isBefore(range.endTime)) {
        const slotEnd = cursor.add(SLOT_DURATION_MINUTES, "minute");
        if (slotEnd.isAfter(range.endTime)) break;

        // Vérifie que le créneau n'est pas déjà pris
        const isTaken = existingMeetings.some((m) => {
          if (!m.meeting) return false;
          const start = dayjs(m.meeting.startTime);
          const end = dayjs(m.meeting.endTime);
          return cursor.isBefore(end) && slotEnd.isAfter(start);
        });

        // Vérifie que le créneau est dans le futur
        const slotDateTime = dayjs(targetDate)
          .hour(cursor.hour())
          .minute(cursor.minute());
        const isFuture = slotDateTime.isAfter(dayjs());

        if (!isTaken && isFuture) {
          slots.push({
            date: targetDate,
            startTime: new Date(`1970-01-01T${cursor.format("HH:mm:ss")}Z`),
            endTime: new Date(`1970-01-01T${slotEnd.format("HH:mm:ss")}Z`),
          });
        }

        cursor = slotEnd;
      }
    }

    return slots;
  }

  // ── Créer le rendez-vous ───────────────────────────────────────────────────
  async create(data: CreateBooking, clientId: string) {
    // Vérifie que l'animal appartient au client
    const animal = await prisma.animal.findFirst({
      where: { id: data.animalId, client: { user: { id: clientId } } },
    });
    if (!animal)
      throw new BadRequestError("Animal introuvable ou non autorisé");

    // Vérifie que le veto est bien dans une clinique
    const veterinarianClinic = await prisma.veterinarianClinic.findFirst({
      where: { veterinarianId: data.veterinarianId },
    });
    if (!veterinarianClinic) throw new NotFoundError("Vétérinaire");

    // Vérifie que le créneau est toujours disponible (double vérification)
    const conflict = await prisma.meetingBase.findFirst({
      where: {
        date: data.date,
        animalMeeting: {
          veterinarianClinic: { veterinarianId: data.veterinarianId },
        },
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });
    if (conflict) throw new BadRequestError("Ce créneau n'est plus disponible");

    // Crée le rendez-vous
    const meeting = await prisma.meetingBase.create({
      data: {
        kind: "ANIMAL",
        type: "SPECIFIED",
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        animalMeeting: {
          create: {
            animalId: data.animalId,
            veterinarianClinicId: veterinarianClinic.id,
            description: data.description ?? null,
            specialityId: data.specialityId ?? null,
          },
        },
      },
      include: {
        animalMeeting: {
          include: {
            veterinarianClinic: {
              include: {
                clinic: true,
                veterinarian: {
                  include: { user: { omit: { password: true } } },
                },
              },
            },
            animal: true,
            speciality: true,
          },
        },
      },
    });

    const am = meeting.animalMeeting!;

    return {
      meetingId: meeting.id,
      clinic: {
        id: am.veterinarianClinic.clinic.id,
        name: am.veterinarianClinic.clinic.name,
        address: am.veterinarianClinic.clinic.address,
      },
      vet: {
        id: am.veterinarianClinic.veterinarian.id,
        user: {
          firstname: am.veterinarianClinic.veterinarian.user.firstname,
          lastname: am.veterinarianClinic.veterinarian.user.lastname,
        },
      },
      animal: {
        id: am.animal.id,
        name: am.animal.name,
      },
      slot: {
        date: meeting.date,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
      },
    };
  }

  // ── Helper : prochain créneau label ───────────────────────────────────────
  private _getNextSlotLabel(veterinarianClinics: any[]): string | null {
    const allDates: Date[] = [];

    for (const vc of veterinarianClinics) {
      for (const avail of vc.availabilities ?? []) {
        if (avail.meeting?.date) allDates.push(new Date(avail.meeting.date));
      }
    }

    if (allDates.length === 0) return null;

    const next = allDates.sort((a, b) => a.getTime() - b.getTime())[0];
    const d = dayjs(next);
    const today = dayjs().startOf("day");

    if (d.isSame(today, "day")) return "Aujourd'hui";
    if (d.isSame(today.add(1, "day"), "day")) return "Demain";
    return d.format("dddd D MMM");
  }
}
