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
    title: "Trade Prediction Challenge — Terms & Conditions",
    subtitle: "MH Markets Booth — September 22–23, 2026",
    sections: [
      {
        heading: "1. Promotion Overview & Game Rules",
        intro:
          "Entertainment Purpose: All market charts used in the Trade Prediction Challenge are strictly simulated for recreational purposes and do not represent real financial markets or live trading data.",
        bullets: [
          'In the Trade Prediction Game, the participant must analyze the initial simulated chart and select either "UP" or "DOWN".',
          "Upon submitting the prediction, additional data points and chart movements are revealed, and the closing price at the designated endpoint determines the final result.",
          "Once a prediction is submitted, it is final and cannot be altered, edited, or resubmitted.",
        ],
        outro:
          "Winning Criteria: Participants who accurately predict the market outcome at the defined endpoint based on the simulated chart win the challenge.",
      },
      {
        heading: "2. Eligibility & Registration",
        intro: "To be eligible to participate or play the Trade Prediction game, participants must:",
        bullets: [
          "Visit the MH Markets booth during official expo dates (September 22, 2026, and September 23, 2026).",
          "Complete the registration process by filling out the designated form and providing accurate contact details (including full name, phone number, and email address).",
        ],
        outro:
          "Participation Limit: Participation is open to all registered expo attendees. Each verified participant is entitled to one (1) entry total across the event duration. Duplicate entries, fake contact details, fraudulent attempts, or multiple submissions will result in immediate disqualification.",
      },
      {
        heading: "3. Rewards & Daily Claim Policy",
        intro:
          "Gold Coin Allocation: A total of ten (10) Gold Coins will be awarded across the two-day event, structured as follows:",
        facts: [
          { label: "Day 1 (September 22):", text: "The first five (5) winning participants will receive one (1) Gold Coin each." },
          { label: "Day 2 (September 23):", text: "The first five (5) winning participants will receive one (1) Gold Coin each." },
        ],
        bullets: [
          "Distribution Basis: Rewards are awarded strictly on a first-come, first-served basis each day based on the official time-stamp of successful prediction submissions. Once the daily limit of five (5) winners is reached, no further Gold Coins will be awarded for that day.",
          "Availability & Transferability: Rewards are non-transferable, subject to availability, and cannot be exchanged for cash.",
        ],
      },
      {
        heading: "4. Technical Issues & Dispute Rules",
        bullets: [
          "Technical Disruptions: In the event of system errors, screen freezing, chart display failures, network connection drops, or any other technical glitch during gameplay, MH Markets reserves the right to void the affected attempt and grant a restart at its sole discretion.",
          "Unresolved Results: If a result cannot be recorded or verified due to a technical error, the attempt will be deemed void, and no reward will be issued for that specific instance.",
        ],
      },
      {
        heading: "5. MH Markets' Rights & Disqualification",
        intro:
          "If MH Markets determines that a participant has violated these Terms, provided false or misleading information, or manipulated the promotion, MH Markets reserves the right to:",
        bullets: [
          "Cancel, revoke, or withhold any reward or Gold Coin.",
          "Deduct any related benefits or promotional privileges.",
          "Restrict participation in current or future MH Markets promotions.",
          "Disqualify the participant from promotion calculations.",
        ],
        outro:
          "MH Markets reserves the right to modify, suspend, or terminate the promotion or update these Terms at any time without prior notice. All decisions regarding eligibility, game functionality, winner selection, and reward entitlement are final and binding at MH Markets' sole discretion.",
      },
      {
        heading: "6. Risk Disclosure",
        intro:
          "This promotion and its simulated charts are only for entertainment purpose and do not constitute financial, investment, or trading advice. Trading CFDs and leveraged financial products carries a high level of risk and may not be suitable for all investors. Success or performance in this simulated game does not guarantee any actual trading outcome or future profit in real financial markets.",
      },
    ],
  },
  SPIN: {
    title: "Spin & Win Challenge — Terms & Conditions",
    subtitle: "MH Markets Booth — September 22–23, 2026",
    sections: [
      {
        heading: "1. Promotion Overview & Game Rules",
        bullets: [
          "Event Activity: Participants spin the designated wheel at the MH Markets booth to land on a prize segment.",
          "Prizes & Rewards: Rewards may include Premium Merchandise, Amazon Vouchers, and Funded Account Vouchers as indicated on the landed segment.",
        ],
      },
      {
        heading: "2. Reward Fulfillment & Redemption",
        bullets: [
          "Onsite Rewards: Premium Merchandise and Amazon Vouchers are provided directly onsite at the booth upon winning.",
          "Funded Account Vouchers: Winners of a Funded Account reward receive a voucher onsite. Claiming and activation are strictly subject to dedicated Terms & Conditions for Funded Account Winners.",
          "Sales Outreach: The MH Markets sales team will reach out within two (2) business days to guide winners through the dedicated claim process and account eligibility requirements.",
        ],
      },
      {
        heading: "3. Eligibility, Registration & Attempt Limit",
        bullets: [
          "To become eligible to spin or play the game, participants must physically visit the MH Markets booth during the official expo dates: September 22 and 23, 2026.",
          "Participants must complete the required registration form before playing, including providing accurate contact details such as full name, email address, phone number, and any other information requested by MH Markets onsite.",
          "By registering, participants confirm that the information provided is true and complete and agree that MH Markets may use the submitted details to verify eligibility, administer the promotion, and contact winners regarding prize fulfillment.",
          "Participants who do not register, refuse to provide the required information, or provide incomplete or incorrect details will not be permitted to spin or play the game and may be disqualified from receiving any reward.",
          'One Attempt Rule: Each participant is strictly permitted one (1) attempt. The only exception is if the wheel lands directly on a "Spin Again" segment, granting one additional turn.',
          "Duplicate entries, unauthorized re-spins, or fraudulent attempts will result in immediate disqualification.",
        ],
      },
      {
        heading: "4. MH Markets' Rights",
        intro:
          "If MH Markets determines that a participant has violated these Terms, provided false information, or manipulated the promotion, MH Markets reserves the right to:",
        bullets: [
          "Cancel, revoke, or withhold any reward, voucher, or prize.",
          "Deduct any related profits generated through promotional credit, where applicable.",
          "Restrict participation in current or future MH Markets promotions.",
          "Disqualify the participant from promotion calculations.",
        ],
        outro:
          "MH Markets reserves the right to modify, suspend, or terminate the Spin & Win Promotion at any time without prior notice. All decisions regarding eligibility, spin outcomes, and prize entitlement are final and at MH Markets' sole discretion. Rewards are subject to availability.",
      },
      {
        heading: "5. Technical Issues & Dispute Rules",
        bullets: [
          "If the game screen freezes, the wheel, the result cannot be displayed, or any other technical issue, system error, connectivity issue, display issue, or operational interruption occurs, MH Markets reserves the right to void the affected attempt and restart the attempt at its sole discretion.",
          "MH Markets' decision on whether an attempt is valid, void, restarted, or disqualified is final and binding.",
        ],
      },
      {
        heading: "6. Risk Disclosure",
        intro:
          "This promotion does not constitute financial, investment, or trading advice. Trading CFDs and leveraged products carries a high level of risk and may not be suitable for all investors. Ensure you understand the associated risks before trading. Participation in this promotion does not guarantee future trading success or profits.",
      },
    ],
  },
};
