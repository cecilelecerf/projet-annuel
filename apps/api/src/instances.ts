import { prisma } from "@api/lib/prisma";

// ═══════════════════════════════════════════════════════════════
// Repositories
// ═══════════════════════════════════════════════════════════════

// ── Acts ──────────────────────────────────────────────────────
import { ActRepository } from "./acts/act.repository";
import { ClinicActRepository } from "./acts/clinic-act.repository";

// ── Animals ───────────────────────────────────────────────────
import { AnimalRepository } from "./animals/animal.repository";

// ── Medical histories ─────────────────────────────────────────
import { AnimalMedicalHistoryRepository } from "./medicalHistories/medical-history.repository";

// ── Meetings ──────────────────────────────────────────────────
import { MeetingRepository } from "./meetings/meeting.repository";
import { AnimalMeetingRepository } from "./meetings/animal-meeting/animal-meeting.repository";
import { AvailabilityRepository } from "./meetings/availabilities/availability.repository";
import { InternalMeetingRepository } from "./meetings/internal-meeting/internal-meeting.repository";
import { RecurringRepository } from "./meetings/recurring-meeting/recurring-meeting.repository";
import { BookingRepository } from "./bookings/booking.repository";

// ── Prescriptions ─────────────────────────────────────────────
import { PrescriptionRepository } from "./prescriptions/prescription.repository";

// ── Users ─────────────────────────────────────────────────────
import { UserRepository } from "./users/user.repository";

// ── Vaccines ──────────────────────────────────────────────────
import { VaccineRepository } from "./vaccines/vaccine.repository";

// ── Veterinarian-clinics ──────────────────────────────────────
import { VeterinarianClinicRepository } from "./clinics/veterinarian-clinics/veterinarian-clinic.repository";

// ═══════════════════════════════════════════════════════════════
// Services
// ═══════════════════════════════════════════════════════════════

import { ActService } from "./acts/act.service";
import { AdminService } from "./admins/admin.service";
import { AnimalService } from "./animals/animal.service";
import { AuthService } from "./auth/auth.service";
import { ClinicService } from "./clinics/clinic.service";
import { VeterinarianClinicService } from "./clinics/veterinarian-clinics/veterinarian-clinic.service";
import { DirectorService } from "./directors/director.service";
import { EmailService } from "./emails/email.service";
import { MeetingService } from "./meetings/meeting.service";
import { AnimalMeetingService } from "./meetings/animal-meeting/animal-meeting.service";
import { AvailabilityService } from "./meetings/availabilities/availability.service";
import { InternalMeetingService } from "./meetings/internal-meeting/internal-meeting.service";
import { RecurringService } from "./meetings/recurring-meeting/recurring-meeting.service";
import { PrescriptionService } from "./prescriptions/prescription.service";
import { ReferentService } from "./referents/referent.service";
import { ReviewService } from "./reviews/review.service";
import { UserService } from "./users/user.service";
import { BookingService } from "./bookings/booking.service";

// ═══════════════════════════════════════════════════════════════
// Controllers
// ═══════════════════════════════════════════════════════════════

import { ActController } from "./acts/act.controller";
import { AdminController } from "./admins/admin.controller";
import { AnimalController } from "./animals/animal.controller";
import { AuthController } from "./auth/auth.controller";
import { ClinicController } from "./clinics/clinic.controller";
import { DirectorController } from "./directors/director.controller";
import { MeetingController } from "./meetings/meeting.controller";
import { AnimalMeetingController } from "./meetings/animal-meeting/animal-meeting.controller";
import { AvailabilityController } from "./meetings/availabilities/availability.controller";
import { InternalMeetingController } from "./meetings/internal-meeting/internal-meeting.controller";
import { PrescriptionController } from "./prescriptions/prescription.controller";
import { ReferentController } from "./referents/referent.controller";
import { ReviewController } from "./reviews/review.controller";
import { UserController } from "./users/user.controller";
import { AnimalMedicalHistoryService } from "./medicalHistories/medical-history.service";
import { AnimalMedicalHistoryController } from "./medicalHistories/medical-history.controller";
import { RecurringMeetingController } from "./meetings/recurring-meeting/recurring-meeting.controller";
import { BookingController } from "./bookings/booking.controller";
import { SpecialityRepository } from "./specialities/speciality.repository";
import { SpecialityService } from "./specialities/speciality.service";
import { SpecialityController } from "./specialities/speciality.controller";
import { ClinicRepository } from "./clinics/clinic.repository";

