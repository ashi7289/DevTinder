const crypto = require("crypto");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getCredentials, getS3Region } = require("../config/aws");

const PHOTO_FOLDER = "profile-photos/";

// Env vars are read when these run (after dotenv has loaded), not at import
const getBucket = () => process.env.AWS_S3_BUCKET;
const getBucketUrl = () =>
  `https://${getBucket()}.s3.${getS3Region()}.amazonaws.com/`;

let client;
const getS3Client = () => {
  if (!client) {
    client = new S3Client({
      region: getS3Region(),
      credentials: getCredentials(),
    });
  }
  return client;
};

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Upload a profile photo and return its public URL
const uploadProfilePhoto = async (userId, file) => {
  const bucket = getBucket();
  if (!bucket) throw new Error("AWS_S3_BUCKET is not set");

  // Random name so a new photo never reuses an old (cached) URL
  const key = `${PHOTO_FOLDER}${userId}-${crypto.randomUUID()}.${EXTENSIONS[file.mimetype]}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return getBucketUrl() + key;
};

// Delete a photo, but only if it's one we uploaded (not the default avatar)
const deleteProfilePhoto = async (photoUrl) => {
  const bucket = getBucket();
  const bucketUrl = getBucketUrl();
  if (!bucket || !photoUrl?.startsWith(bucketUrl + PHOTO_FOLDER)) return;

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: photoUrl.slice(bucketUrl.length),
    })
  );
};

module.exports = {
  uploadProfilePhoto,
  deleteProfilePhoto,
  ALLOWED_PHOTO_TYPES: Object.keys(EXTENSIONS),
};
