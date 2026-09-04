// Bullet/paragraph text supports a lightweight **bold** span syntax, parsed
// by renderRichText() in TermsModal.tsx — avoids hand-authoring JSX for every
// inline emphasis (dates, quoted values, key terms) throughout this copy.
export type TermsBullet = {
  text: string;
  subBullets?: string[];
};

export type TermsTable = {
  headers: [string, string];
  rows: [string, string][];
};

export type TermsSection = {
  number: number;
  heading: string;
  // Sections 5/6 in the source doc run the heading straight into its lead
  // paragraph on one line (no bold, no line break) instead of a standalone
  // bold heading line followed by bullets — headingInline reproduces that.
  headingInline?: boolean;
  // "Risk Disclosure" isn't part of the numbered list in the source doc —
  // it's a standalone bold heading with no leading number.
  unnumbered?: boolean;
  intro?: string;
  // Rendered right after `intro`, before `bullets` — used by the Funded
  // Account reward-tiers section.
  table?: TermsTable;
  bullets?: TermsBullet[];
  outro?: string;
};

export type TermsCopy = {
  title: string;
  subtitle?: string;
  sections: TermsSection[];
};

export const TERMS_COPY: Record<"TRADE" | "SPIN", TermsCopy> = {
  TRADE: {
    title: "Trade Prediction Challenge — Terms & Conditions",
    sections: [
      {
        number: 1,
        heading: "Promotion Overview & Game Rules",
        bullets: [
          {
            text: "**Entertainment Purpose:** All market charts used in the Trade Prediction Challenge are strictly simulated for recreational purposes and do not represent real financial markets or live trading data.",
          },
          {
            text: "**Game Mechanics & Selection:**",
            subBullets: [
              'In the Trade Prediction Game, the participant must analyze the initial simulated chart and select either **"UP"** or **"DOWN"**.',
              "Upon submitting the prediction, additional data points and chart movements are revealed, and the closing price at the designated endpoint determines the final result.",
              "Once a prediction is submitted, it is final and cannot be altered, edited, or resubmitted.",
            ],
          },
          {
            text: "**Winning Criteria:** Participants who accurately predict the market outcome at the defined endpoint based on the simulated chart win the challenge.",
          },
        ],
      },
      {
        number: 2,
        heading: "Eligibility & Registration",
        bullets: [
          {
            text: "**Eligibility & Verification:** To be eligible to participate or play the Trade Prediction game, participants must:",
            subBullets: [
              "Visit the MH Markets booth during official expo dates (**September 22, 2026, and September 23, 2026**).",
              "Complete the registration process by filling out the designated form and providing accurate contact details (including full name, phone number, and email address).",
            ],
          },
          {
            text: "**Participation Limit:** Participation is open to all registered expo attendees. Each verified participant is entitled to **one (1) entry total** across the event duration. Duplicate entries, fake contact details, fraudulent attempts, or multiple submissions will result in immediate disqualification.",
          },
        ],
      },
      {
        number: 3,
        heading: "Rewards & Daily Claim Policy",
        bullets: [
          {
            text: "**Gold Coin Allocation:** A total of ten (10) Gold Coins will be awarded across the two-day event, structured as follows:",
            subBullets: [
              "**Day 1 (September 22):** The first five (5) winning participants will receive one (1) Gold Coin each.",
              "**Day 2 (September 23):** The first five (5) winning participants will receive one (1) Gold Coin each.",
            ],
          },
          {
            text: "**Distribution Basis:** Rewards are awarded strictly on a **first-come, first-served basis** each day based on the official time-stamp of successful prediction submissions. Once the daily limit of five (5) winners is reached, no further Gold Coins will be awarded for that day.",
          },
          {
            text: "**Availability & Transferability:** Rewards are non-transferable, subject to availability, and cannot be exchanged for cash.",
          },
        ],
      },
      {
        number: 4,
        heading: "Technical Issues & Dispute Rules",
        bullets: [
          {
            text: "**Technical Disruptions:** In the event of system errors, screen freezing, chart display failures, network connection drops, or any other technical glitch during gameplay, MH Markets reserves the right to void the affected attempt and grant a restart at its sole discretion.",
          },
          {
            text: "**Unresolved Results:** If a result cannot be recorded or verified due to a technical error, the attempt will be deemed void, and no reward will be issued for that specific instance.",
          },
        ],
      },
      {
        number: 5,
        heading: "MH Markets' Rights & Disqualification",
        headingInline: true,
        intro:
          "If MH Markets determines that a participant has violated these Terms, provided false or misleading information, or manipulated the promotion, MH Markets reserves the right to:",
        bullets: [
          { text: "Cancel, revoke, or withhold any reward or Gold Coin." },
          { text: "Deduct any related benefits or promotional privileges." },
          { text: "Restrict participation in current or future MH Markets promotions." },
          { text: "Disqualify the participant from promotion calculations." },
        ],
        outro:
          "MH Markets reserves the right to modify, suspend, or terminate the promotion or update these Terms at any time without prior notice. All decisions regarding eligibility, game functionality, winner selection, and reward entitlement are final and binding at MH Markets' sole discretion.",
      },
      {
        number: 6,
        heading: "Risk Disclosure",
        headingInline: true,
        intro:
          "This promotion and its simulated charts are only for entertainment purpose and do not constitute financial, investment, or trading advice. Trading CFDs and leveraged financial products carries a high level of risk and may not be suitable for all investors. Success or performance in this simulated game does not guarantee any actual trading outcome or future profit in real financial markets.",
      },
    ],
  },
  SPIN: {
    title: "Spin & Win Challenge — Terms & Conditions",
    sections: [
      {
        number: 1,
        heading: "Promotion Overview & Game Rules",
        bullets: [
          { text: "**Event Activity:** Participants spin the designated wheel at the MH Markets booth to land on a prize segment." },
          {
            text: "**Prizes & Rewards:** Rewards may include **Premium Merchandise**, **Amazon Vouchers**, and **Funded Account Vouchers** as indicated on the landed segment.",
          },
        ],
      },
      {
        number: 2,
        heading: "Reward Fulfillment & Redemption",
        bullets: [
          { text: "**Onsite Rewards:** Premium Merchandise and Amazon Vouchers are provided directly onsite at the booth upon winning." },
          {
            text: "**Funded Account Vouchers:** Winners of a Funded Account reward receive a voucher onsite. Claiming and activation are strictly subject to **dedicated Terms & Conditions for Funded Account Winners**.",
          },
          {
            text: "**Sales Outreach:** The MH Markets sales team will reach out within **two (2) business days** to guide winners through the dedicated claim process and account eligibility requirements.",
          },
        ],
      },
      {
        number: 3,
        heading: "Eligibility, Registration & Attempt Limit",
        bullets: [
          {
            text: "To become eligible to spin or play the game, participants must physically visit the MH Markets booth during the official expo dates: **September 22 and 23, 2026**.",
          },
          {
            text: "Participants must complete the required registration form before playing, including providing accurate contact details such as full name, email address, phone number, and any other information requested by MH Markets onsite.",
          },
          {
            text: "By registering, participants confirm that the information provided is true and complete and agree that MH Markets may use the submitted details to verify eligibility, administer the promotion, and contact winners regarding prize fulfillment.",
          },
          {
            text: "Participants who do not register, refuse to provide the required information, or provide incomplete or incorrect details will not be permitted to spin or play the game and may be disqualified from receiving any reward.",
          },
          {
            text: '**One Attempt Rule:** Each participant is strictly permitted **one (1) attempt**. The only exception is if the wheel lands directly on a "Spin Again" segment, granting one additional turn.',
          },
          { text: "Duplicate entries, unauthorized re-spins, or fraudulent attempts will result in immediate disqualification." },
        ],
      },
      {
        number: 4,
        heading: "MH Markets' Rights",
        headingInline: true,
        intro:
          "If MH Markets determines that a participant has violated these Terms, provided false information, or manipulated the promotion, MH Markets reserves the right to:",
        bullets: [
          { text: "Cancel, revoke, or withhold any reward, voucher, or prize." },
          { text: "Deduct any related profits generated through promotional credit, where applicable." },
          { text: "Restrict participation in current or future MH Markets promotions." },
          { text: "Disqualify the participant from promotion calculations." },
        ],
        outro:
          "MH Markets reserves the right to modify, suspend, or terminate the Spin & Win Promotion at any time without prior notice. All decisions regarding eligibility, spin outcomes, and prize entitlement are final and at MH Markets' sole discretion. Rewards are subject to availability.",
      },
      {
        number: 5,
        heading: "Technical Issues & Dispute Rules",
        bullets: [
          {
            text: "If the game screen freezes, the wheel, the result cannot be displayed, or any other technical issue, system error, connectivity issue, display issue, or operational interruption occurs, MH Markets reserves the right to void the affected attempt and restart the attempt at its sole discretion.",
          },
          { text: "MH Markets' decision on whether an attempt is valid, void, restarted, or disqualified is final and binding." },
        ],
      },
      {
        number: 6,
        heading: "Risk Disclosure",
        headingInline: true,
        intro:
          "This promotion does not constitute financial, investment, or trading advice. Trading CFDs and leveraged products carries a high level of risk and may not be suitable for all investors. Ensure you understand the associated risks before trading. Participation in this promotion does not guarantee future trading success or profits.",
      },
    ],
  },
};

