import { BadRequestError, NotFoundError } from "@api/errors";
import type { BookingSearchQuery, CreateBooking } from "@armali/schemas";
import { BookingRepository } from "./booking.repository";
import { prisma } from "@api/lib/prisma";
import dayjs from "dayjs";
import { ClinicRepository } from "@api/clinics/clinic.repository";
import { haversineKm } from "@api/utils/distance";
import { MeetingService } from "@api/meetings";
import {
  Availability,
  MeetingBase,
  User,
  VeterinarianClinic,
  VeterinarianProfile,
} from "../../prisma/generated/prisma/client";
import { withAvatarUrl } from "@api/users/user.utils";

export class BookingService {
  constructor(
    private repository: BookingRepository,
    private clinicRepository: ClinicRepository,
    private meetingService: MeetingService,
  ) {}
  // ── Recherche de cliniques ─────────────────────────────────────────────────
  async searchClinics(query: BookingSearchQuery) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Phase 1 : préfiltre large en base (candidats potentiels)
    const candidates = await this.clinicRepository.searchClinics({
      ...query,
      startDate: startOfDay,
      endDate: endOfDay,
    });

    // Phase 2 : vérification précise (RRule, jour de semaine, exceptions)
    const clinicsWithRealAvailability = await Promise.all(
      candidates.map(async (clinic) => {
        const vetsWithAvailability = await Promise.all(
          clinic.veterinarianClinics.map(async (vc) => {
            const availabilities = await this.meetingService.getAvailabilities({
              userId: vc.veterinarian.user.id,
              start: startOfDay,
              end: endOfDay,
            });
            return availabilities.length > 0 ? vc : null;
          }),
        );

        const filteredVets = vetsWithAvailability.filter(
          (v): v is (typeof clinic.veterinarianClinics)[number] => v !== null,
        );

        return filteredVets.length > 0
          ? { ...clinic, veterinarianClinics: filteredVets }
          : null;
      }),
    );

    const realClinics = clinicsWithRealAvailability.filter(
      (c): c is NonNullable<typeof c> => c !== null,
    );

    // Phase 3 : mapping + distance + filtre rayon + tri (restauré)
    return realClinics
      .map((clinic) => {
        const specialities = [
          ...new Set(
            clinic.veterinarianClinics.flatMap((vc) =>
              vc.veterinarian.specialities.map((s) => s.name),
            ),
          ),
        ];
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
        avatarUrl: withAvatarUrl(vc.veterinarian.user).avatarUrl,
      },
      specialities: vc.veterinarian.specialities.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      rating: null,
    }));
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
    // TODO : utiliser un service ou repository
    const veterinarianClinic = await prisma.veterinarianClinic.findFirst({
      where: { veterinarianId: data.veterinarianId },
    });
    if (!veterinarianClinic) throw new NotFoundError("Vétérinaire");

    // Vérifie que le créneau est toujours disponible (double vérification)
    // TODO : utiliser un service ou repository
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
    // TODO : utiliser un service ou repository
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
                  include: {
                    user: {
                      omit: { password: true },
                      include: { avatar: true },
                    },
                  },
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
        id: am.veterinarianClinic?.clinic.id,
        name: am.veterinarianClinic?.clinic.name,
        address: am.veterinarianClinic?.clinic.address,
      },
      vet: {
        id: am.veterinarianClinic?.veterinarian.id,
        user: {
          firstname: am.veterinarianClinic?.veterinarian.user.firstname,
          lastname: am.veterinarianClinic?.veterinarian.user.lastname,
          avatarUrl: am.veterinarianClinic
            ? withAvatarUrl(am.veterinarianClinic?.veterinarian.user).avatarUrl
            : null,
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
  private _getNextSlotLabel(
    veterinarianClinics: (VeterinarianClinic & {
      veterinarian: VeterinarianProfile & {
        user: User & {
          availabilities: (Availability & { meeting: MeetingBase | null })[];
        };
      };
    })[],
  ): string | null {
    const allDates: Date[] = [];

    for (const vc of veterinarianClinics) {
      // Fix : les disponibilités remontent sous veterinarian.user.availabilities,
      // pas directement sur vc (bug préexistant, nextSlot était toujours null)
      for (const avail of vc.veterinarian?.user?.availabilities ?? []) {
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
