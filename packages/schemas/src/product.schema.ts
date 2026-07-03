import { z } from "zod";
import {
  brandIdSchema,
  productIdSchema,
  foodIdSchema,
  productClinicIdSchema,
  clinicIdSchema,
  healthConditionIdSchema,
} from "./ids";

// ── Brand ─────────────────────────────────────────────────────────────────────
export const brandSchema = z.object({
  id: brandIdSchema,
  name: z.string().min(1),
  logo: z.url().nullable().optional(),
});

export const createBrandSchema = brandSchema.omit({ id: true });
export const updateBrandSchema = createBrandSchema.partial();

export type Brand = z.infer<typeof brandSchema>;
export type CreateBrand = z.infer<typeof createBrandSchema>;
export type UpdateBrand = z.infer<typeof updateBrandSchema>;

// ── Product ───────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  id: productIdSchema,
  brandId: brandIdSchema,
  name: z.string().min(1),
  qrCode: z.string().min(1).max(255),
  websiteUrl: z.url().nullable().optional(),
  picture: z.url().nullable().optional(),
  description: z.string().max(255).nullable().optional(),
});

export const createProductSchema = productSchema
  .omit({ id: true, qrCode: true })
  .extend({
    qrCode: z.string().min(1).max(255).optional(),
  });
export const updateProductSchema = createProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;

// ── Food (extends Product) ────────────────────────────────────────────────────
export const foodTypeSchema = z.enum(["kibble", "wet"]);

export const foodSchema = z.object({
  id: foodIdSchema, // FK → product.id
  caloriesPer100: z.number().multipleOf(0.01).nullable().optional(), // DECIMAL(6,2)
  proteinPercentage: z.number().nullable().optional(),
  fatPercentage: z.number().multipleOf(0.01).nullable().optional(), // DECIMAL(5,2)
  fiberPercentage: z.number().multipleOf(0.01).default(5.2).optional(), // DECIMAL DEFAULT 5.2
  moisturePercentage: z.number().multipleOf(0.01).default(5.2).optional(),
  type: foodTypeSchema.default("kibble"),
});

export const createFoodSchema = foodSchema.omit({ id: true });
export const updateFoodSchema = createFoodSchema.partial();

export type FoodType = z.infer<typeof foodTypeSchema>;
export type Food = z.infer<typeof foodSchema>;
export type CreateFood = z.infer<typeof createFoodSchema>;
export type UpdateFood = z.infer<typeof updateFoodSchema>;

// ── ProductClinic (stock par clinique) ────────────────────────────────────────
export const productClinicSchema = z.object({
  id: productClinicIdSchema,
  clinicId: clinicIdSchema,
  productId: productIdSchema,
  stock: z.number().int().nonnegative(),
  minimumRequired: z.number().int().nonnegative(),
  price: z.coerce.number().nonnegative(),
});

export const createProductClinicSchema = productClinicSchema.omit({ id: true });
export const updateProductClinicSchema = createProductClinicSchema.partial();

export type ProductClinic = z.infer<typeof productClinicSchema>;
export type CreateProductClinic = z.infer<typeof createProductClinicSchema>;
export type UpdateProductClinic = z.infer<typeof updateProductClinicSchema>;

// ── FoodHealthCondition (recommandation alimentaire) ──────────────────────────
export const foodRecommendationSchema = z.enum(["recommended", "avoid"]);

export const foodHealthConditionSchema = z.object({
  id: z.uuid().brand("FoodHealthConditionId"),
  foodId: foodIdSchema,
  healthConditionId: healthConditionIdSchema,
  recommendation: foodRecommendationSchema,
});

export const createFoodHealthConditionSchema = foodHealthConditionSchema.omit({
  id: true,
});

export type FoodRecommendation = z.infer<typeof foodRecommendationSchema>;
export type FoodHealthCondition = z.infer<typeof foodHealthConditionSchema>;
export type CreateFoodHealthCondition = z.infer<
  typeof createFoodHealthConditionSchema
>;

export const restockProductClinicSchema = z.object({
  quantity: z.number().int().positive(),
});

export type RestockProductClinic = z.infer<typeof restockProductClinicSchema>;