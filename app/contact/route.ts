import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const referer = request.headers.get("referer") || "/pages/contact";
  let returnPath = "/pages/contact";
  try {
    returnPath = new URL(referer).pathname;
  } catch {
    // use default
  }

  const email = formData.get("contact[email]") as string | null;
  const name =
    (formData.get("contact[first_name]") as string | null) ||
    (formData.get("contact[Full Name]") as string | null);
  const body = formData.get("contact[body]") as string | null;
  const formType = formData.get("form_type") as string | null;

  console.info("Contact/newsletter form submission", { email, name, body, formType });

  redirect(`${returnPath}?form=submitted`);
}
