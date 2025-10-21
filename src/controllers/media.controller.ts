import { Request, Response } from "express";
import path from "path";
import fs from 'fs'
import { handleUploadFile } from "~/utils/file";

export const uploadSingleImageController = async (req: Request, res: Response) => {
    const data = await handleUploadFile(req)

    res.status(200).json(data)
}