// Read-only reference shown from the Spin & Win result screen when the prize
// is a Funded Account — distinct from TERMS_COPY.SPIN (the general gameplay
// consent shown before playing), this is the dedicated Prime Funded Account
// reward document.
export const FUNDED_ACCOUNT_TERMS: TermsCopy = {
  title: "Spin & Win Promotion — Terms and Conditions",
  subtitle: "Prime Funded Account Reward — Forex Expo Dubai 2026",
  sections: [
    {
      number: 1,
      heading: "Promotion Overview",
      intro:
        "Eligible clients participating in the Spin & Win Promotion at Forex Expo Dubai 2026 may receive a Prime Funded Account reward. This promotion is offered at MH Markets' sole discretion and is subject to eligibility verification, KYC compliance, and final approval by MH Markets.",
      bullets: [
        { text: "**Onsite Activity:** September 22-23, 2026" },
        { text: "**Venue:** Forex Expo Dubai 2026" },
        {
          text: "**Reward Fulfillment Window:** Clients must complete KYC verification and meet the applicable trading volume requirement within thirty (30) calendar days from the date the reward is credited.",
        },
        { text: "**Eligible Participants:** All visitors to MH Markets' booth." },
      ],
    },
    {
      number: 2,
      heading: "Eligibility & Claiming",
      bullets: [
        { text: "Participants must meet the eligibility criteria set by MH Markets to take part in the Spin & Win activity." },
        { text: "The reward will be credited automatically to the client's trading account, subject to KYC verification." },
        {
          text: "Each client is entitled to one (1) reward under this promotion. Duplicate entries, multiple accounts, or attempts to claim more than one reward will result in disqualification.",
        },
        { text: "Clients must complete KYC verification before any withdrawal request can be processed." },
      ],
    },
    {
      number: 3,
      heading: "Reward Tiers & Trading Volume Requirements",
      intro:
        "To unlock withdrawal eligibility on a Prime Funded Account reward, clients must complete KYC verification and fulfill the minimum trading volume below.",
      table: {
        headers: ["Reward", "Minimum Trading Volume Required"],
        rows: [
          ["USD 100 Prime Funded Account", "3 standard lots"],
          ["USD 1,000 Prime Funded Account", "20 standard lots"],
        ],
      },
      bullets: [
        {
          text: "Only **valid trading activity** counts toward the required volume. Valid trading activity means trades executed in the ordinary course of trading, excluding any activity described as abnormal, invalid, manipulated, or prohibited under Section 4 below.",
        },
        {
          text: "Trades held for less than three (3) minutes (180 seconds) are excluded from volume calculations and do not count toward the requirement.",
        },
      ],
    },
    {
      number: 4,
      heading: "Prohibited Trading Practices",
      intro:
        "Clients must not engage in abusive or prohibited trading practices during the Promotion Period. Prohibited practices include, but are not limited to:",
      bullets: [
        {
          text: "Scalping or short-term instant trading conducted as a pattern intended to inflate volume artificially (note: individual trades under 3 minutes are simply excluded from volume count per Section 3; this clause addresses deliberate patterns of abuse).",
        },
        { text: "Hedging abuse." },
        { text: "Latency arbitrage." },
        { text: "Churning or abusive volume generation." },
        { text: "Any other activity intended to exploit the promotion unfairly." },
      ],
      outro:
        "Where MH Markets identifies abnormal, invalid, or manipulated trading activity, such activity will be excluded from promotion calculations, and the client may be subject to the actions outlined in Section 6.",
    },
    {
      number: 5,
      heading: "Withdrawal Conditions",
      bullets: [
        {
          text: "Clients who receive a Prime Funded Account reward must satisfy all applicable KYC and trading volume requirements before requesting any withdrawal.",
        },
        {
          text: "Failure to meet these requirements will result in the client not being eligible to withdraw profits generated from the promotional account.",
        },
        { text: "This promotion cannot be combined with other MH Markets promotions." },
      ],
    },
    {
      number: 6,
      heading: "MH Markets' Rights",
      headingInline: true,
      intro:
        "If MH Markets determines that a client has violated these Terms & Conditions or abused the Spin & Win Promotion, MH Markets reserves the right to:",
      bullets: [
        { text: "Cancel or revoke the reward." },
        { text: "Deduct any related profits generated through the promotion." },
        { text: "Restrict the client's participation in current or future promotions." },
        { text: "Disqualify the client and exclude related trading activity from promotion calculations." },
      ],
      outro:
        "MH Markets may modify, suspend, or terminate the Spin & Win Promotion at any time, without prior notice. All decisions regarding eligibility, reward qualifications, and promotion administration are final and at MH Markets' sole discretion. All rewards are subject to availability.",
    },
    {
      number: 7,
      heading: "Risk Disclosure:",
      unnumbered: true,
      intro:
        "This promotion does not constitute financial advice. Trading CFDs and leveraged products carries a high level of risk and may not be suitable for all investors.",
    },
  ],
};
