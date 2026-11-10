const crypto = require("crypto");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_S3_REGION || "eu-north-1";
const BUCKET = process.env.AWS_S3_BUCKET;
const PHOTO_FOLDER = "profile-photos/";

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const BUCKET_URL = `https://${BUCKET}.s3.${REGION}.amazonaws.com/`;

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Upload a profile photo and return its public URL
const uploadProfilePhoto = async (userId, file) => {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET is not set");

  // Random name so a new photo never reuses an old (cached) URL
  const key = `${PHOTO_FOLDER}${userId}-${crypto.randomUUID()}.${EXTENSIONS[file.mimetype]}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return BUCKET_URL + key;
};

// Delete a photo, but only if it's one we uploaded (not the default avatar)
const deleteProfilePhoto = async (photoUrl) => {
  if (!BUCKET || !photoUrl?.startsWith(BUCKET_URL + PHOTO_FOLDER)) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: photoUrl.slice(BUCKET_URL.length),
    })
  );
};

module.exports = {
  uploadProfilePhoto,
  deleteProfilePhoto,
  ALLOWED_PHOTO_TYPES: Object.keys(EXTENSIONS),
};
