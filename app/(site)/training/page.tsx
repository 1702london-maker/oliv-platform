import { ShopifyClonePage } from "@/components/ShopifyClonePage";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrainingPage({ searchParams }: Props) {
  const params = await searchParams;
  const application = typeof params?.application === "string" ? params.application : "";

  let script = "";
  if (application === "submitted") {
    script = `<script>
(function(){
  function showBanner(){
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#2B2620;color:#F6F1E8;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-align:center;padding:14px 20px;';
    b.innerHTML = '✓ Application received — our team will review it and contact you within 3–5 business days. <button onclick="this.parentNode.remove()" style="margin-left:16px;background:none;border:1px solid rgba(255,255,255,.4);color:inherit;padding:4px 10px;cursor:pointer;font-size:10px;letter-spacing:.1em;">Dismiss</button>';
    document.body.prepend(b);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',showBanner);}else{showBanner();}
})();
<\/script>`;
  } else if (application === "missing") {
    script = `<script>
(function(){
  function showBanner(){
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#8B3535;color:#fff;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-align:center;padding:14px 20px;';
    b.innerHTML = 'Please fill in your name and email address to submit your application.';
    document.body.prepend(b);
    setTimeout(function(){b.remove();},5000);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',showBanner);}else{showBanner();}
})();
<\/script>`;
  } else if (application === "failed") {
    script = `<script>
(function(){
  function showBanner(){
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#8B3535;color:#fff;font-family:Montserrat,sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-align:center;padding:14px 20px;';
    b.innerHTML = 'Something went wrong. Please try again or contact us on WhatsApp.';
    document.body.prepend(b);
    setTimeout(function(){b.remove();},6000);
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',showBanner);}else{showBanner();}
})();
<\/script>`;
  }

  return <ShopifyClonePage page="pages-training" injectBeforeClose={script} />;
}
