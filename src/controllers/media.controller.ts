import { Request, Response } from "express";
import path from "path";


export const uploadSingleImageController = async (req: Request, res: Response) => {
    const formidable = (await import("formidable")).default
    const form = formidable({
        uploadDir: path.resolve("uploads"),
        maxFiles: 1,
        keepExtensions: true,
        maxFileSize: 300 * 1024 //300KB
    });

    form.parse(req, (err, fields, files) => {
        if(err){
            console.error(err)
            res.status(400).json({ message: 'Upload thất bại', error: err.message })
        }
        res.status(200).json({
           message:  "upload thanh cong"
        })
    })
}