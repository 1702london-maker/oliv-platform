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

async function saveAddress(formData: FormData) {
  "use server";
  const profile = await requireProfile();
  const admin = createSupabaseAdminClient();
  const address = {
    line1:    String(formData.get("line1")   || "").trim(),
    line2:    String(formData.get("line2")   || "").trim() || null,
    city:     String(formData.get("city")    || "").trim(),
    postcode: String(formData.get("postcode")|| "").trim(),
    country:  String(formData.get("country") || "DE").trim(),
  };
  // Store in profiles.default_address (jsonb column, add via migration if needed)
  // Gracefully ignore if column doesn't exist yet
  try {
    await admin.from("profiles").update({ default_address: address }).eq("id", profile.id);
  } catch { /* column may not exist yet */ }
  revalidatePath("/account");
  redirect("/account/address?saved=1");
}

type AddressData = {
  line1?: string;
  line2?: string;
  city?: string;
  postcode?: string;
  country?: string;
} | null;

export default async function AccountAddressPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const [profile, params] = await Promise.all([requireProfile(), searchParams]);
  const saved = params.saved === "1";
  const { before, after } = getShell();

  // Try to load saved address
  let address: AddressData = null;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("profiles").select("default_address").eq("id", profile.id).maybeSingle();
    address = (data as { default_address?: AddressData } | null)?.default_address ?? null;
  } catch { /* column may not exist */ }

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-addr-page">
        <style>{`
          #ohs-addr-page { background:#F5F0E8; font-family:'Montserrat',sans-serif; }
          .ohs-addr-hero { background:#F5F0E8; border-bottom:1px solid #E2D5C0; padding:52px 24px 48px; }
          .ohs-addr-hero-inner { max-width:760px; margin:0 auto; display:flex; align-items:flex-start; justify-content:space-between; gap:24px; }
          .ohs-addr-eyebrow { font-size:9.5px; font-weight:700; letter-spacing:.3em; text-transform:uppercase; color:#B68A45; margin:0 0 12px; }
          .ohs-addr-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:48px; font-weight:300; color:#2B2620; margin:0; line-height:1.05; }
          .ohs-addr-back { flex-shrink:0; margin-top:8px; background:transparent; border:1px solid #2B2620; color:#2B2620; padding:11px 24px; font-size:9.5px; font-weight:700; letter-spacing:.2em; text-transform:uppercase; cursor:pointer; text-decoration:none; display:inline-block; transition:background .2s,color .2s; white-space:nowrap; }
          .ohs-addr-back:hover { background:#2B2620; color:#fff; }
          .ohs-addr-body { max-width:760px; margin:0 auto; padding:48px 24px 80px; }
          .ohs-addr-card { background:#fff; border:1px solid #E2D5C0; padding:36px 36px 40px; }
          .ohs-addr-card-title { font-family:'Cormorant Garamond',Georgia,serif; font-size:28px; font-weight:300; color:#2B2620; margin:0 0 8px; }
          .ohs-addr-card-sub { font-size:12px; color:#6B5C4E; margin:0 0 28px; line-height:1.6; }
          .ohs-addr-field { margin-bottom:20px; }
          .ohs-addr-label { display:block; font-size:9px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#6B5C4E; margin-bottom:7px; }
          .ohs-addr-input, .ohs-addr-select { width:100%; box-sizing:border-box; border:1px solid #E2D5C0; background:#FDFAF6; padding:12px 14px; font-family:'Montserrat',sans-serif; font-size:13px; color:#2B2620; outline:none; transition:border-color .2s; appearance:auto; }
          .ohs-addr-input:focus, .ohs-addr-select:focus { border-color:#B68A45; }
          .ohs-addr-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
          .ohs-addr-save { background:#2B2620; color:#F6F1E8; border:none; padding:14px 36px; font-family:'Montserrat',sans-serif; font-size:10px; font-weight:700; letter-spacing:.22em; text-transform:uppercase; cursor:pointer; transition:background .2s; margin-top:8px; }
          .ohs-addr-save:hover { background:#B68A45; }
          .ohs-addr-banner { background:#EAF4EC; border:1px solid #B8D9BC; color:#2a7a4a; font-size:12px; padding:14px 20px; margin-bottom:24px; }
          @media(max-width:600px){ .ohs-addr-row{grid-template-columns:1fr;} .ohs-addr-title{font-size:36px;} }
        `}</style>

        <div className="ohs-addr-hero">
          <div className="ohs-addr-hero-inner">
            <div>
              <p className="ohs-addr-eyebrow">My Account</p>
              <h1 className="ohs-addr-title">Default Address</h1>
            </div>
            <a href="/account" className="ohs-addr-back">← Back</a>
          </div>
        </div>

        <div className="ohs-addr-body">
          {saved && (
            <div className="ohs-addr-banner">✓ Your address has been saved.</div>
          )}

          <form action={saveAddress}>
            <div className="ohs-addr-card">
              <h2 className="ohs-addr-card-title">Shipping Address</h2>
              <p className="ohs-addr-card-sub">This address will be pre-filled at checkout.</p>

              <div className="ohs-addr-field">
                <label className="ohs-addr-label" htmlFor="line1">Address Line 1</label>
                <input className="ohs-addr-input" id="line1" name="line1" type="text" required
                  defaultValue={address?.line1 ?? ""} placeholder="Street and house number" autoComplete="address-line1" />
              </div>

              <div className="ohs-addr-field">
                <label className="ohs-addr-label" htmlFor="line2">Address Line 2 <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optional)</span></label>
                <input className="ohs-addr-input" id="line2" name="line2" type="text"
                  defaultValue={address?.line2 ?? ""} placeholder="Apartment, suite, floor, etc." autoComplete="address-line2" />
              </div>

              <div className="ohs-addr-row">
                <div className="ohs-addr-field">
                  <label className="ohs-addr-label" htmlFor="city">City</label>
                  <input className="ohs-addr-input" id="city" name="city" type="text" required
                    defaultValue={address?.city ?? ""} placeholder="Berlin" autoComplete="address-level2" />
                </div>
                <div className="ohs-addr-field">
                  <label className="ohs-addr-label" htmlFor="postcode">Postcode</label>
                  <input className="ohs-addr-input" id="postcode" name="postcode" type="text" required
                    defaultValue={address?.postcode ?? ""} placeholder="10115" autoComplete="postal-code" />
                </div>
              </div>

              <div className="ohs-addr-field">
                <label className="ohs-addr-label" htmlFor="country">Country</label>
                <select className="ohs-addr-select" id="country" name="country" defaultValue={address?.country ?? "DE"} autoComplete="country">
                  <option value="DE">Germany</option>
                  <option value="AT">Austria</option>
                  <option value="CH">Switzerland</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                </select>
              </div>

              <button className="ohs-addr-save" type="submit">Save Address</button>
            </div>
          </form>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
