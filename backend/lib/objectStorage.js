"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { UPLOADS_DIR, RECEIPTS_DIR, safeJoin } = require("./paths");

const IMAGE_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function isSupabaseStorageEnabled() {
  return process.env.UPLOAD_STORAGE?.toLowerCase() === "supabase";
}

function createFilename(file, prefix = "") {
  const extension = IMAGE_EXTENSIONS[file.mimetype];
  if (!extension) throw new Error("Unsupported image type");
  return `${prefix}${crypto.randomUUID()}${extension}`;
}

function getConfig() {
  const baseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when UPLOAD_STORAGE=supabase.");
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), serviceKey };
}

function objectUrl(baseUrl, bucket, key, mode = "object") {
  const encodedBucket = encodeURIComponent(bucket);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/${mode}/${encodedBucket}/${encodedKey}`;
}

async function storageRequest(url, options) {
  const { serviceKey } = getConfig();
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...options.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase Storage request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response;
}

async function saveUpload(file, { kind, filename }) {
  if (!file) throw new Error("Cannot store an empty upload");
  if (kind !== "product" && kind !== "receipt") throw new Error("Unknown upload type");
  const storedName = filename || file.filename || createFilename(file, kind === "receipt" ? "receipt-" : "");

  if (isSupabaseStorageEnabled()) {
    if (!file.buffer) throw new Error("Supabase Storage uploads require an in-memory upload buffer");
    const bucket = kind === "product"
      ? process.env.SUPABASE_PRODUCT_BUCKET || "product-images"
      : process.env.SUPABASE_RECEIPT_BUCKET || "payment-receipts";
    const key = kind === "product" ? `products/${storedName}` : storedName;
    const { baseUrl } = getConfig();
    await storageRequest(objectUrl(baseUrl, bucket, key), {
      method: "POST",
      headers: {
        "Content-Type": file.mimetype,
        "x-upsert": "true",
      },
      body: file.buffer,
    });
    return {
      filename: storedName,
      relativePath: kind === "product"
        ? getProductPublicUrl(storedName)
        : `/uploads/receipts/${storedName}`,
    };
  }

  if (!file.path || !file.filename) {
    throw new Error("Local upload did not produce a stored file");
  }
  return { filename: file.filename, relativePath: kind === "product" ? `/uploads/${file.filename}` : `/uploads/receipts/${file.filename}` };
}

async function discardTemporaryUpload(file) {
  if (!file?.path) return;
  await fs.unlink(file.path).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

function getProductPublicUrl(filename) {
  const { baseUrl } = getConfig();
  const bucket = process.env.SUPABASE_PRODUCT_BUCKET || "product-images";
  return objectUrl(baseUrl, bucket, `products/${filename}`, "object/public");
}

async function removeUpload(relativePath, kind) {
  if (kind !== "product" && kind !== "receipt") throw new Error("Unknown upload type");

  if (isSupabaseStorageEnabled()) {
    let filename;
    if (typeof relativePath === "string" && relativePath.startsWith("/uploads/")) {
      filename = path.basename(relativePath);
    } else if (kind === "product" && typeof relativePath === "string") {
      const { baseUrl } = getConfig();
      const bucket = process.env.SUPABASE_PRODUCT_BUCKET || "product-images";
      const publicPrefix = `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/products/`;
      if (!relativePath.startsWith(publicPrefix)) return;
      filename = decodeURIComponent(relativePath.slice(publicPrefix.length));
    } else {
      return;
    }
    if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename === "." || filename === "..") return;

    const bucket = kind === "product"
      ? process.env.SUPABASE_PRODUCT_BUCKET || "product-images"
      : process.env.SUPABASE_RECEIPT_BUCKET || "payment-receipts";
    const key = kind === "product" ? `products/${filename}` : filename;
    const { baseUrl } = getConfig();
    await storageRequest(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [key] }),
    });
    return;
  }

  if (typeof relativePath !== "string" || !relativePath.startsWith("/uploads/")) return;
  const filename = path.basename(relativePath);
  if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename === "." || filename === "..") return;
  const directory = kind === "product" ? UPLOADS_DIR : RECEIPTS_DIR;
  const target = safeJoin(directory, filename);
  if (!target) return;
  await fs.unlink(target).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

async function readReceipt(filename) {
  if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename === "." || filename === "..") {
    throw new Error("Invalid receipt filename");
  }

  if (isSupabaseStorageEnabled()) {
    const bucket = process.env.SUPABASE_RECEIPT_BUCKET || "payment-receipts";
    const { baseUrl } = getConfig();
    const response = await storageRequest(objectUrl(baseUrl, bucket, filename, "object/authenticated"), {
      method: "GET",
    });
    return { buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "application/octet-stream" };
  }

  const target = safeJoin(RECEIPTS_DIR, filename);
  if (!target) throw new Error("Invalid receipt filename");
  return { path: target };
}

function createImageUpload({ multer, destination, prefix, limits = { fileSize: 5 * 1024 * 1024, files: 1 } }) {
  const imageTypes = new Set(Object.keys(IMAGE_EXTENSIONS));
  const storage = isSupabaseStorageEnabled()
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (req, file, callback) => callback(null, destination),
        filename: (req, file, callback) => callback(null, createFilename(file, prefix)),
      });
  return multer({
    storage,
    limits,
    fileFilter: (req, file, callback) => {
      if (!imageTypes.has(file.mimetype)) {
        return callback(new Error("Only JPEG, PNG or WebP images are allowed"));
      }
      callback(null, true);
    },
  });
}

module.exports = {
  createFilename,
  createImageUpload,
  discardTemporaryUpload,
  getProductPublicUrl,
  isSupabaseStorageEnabled,
  readReceipt,
  removeUpload,
  saveUpload,
};
