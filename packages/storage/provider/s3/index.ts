import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  GetSignedUploadUrlHandler,
  GetSignedUrlHander,
} from "../../types";

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }

  const s3Endpoint = process.env.S3_ENDPOINT as string;
  if (!s3Endpoint) {
    console.error("Missing env variable S3_ENDPOINT");
  }

  const s3Region = process.env.S3_REGION as string;
  if (!s3Region) {
    console.error("Missing env variable S3_REGION");
  }

  const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID as string;
  if (!s3AccessKeyId) {
    console.error("Missing env variable S3_ACCESS_KEY_ID");
  }

  const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY as string;
  if (!s3SecretAccessKey) {
    console.error("Missing env variable S3_SECRET_ACCESS_KEY");
  }

  s3Client = new S3Client({
    region: s3Region,
    endpoint: s3Endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
    },
  });

  return s3Client;
};

export const getSignedUploadUrl: GetSignedUploadUrlHandler = async (
  path,
  { bucket },
) => {
  const s3Client = getS3Client();
  try {
    return await getS3SignedUrl(
      s3Client,
      new PutObjectCommand({ Bucket: bucket, Key: path }),
      {
        expiresIn: 60,
      },
    );
  } catch (e) {
    console.error(e);
    throw new Error("Could not get signed upload url");
  }
};

export const getSignedUrl: GetSignedUrlHander = async (
  path,
  { bucket, expiresIn },
) => {
  const s3Client = getS3Client();
  try {
    return getS3SignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: path }),
      { expiresIn },
    );
  } catch (e) {
    console.error(e);
    throw new Error("Could not get signed url");
  }
};