// ═══════════════════════════════════════════════════════════════
// ── Repositories (instanciation) ──────────────────────────────
// ═══════════════════════════════════════════════════════════════

const actRepository = new ActRepository(prisma);
const clinicActRepository = new ClinicActRepository(prisma);
const animalRepository = new AnimalRepository(prisma);
const medicalHistoryRepository = new AnimalMedicalHistoryRepository(prisma);

const meetingRepository = new MeetingRepository(prisma);
const animalMeetingRepository = new AnimalMeetingRepository(prisma);
const availabilityRepository = new AvailabilityRepository(prisma);
const internalMeetingRepository = new InternalMeetingRepository(prisma);
const recurringRepository = new RecurringRepository(prisma);
const bookingRepository = new BookingRepository(prisma);

const prescriptionRepository = new PrescriptionRepository(prisma);
const userRepository = new UserRepository(prisma);
const vaccineRepository = new VaccineRepository(prisma);
const veterinarianClinicRepository = new VeterinarianClinicRepository(prisma);
const clinicRepository = new ClinicRepository(prisma);
// ═══════════════════════════════════════════════════════════════
// ── Services (instanciation) ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════

export const emailService = new EmailService();

export const userService = new UserService(userRepository);

export const authService = new AuthService();

export const actService = new ActService(actRepository, clinicActRepository);

export const animalService = new AnimalService(
  animalRepository,
  vaccineRepository,
);

export const medicalHistoryService = new AnimalMedicalHistoryService(
  medicalHistoryRepository,
  animalMeetingRepository,
  animalRepository,
  vaccineRepository,
  veterinarianClinicRepository,
  clinicActRepository,
);

export const prescriptionService = new PrescriptionService(
  prescriptionRepository,
);

export const veterinarianClinicService = new VeterinarianClinicService(
  veterinarianClinicRepository,
);

export const clinicService = new ClinicService(clinicRepository);

export const adminService = new AdminService();
export const directorService = new DirectorService();
export const referentService = new ReferentService();
export const reviewService = new ReviewService();

export const internalMeetingService = new InternalMeetingService(
  internalMeetingRepository,
);

export const recurringService = new RecurringService(
  recurringRepository,
  internalMeetingRepository,
);

export const availabilityService = new AvailabilityService(
  availabilityRepository,
  recurringService,
);

export const animalMeetingService = new AnimalMeetingService(
  animalMeetingRepository,
  userRepository,
  emailService,
);
export const meetingService = new MeetingService(meetingRepository);

export const bookingService = new BookingService(
  bookingRepository,
  clinicRepository,
  meetingService,
);

// ═══════════════════════════════════════════════════════════════
// ── Controllers (instanciation) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════

const specialityRepository = new SpecialityRepository(prisma);
const specialityService = new SpecialityService(specialityRepository);
export const specialityController = new SpecialityController(specialityService);
export const actController = new ActController(actService);
export const adminController = new AdminController();
export const animalController = new AnimalController(animalService);
export const authController = new AuthController(authService);
export const clinicController = new ClinicController(clinicService);
export const directorController = new DirectorController(directorService);
export const medicalHistoryController = new AnimalMedicalHistoryController(
  medicalHistoryService,
);
export const meetingController = new MeetingController(
  meetingService,
  userService,
  animalMeetingService,
  availabilityService,
  internalMeetingService,
);
export const animalMeetingController = new AnimalMeetingController(
  animalMeetingService,
);
export const bookingController = new BookingController(bookingService);
export const availabilityController = new AvailabilityController(
  availabilityService,
);
export const internalMeetingController = new InternalMeetingController(
  internalMeetingService,
);
export const recurringController = new RecurringMeetingController(
  recurringService,
);
export const prescriptionController = new PrescriptionController(
  prescriptionService,
);
export const referentController = new ReferentController(referentService);
export const reviewController = new ReviewController(reviewService);
export const userController = new UserController(userService);
