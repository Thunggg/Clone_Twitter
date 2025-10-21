import { Request } from 'express';
import fs from 'fs'
import path from 'path'
import { NotFoundError } from './CustomErrors';

export const initFolder = () => {
    const uploadFolderPath = path.resolve("uploads");

    if(!fs.existsSync(uploadFolderPath)){
        fs.mkdirSync(uploadFolderPath, {
            recursive: true
        })
    }
}

export const handleUploadFile = async (req: Request) => {
    const formidable = (await import("formidable")).default
    const form = formidable({
        uploadDir: path.resolve("uploads"),
        maxFiles: 1,
        keepExtensions: true,
        maxFileSize: 3000 * 1024, //300KB
        filter: function({name, originalFilename, mimetype}){
            console.log(name, originalFilename, mimetype )

            const valid = name === "image" && Boolean(mimetype?.includes("image/"))
            if(!valid){
                form.emit('error' as any, new NotFoundError("file is not valid") as any)
            }

            return valid
        }
    });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
        if(err){
            reject(err)
        }

        if(!Boolean(files.image)){
            return reject(new NotFoundError("file is empty"))
        }

        resolve(files)
    })
    })
}