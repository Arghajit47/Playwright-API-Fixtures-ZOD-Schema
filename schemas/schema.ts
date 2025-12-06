import { z } from "zod";

export const LOGIN_API_SCHEMA = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    id: z.number(),
    username: z.string(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    gender: z.enum(["male", "female"]),
    image: z.string().url(),
  })
  .strict();

export const getUserSchema = z
  .array(LOGIN_API_SCHEMA)
  .or(z.array(z.any()).length(0));
