import { FileService } from "./file.service";

import { Request, Response } from "express";
class FileController {
  // async uploadUrl(req: Request, res: Response) {
  //   try {
  //     const { key, contentType } = req.body;
  //     const url = await fileService.createUploadUrl(key, contentType);
  //     res.json({
  //       url,
  //       key,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       message: "Cannot create upload url",
  //     });
  //   }
  // }
  // async downloadUrl(req: Request, res: Response) {
  //   try {
  //     const { key } = req.body;
  //     const url = await fileService.createDownloadUrl(key);
  //     res.json({
  //       url,
  //     });
  //   } catch (error) {
  //     res.status(500).json({
  //       message: "Cannot create download url",
  //     });
  //   }
  // }
}

export default new FileController();
