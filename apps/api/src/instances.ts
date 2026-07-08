import { prisma } from "@api/lib/prisma";

// ═══════════════════════════════════════════════════════════════
// Repositories
// ═══════════════════════════════════════════════════════════════

// ── Acts ──────────────────────────────────────────────────────
import { ActRepository } from "./acts/act.repository";
import { ClinicActRepository } from "./clinic-acts/clinic-act.repository";

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
import { VeterinarianClinicRepository } from "./veterinarian-clinics/veterinarian-clinic.repository";

// ── Product ──────────────────────────────────────
import { ProductRepository } from "./products/product.repository";
import { ProductClinicRepository } from "./products/product-clinic.repository";
import { BrandRepository } from "./brands/brand.repository";
import { ProductRequestRepository } from "./product-requests/product-request.repository";
import { OrderRepository } from "./orders/order.repository";

// ── Clinic ──────────────────────────────────────
import { SpecialityRepository } from "./specialities/speciality.repository";
import { ClinicRequestRepository } from "./clinics/requests/request.repository";

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
import { AnimalService } from "./animals/animal.service";
import { AuthService } from "./auth/auth.service";
import { ClinicService } from "./clinics/clinic.service";
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
import { ClientShopService } from "./shop/shop.service";
import { OrderService } from "./orders/order.service";
import { SalesService } from "./sales/sales.service";
import { ClinicRequestService } from "./clinics/requests/request.service";
import { DashboardService } from "./dashboard/dashboard.service";

// ═══════════════════════════════════════════════════════════════
// Controllers
// ═══════════════════════════════════════════════════════════════

import { ActController } from "./acts/act.controller";
import { AnimalController } from "./animals/animal.controller";
import { AuthController } from "./auth/auth.controller";
import { ClinicController } from "./clinics/clinic.controller";
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
import { ClientShopController } from "./shop/shop.controller";
import { OrderController } from "./orders/order.controller";
import { SalesController } from "./sales/sales.controller";

import { ClinicRequestController } from "./clinics/requests/request.controller";
import { FileRepository } from "./files/file.repository";
import { FileService } from "./files/file.service";
import { ClinicActService } from "./clinic-acts/clinic-act.service";
import { ClinicActController } from "./clinic-acts/clinic-act.controller";
import { DashboardController } from "./dashboard/dashboard.controller";
// ═══════════════════════════════════════════════════════════════
// ── Repositories (instanciation) ──────────────────────────────
// ═══════════════════════════════════════════════════════════════

const actRepository = new ActRepository(prisma);
const clinicActRepository = new ClinicActRepository(prisma);
const animalRepository = new AnimalRepository(prisma);
const medicalHistoryRepository = new AnimalMedicalHistoryRepository(prisma);
const fileRepository = new FileRepository(prisma);
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
const orderRepository = new OrderRepository(prisma);
const specialityRepository = new SpecialityRepository(prisma);

const clinicRepository = new ClinicRepository(prisma);
const messageRepository = new MessageRepository(prisma);
const contactsRepository = new ContactsRepository(prisma);
const conversationRepository = new ConversationRepository(prisma);
const reviewRepository = new ReviewRepository(prisma);
const staffRepository = new StaffRepository(prisma);
const clinicRequestRepository = new ClinicRequestRepository(prisma);
// ═══════════════════════════════════════════════════════════════
// ── Services (instanciation) ──────────────────────────────────
// ═══════════════════════════════════════════════════════════════

const emailService = new EmailService();
const clinicService = new ClinicService(clinicRepository);
const staffService = new StaffService(staffRepository, clinicService);
const fileService = new FileService(fileRepository);
const userService = new UserService(
  userRepository,
  clinicService,
  staffService,
  fileService,
);

const authService = new AuthService();
const clinicActService = new ClinicActService(
  clinicActRepository,
  clinicService,
);
const actService = new ActService(actRepository);

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

const reviewService = new ReviewService(reviewRepository, clinicService);
const referentService = new ReferentService(
  reviewService,
  staffService,
  userService,
);

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
export const messagingService = new MessagingService(
  messageRepository,
  conversationRepository,
  contactsRepository,
);
const clinicRequestService = new ClinicRequestService(clinicRequestRepository);

const productRequestService = new ProductRequestService(
  productRequestRepository,
  productRepository,
  brandRepository,
);

const clientShopService = new ClientShopService();

export const orderService = new OrderService(orderRepository, emailService);
export const salesService = new SalesService();

export const dashboardService = new DashboardService(
  reviewService,
  staffService,
  userService,
  clinicService,
  meetingService,
  orderRepository,
);

// ═══════════════════════════════════════════════════════════════
// ── Controllers (instanciation) ───────────────────────────────
// ═══════════════════════════════════════════════════════════════

export const specialityController = new SpecialityController(specialityService);
export const actController = new ActController(actService);
export const animalController = new AnimalController(animalService);
export const authController = new AuthController(authService);
export const clinicController = new ClinicController(clinicService);
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
export const clinicActController = new ClinicActController(clinicActService);
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
export const messagingController = new MessagingController(messagingService);
export const staffController = new StaffController(staffService);
export const productRequestController = new ProductRequestController(productRequestService);
export const clientShopController = new ClientShopController(clientShopService);
export const orderController = new OrderController(orderService);
export const salesController = new SalesController(salesService);
export const clinicRequestController = new ClinicRequestController(
  clinicRequestService,
);
export const dashboardController = new DashboardController(dashboardService);
