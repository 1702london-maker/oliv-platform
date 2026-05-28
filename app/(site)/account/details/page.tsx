import fs from "node:fs";
import path from "node:path";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getShell() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}

async function updateDetails(formData: FormData) {
  "use server";
  const profile = await requireProfile();
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").update({
    first_name: String(formData.get("first_name") || "").trim() || null,
    last_name:  String(formData.get("last_name")  || "").trim() || null,
    phone:      String(formData.get("phone")       || "").trim() || null,
  }).eq("id", profile.id);
  revalidatePath("/account");
  revalidatePath("/account/details");
  redirect("/account/details?saved=1");
}

export default async function AccountDetailsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams]);
  const { before, after } = getShell();
  const saved = params.saved === "1";

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-details-page">
        <style>{`
          #ohs-details-page { background:#F5F0E8; font-family:'Montserrat',sans-serif; }
          .ohs-det-hero { background:#F5F0E8; border-bottom:1px solid #E2D5C0; padding:52px 24px 48px; }
          .ohs-det-hero-inner { max-width:760px; margin:0 auto; display:flex; align-items:flex-start; justify-content:space-between; gap:24px; }
          .ohs-det-eyebrow { font-size:9.5px; font-weight:700; letter-spacing:.3em; text-transform:uppercase; color:#B68A45; margin:0 0 12px; }
          .ohs-det-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:48px; font-weight:300; color:#2B2620; margin:0; line-height:1.05; }
          .ohs-det-back { flex-shrink:0; margin-top:8px; background:transparent; border:1px solid #2B2620; color:#2B2620; padding:11px 24px; font-size:9.5px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; cursor:pointer; text-decoration:none; display:inline-block; transition:background .2s,color .2s; white-space:nowrap; }
          .ohs-det-back:hover { background:#2B2620; color:#fff; }
          .ohs-det-body { max-width:760px; margin:0 auto; padding:48px 24px 80px; }
          .ohs-det-card { background:#fff; border:1px solid #E2D5C0; padding:36px 36px 40px; margin-bottom:24px; }
          .ohs-det-card-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:28px; font-weight:300; color:#2B2620; margin:0 0 28px; }
          .ohs-det-field { margin-bottom:20px; }
          .ohs-det-label { display:block; font-size:9px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#6B5C4E; margin-bottom:7px; }
          .ohs-det-input { width:100%; box-sizing:border-box; border:1px solid #E2D5C0; background:#FDFAF6; padding:12px 14px; font-family:'Montserrat',sans-serif; font-size:13px; color:#2B2620; outline:none; transition:border-color .2s; }
          .ohs-det-input:focus { border-color:#B68A45; }
          .ohs-det-input[disabled] { background:#F5F0E8; color:#9B8878; cursor:not-allowed; }
          .ohs-det-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
          .ohs-det-save { background:#2B2620; color:#F6F1E8; border:none; padding:14px 36px; font-family:'Montserrat',sans-serif; font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; cursor:pointer; transition:background .2s; margin-top:8px; }
          .ohs-det-save:hover { background:#B68A45; }
          .ohs-det-banner { background:#EAF4EC; border:1px solid #B8D9BC; color:#2a7a4a; font-size:12px; padding:14px 20px; margin-bottom:24px; }
          .ohs-det-note { font-size:11px; color:#9B8878; margin:0 0 20px; line-height:1.6; }
          @media(max-width:600px){ .ohs-det-row{grid-template-columns:1fr;} .ohs-det-title{font-size:36px;} }
        `}</style>

        <div className="ohs-det-hero">
          <div className="ohs-det-hero-inner">
            <div>
              <p className="ohs-det-eyebrow">My Account</p>
              <h1 className="ohs-det-title">Account Details</h1>
            </div>
            <a href="/account" className="ohs-det-back">← Back</a>
          </div>
        </div>

        <div className="ohs-det-body">
          {saved && (
            <div className="ohs-det-banner">✓ Your details have been saved.</div>
          )}

          <form action={updateDetails}>
            <div className="ohs-det-card">
              <h2 className="ohs-det-card-title">Personal Information</h2>
              <p className="ohs-det-note">Your email address is managed through your login provider and cannot be changed here.</p>

              <div className="ohs-det-field">
                <label className="ohs-det-label">Email Address</label>
                <input className="ohs-det-input" type="email" value={profile.email} disabled />
              </div>

              <div className="ohs-det-row">
                <div className="ohs-det-field">
                  <label className="ohs-det-label" htmlFor="first_name">First Name</label>
                  <input className="ohs-det-input" id="first_name" name="first_name" type="text"
                    defaultValue={profile.first_name ?? ""} placeholder="First name" autoComplete="given-name" />
                </div>
                <div className="ohs-det-field">
                  <label className="ohs-det-label" htmlFor="last_name">Last Name</label>
                  <input className="ohs-det-input" id="last_name" name="last_name" type="text"
                    defaultValue={profile.last_name ?? ""} placeholder="Last name" autoComplete="family-name" />
                </div>
              </div>

              <div className="ohs-det-field">
                <label className="ohs-det-label" htmlFor="phone">Phone Number</label>
                <input className="ohs-det-input" id="phone" name="phone" type="tel"
                  defaultValue={profile.phone ?? ""} placeholder="+49 000 000 0000" autoComplete="tel" />
              </div>

              <button className="ohs-det-save" type="submit">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
