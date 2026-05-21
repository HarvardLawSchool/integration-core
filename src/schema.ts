import { z } from "zod";

export const TemporalInstantSchema = z.union([
  z.string()
    .refine((val) => {
      try {
        Temporal.Instant.from(val);
        return true;
      } catch {
        return false;
      }
    }, { message: "Invalid Temporal Instant string" })
    .transform((val) => Temporal.Instant.from(val)),
  z.instanceof(Temporal.Instant),
]);
