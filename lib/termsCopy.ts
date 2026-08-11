export type TermsSection = {
  heading: string;
  intro?: string;
  facts?: { label: string; text: string }[];
  bullets?: string[];
  outro?: string;
};

export type TermsCopy = {
  title: string;
  subtitle: string;
  sections: TermsSection[];
};

export const TERMS_COPY: Record<"TRADE" | "SPIN", TermsCopy> = {
  TRADE: {
    title: "Trade Prediction Challenge - Terms and Conditions",
    subtitle: "Prime Funded Account Reward — Forex Expo Dubai 2026",
    sections: [
      {
        heading: "1. Promotion Overview",
        intro:
          "Eligible clients participating in the Trade Prediction Challenge at Forex Expo Dubai 2026 may receive a Prime Funded Account reward. This promotion is offered at MH Markets' sole discretion and is subject to eligibility verification, KYC compliance, and final approval by MH Markets.",
        facts: [
          { label: "Onsite Activity:", text: "September 22-23, 2026" },
          { label: "Venue:", text: "Forex Expo Dubai 2026" },
          {
            label: "Reward Fulfillment Window:",
            text: "Clients must complete KYC verification and meet the applicable trading volume requirement within thirty (30) calendar days from the date the reward is credited.",
          },
          { label: "Eligible Participants:", text: "All visitors to MH Markets' booth." },
        ],
      },
      {
        heading: "2. Eligibility & Claiming",
        bullets: [
          "Winning this round of the Trade Prediction Challenge entitles the participant to a reward set by MH Markets, subject to eligibility criteria.",
          "The reward will be credited automatically to the client's trading account, subject to KYC verification.",
          "Each client is entitled to one (1) reward under this promotion. Duplicate entries, multiple accounts, or attempts to claim more than one reward will result in disqualification.",
          "Clients must complete KYC verification before any withdrawal request can be processed on the trading account, subject to the verification steps below.",
        ],
      },
      {
        heading: "3. Reward Tiers & Trading Volume Requirements",
        outro:
          "To unlock withdrawal eligibility on a Prime Funded Account reward, clients must complete KYC verification and fulfill the minimum trading volume requirement.",
      },
    ],
  },
  SPIN: {
    title: "Spin & Win Promotion - Terms and Conditions",
    subtitle: "Prime Funded Account Reward — Forex Expo Dubai 2026",
    sections: [
      {
        heading: "1. Promotion Overview",
        intro:
          "Eligible clients participating in the Spin & Win Promotion at Forex Expo Dubai 2026 may receive a Prime Funded Account reward. This promotion is offered at MH Markets' sole discretion and is subject to eligibility verification, KYC compliance, and final approval by MH Markets.",
        facts: [
          { label: "Onsite Activity:", text: "September 22-23, 2026" },
          { label: "Venue:", text: "Forex Expo Dubai 2026" },
          {
            label: "Reward Fulfillment Window:",
            text: "Clients must complete KYC verification and meet the applicable trading volume requirement within thirty (30) calendar days from the date the reward is credited.",
          },
          { label: "Eligible Participants:", text: "All visitors to MH Markets' booth." },
        ],
      },
      {
        heading: "2. Eligibility & Claiming",
        bullets: [
          "Winning this round of the Spin & Win activity entitles the participant to a reward set by MH Markets, subject to eligibility criteria.",
          "The reward will be credited automatically to the client's trading account, subject to KYC verification.",
          "Each client is entitled to one (1) reward under this promotion. Duplicate entries, multiple accounts, or attempts to claim more than one reward will result in disqualification.",
          "Clients must complete KYC verification before any withdrawal request can be processed, subject to the verification steps below.",
        ],
      },
      {
        heading: "3. Reward Tiers & Trading Volume Requirements",
        outro:
          "To unlock withdrawal eligibility on a Prime Funded Account reward, clients must complete KYC verification and fulfill the minimum trading volume requirement.",
      },
    ],
  },
};
