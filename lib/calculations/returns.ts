import { contributionReturnSeed } from "@/lib/storage/defaults";
import type { Account } from "@/types";

export const defaultReturnForAccount = (
  account: Account,
  investedReturn: number,
) =>
  contributionReturnSeed[account.id] ??
  (account.type === "cash" ? 3 : investedReturn);
