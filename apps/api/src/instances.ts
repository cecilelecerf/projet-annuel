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

// ── Product ──────────────────────────────────────
import { ProductRepository } from "./products/product.repository";
import { ProductClinicRepository } from "./products/product-clinic.repository";
import { BrandRepository } from "./brands/brand.repository";
import { ProductRequestRepository } from "./product-requests/product-request.repository";

// ── Clinic ──────────────────────────────────────
import { SpecialityRepository } from "./specialities/speciality.repository";

// Chat
import { ContactsRepository } from "./messaging/contacts.repository";
import { MessageRepository } from "./messaging/message.repository";
import { ConversationRepository } from "./messaging/conversation.repository";

// ── Staff ─────────────────────────────────────────────────────
import { StaffRepository } from "./staffs/staff.repository";

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
import { ProductService } from "./products/product.service";
import { BrandService } from "./brands/brand.service";
import { SpecialityService } from "./specialities/speciality.service";
import { BookingService } from "./bookings/booking.service";
import { MessagingService } from "./messaging/messaging.service";
import { StaffService } from "./staffs/staff.service";
import { ProductRequestService } from "./product-requests/product-request.service";

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
import { ProductController } from "./products/product.controller";
import { BrandController } from "./brands/brand.controller";
import { BookingController } from "./bookings/booking.controller";
import { SpecialityController } from "./specialities/speciality.controller";
import { ClinicRepository } from "./clinics/clinic.repository";
import { MessagingController } from "./messaging/messaging.controller";
import { ReviewRepository } from "./reviews/review.repository";
import { StaffController } from "./staffs/staff.controller";
import { ProductRequestController } from "./product-requests/product-request.controller";

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

const productRepository = new ProductRepository(prisma);
const productClinicRepository = new ProductClinicRepository(prisma);
const brandRepository = new BrandRepository(prisma);
const productRequestRepository = new ProductRequestRepository(prisma);
const specialityRepository = new SpecialityRepository(prisma);

const clinicRepository = new ClinicRepository(prisma);
const messageRepository = new MessageRepository(prisma);
const contactsRepository = new ContactsRepository(prisma);
const conversationRepository = new ConversationRepository(prisma);
const reviewRepository = new ReviewRepository(prisma);
const staffRepository = new StaffRepository(prisma);

// ═══════════════════════════════════════════════════════════════
// ── Services (instanciation) ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════

const emailService = new EmailService();
const clinicService = new ClinicService(clinicRepository);
const staffService = new StaffService(staffRepository, clinicService);

const userService = new UserService(
  userRepository,
  clinicService,
  staffService,
);

const authService = new AuthService();

const actService = new ActService(actRepository, clinicActRepository);

const animalService = new AnimalService(animalRepository, vaccineRepository);

const medicalHistoryService = new AnimalMedicalHistoryService(
  medicalHistoryRepository,
  animalMeetingRepository,
  animalRepository,
  vaccineRepository,
  veterinarianClinicRepository,
  clinicActRepository,
);

const prescriptionService = new PrescriptionService(prescriptionRepository);

const veterinarianClinicService = new VeterinarianClinicService(
  veterinarianClinicRepository,
);

const adminService = new AdminService();
const directorService = new DirectorService();
const referentService = new ReferentService();
const reviewService = new ReviewService(reviewRepository);

const recurringService = new RecurringService(
  recurringRepository,
  internalMeetingRepository,
);

const internalMeetingService = new InternalMeetingService(
  internalMeetingRepository,
  recurringService,
);

const availabilityService = new AvailabilityService(
  availabilityRepository,
  recurringService,
);

const animalMeetingService = new AnimalMeetingService(
  animalMeetingRepository,
  userRepository,
  emailService,
);
const meetingService = new MeetingService(meetingRepository);

const bookingService = new BookingService(
  bookingRepository,
  clinicRepository,
  meetingService,
);

const productService = new ProductService(
  productRepository,
  productClinicRepository,
);
const brandService = new BrandService(brandRepository);

const specialityService = new SpecialityService(specialityRepository);
const messaginService = new MessagingService(
  messageRepository,
  conversationRepository,
  contactsRepository,
);

const productRequestService = new ProductRequestService(
  productRequestRepository,
  productRepository,
  brandRepository,
);

// ═══════════════════════════════════════════════════════════════
// ── Controllers (instanciation) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════

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
  clinicService,
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

export const productController = new ProductController(productService);
export const brandController = new BrandController(brandService);
export const messagingController = new MessagingController(messaginService);
export const staffController = new StaffController(staffService);
export const productRequestController = new ProductRequestController(productRequestService);