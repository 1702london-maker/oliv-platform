import { cookies } from "next/headers";

export async function getLang(): Promise<"de" | "en"> {
  const store = await cookies();
  const c = store.get("ohs_lang");
  return c?.value === "en" ? "en" : "de";
}

const account = {
  de: {
    title: "Mein Konto",
    welcome: "Willkommen zurück",
    orders: "Meine Bestellungen",
    appointments: "Meine Termine",
    training: "Meine Schulungen",
    signout: "Abmelden",
    orderHistory: "Bestellhistorie",
    noOrders: "Noch keine Bestellungen",
    shopNow: "Jetzt einkaufen",
    noAppointments: "Noch keine Termine",
    bookNow: "Termin buchen",
    noTraining: "Noch keine Schulungen",
    browseTraining: "Schulungen ansehen",
    member: "Mitglied",
    since: "seit",
    affiliateProgram: "Partnerprogramm",
    applyNow: "Jetzt bewerben",
    affiliateDesc: "Werden Sie Partner und verdienen Sie Provisionen",
    wholesale: "Großhandel",
    wholesaleDesc: "Zugang zu Großhandelspreisen und exklusiven Angeboten",
    apply: "Beantragen",
    accountSettings: "Kontoeinstellungen",
    editProfile: "Profil bearbeiten",
    changePassword: "Passwort ändern",
    notifications: "Benachrichtigungen",
    manage: "Verwalten",
    cart: "Warenkorb",
    profile: "Profil",
  },
  en: {
    title: "My Account",
    welcome: "Welcome back",
    orders: "My Orders",
    appointments: "My Appointments",
    training: "My Training",
    signout: "Sign Out",
    orderHistory: "Order History",
    noOrders: "No orders yet",
    shopNow: "Shop now",
    noAppointments: "No appointments yet",
    bookNow: "Book appointment",
    noTraining: "No training sessions yet",
    browseTraining: "Browse training",
    member: "Member",
    since: "since",
    affiliateProgram: "Affiliate Program",
    applyNow: "Apply now",
    affiliateDesc: "Become a partner and earn commissions",
    wholesale: "Wholesale",
    wholesaleDesc: "Access wholesale prices and exclusive offers",
    apply: "Apply",
    accountSettings: "Account Settings",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    notifications: "Notifications",
    manage: "Manage",
    cart: "Cart",
    profile: "Profile",
  },
};

export type Lang = "de" | "en";

export function getAccountStrings(lang: Lang) {
  return account[lang];
}
