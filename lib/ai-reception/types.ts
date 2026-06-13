export type ReceptionIntent =
  | "booking"
  | "reschedule"
  | "cancel"
  | "question"
  | "handover";

export type ReceptionLeadStatus =
  | "new"
  | "collecting_details"
  | "needs_handover"
  | "appointment_requested"
  | "confirmed"
  | "closed";

export type ReceptionDetails = {
  customerName?: string;
  email?: string;
  phone?: string;
  serviceInterest?: string;
  hairCondition?: string;
  desiredStyle?: string;
  hairLength?: string;
  inspirationPhotos?: string;
  preferredDate?: string;
  preferredTime?: string;
  bookingId?: string;
};

export type ReceptionConversation = {
  id: string;
  phone_number: string;
  customer_name: string | null;
  email: string | null;
  service_interest: string | null;
  preferred_date: string | null;
  lead_status: ReceptionLeadStatus;
  handover_required: boolean;
  handover_reason: string | null;
  collected_details: ReceptionDetails;
};

export type ReceptionDecision = {
  intent: ReceptionIntent;
  reply: string;
  leadStatus: ReceptionLeadStatus;
  handoverRequired: boolean;
  handoverReason?: string;
  details: ReceptionDetails;
  appointmentRequestReady: boolean;
  requestType: "book" | "reschedule" | "cancel" | "question";
};
