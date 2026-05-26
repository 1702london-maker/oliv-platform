export type UserRole = "customer" | "admin" | "affiliate" | "wholesale";

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  roles: UserRole[];
};
