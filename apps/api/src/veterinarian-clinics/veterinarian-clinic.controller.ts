import { VeterinarianClinicService } from "./veterinarian-clinic.service";

export class VeterinarianClinicController {
  constructor(private service: VeterinarianClinicService) {}

  // async getById(
  //   req: RequestWithParams<{ id: VeterinarianClinicId }>,
  //   res: Response,
  //   next: NextFunction,
  // ) {
  //   try {
  //     const staff = await this.service.getById({
  //       id: req.params.id,
  //     });
  //     res.status(200).json(staffMemberSchema.array().parse(staff));
  //   } catch (err) {
  //     next(err);
  //   }
  // }
}
