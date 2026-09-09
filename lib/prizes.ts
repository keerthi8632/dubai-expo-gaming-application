// Funded-account prizes (USD 100 / USD 1,000) need a human follow-up to set
// the account up, unlike on-the-spot prizes (merchandise, academy access)
// that are just handed over with the claim code — so they get a different
// note in the result modal telling the player our team will reach out.
export function isFundedAccountPrize(prizeLabel: string | null | undefined): boolean {
  return !!prizeLabel && /funded account/i.test(prizeLabel);
}

export const FUNDED_ACCOUNT_NOTE = "Congrats! Our team will contact you soon to set up your funded account.";
