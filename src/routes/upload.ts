import { randomUUID } from "crypto";
import { extname, resolve } from "path";
import { FastifyInstance } from "fastify";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

const pump = promisify(pipeline);

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload", async (req, reply) => {
    const upload = await req.file({
      limits: {
        fileSize: 5_242_880, // 5mb
      },
    });

    if (!upload) {
      return reply.status(400).send;
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/;
    const isValidMimeType = mimeTypeRegex.test(upload.mimetype);

    if (!isValidMimeType) {
      return reply.status(400).send();
    }

    const fileId = randomUUID();
    const extension = extname(upload.filename);

    const fileName = fileId.concat(extension);

    const writeStream = createWriteStream(
      resolve(__dirname, "../../uploads", fileName)
    );

    await pump(upload.file, writeStream);

    const fullUrl = req.protocol.concat("://").concat(req.hostname);
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString();

    return { fileUrl };
  });
}
