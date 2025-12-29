import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  // User authentication can be implemented here
  // For now, returning null (unauthenticated)
  const user: User | null = null;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
