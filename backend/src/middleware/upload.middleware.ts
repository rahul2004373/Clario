import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const ALLOWED_MIME = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXT = ['.pdf', '.txt', '.docx'];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const ext = '.' + (file.originalname.split('.').pop()?.toLowerCase() ?? '');
    if (!ALLOWED_MIME.includes(file.mimetype)) return cb(new Error(`Invalid MIME: ${file.mimetype}`));
    if (!ALLOWED_EXT.includes(ext)) return cb(new Error(`Invalid ext: ${ext}`));
    cb(null, true);
};

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    fileFilter,
}).single('file');