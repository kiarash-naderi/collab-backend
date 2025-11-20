export const toBuffer = (data: Uint8Array): Buffer => {
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
};

export const fromBuffer = (buffer: Buffer): Uint8Array => {
  return Uint8Array.from(buffer);
};

export const yjsToPrismaBytes = (data: Uint8Array): Uint8Array<ArrayBuffer> => {
  const buffer = Buffer.from(data);
  return Uint8Array.from(buffer) as Uint8Array<ArrayBuffer>;
};
export const prismaBytesToYjs = (buffer: Buffer): Uint8Array => {
  return Uint8Array.from(buffer);
};

