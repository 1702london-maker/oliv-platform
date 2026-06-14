import { ShopifyClonePage } from "@/components/ShopifyClonePage";

const STORE_B_REOPEN_SCRIPT = `<script>
(function(){
  var reopenDate=new Date('2026-08-04T00:00:00+02:00');
  if(new Date()>=reopenDate){
    var card=document.getElementById('oappt-store-b-card');
    var banner=document.getElementById('oappt-store-b-closed');
    if(card){card.style.opacity='';card.style.pointerEvents='';card.style.position='';}
    if(banner)banner.remove();
  }
})();
</script>`;

export default function AppointmentsPage() {
  return <ShopifyClonePage page="appointments" injectBeforeClose={STORE_B_REOPEN_SCRIPT} />;
}
