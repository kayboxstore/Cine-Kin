export function isDuplicateKeyError(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    errno?: number;
    cause?: { code?: string; errno?: number };
  };
  return (
    candidate?.code === "ER_DUP_ENTRY" ||
    candidate?.errno === 1062 ||
    candidate?.cause?.code === "ER_DUP_ENTRY" ||
    candidate?.cause?.errno === 1062
  );
}
