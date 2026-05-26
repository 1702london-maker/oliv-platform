import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnTo = request.headers.get("referer") || "/";
  console.info("Contact/newsletter submission", {
    email: formData.get("contact[email]"),
    tags: formData.get("contact[tags]"),
    name: formData.get("contact[first_name]") || formData.get("contact[Full Name]")
  });

  redirect(`${new URL(returnTo).pathname}?form=submitted`);
}
