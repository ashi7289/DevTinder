const DEFAULT_REGION = "eu-north-1";

// Everything is read from process.env when called (not when this file is
// imported), so it no longer depends on dotenv having run first.
const getCredentials = () => ({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const getS3Region = () => process.env.AWS_S3_REGION || DEFAULT_REGION;

// SES can live in a different region than S3; falls back to the S3 region
const getSesRegion = () =>
  process.env.AWS_SES_REGION || process.env.AWS_S3_REGION || DEFAULT_REGION;

module.exports = { getCredentials, getS3Region, getSesRegion };
