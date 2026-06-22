export const metadata = {
  title: "Book a Hair Extension Appointment Berlin — OlivHairSupply Salon",
  description: "Book your luxury hair appointment at OlivHairSupply Berlin. Expert BiziLuxe extension installation, Bonding, Tape & Clip-In services. Two Berlin locations. Book online today.",
  keywords: ["Haarverlängerung Termin Berlin", "hair extension appointment Berlin", "Bonding Extensions Berlin Termin", "BiziLuxe Installation Berlin", "luxury hair salon Berlin appointment"],
  openGraph: { title: "Book a Hair Appointment — OlivHairSupply Berlin", description: "Expert BiziLuxe extension installation in Berlin. Book your salon appointment online.", url: "https://olivhairsupply.de/appointments" },
  alternates: { canonical: "https://olivhairsupply.de/appointments" }
};
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

const STORE_B_REOPEN_SCRIPT = `<script>
(function(){
  var reopenDate=new Date('2026-08-04T00:00:00+02:00');
  if(new Date()>=reopenDate){
    var banner=document.getElementById('oappt-store-b-closed');
    if(banner)banner.remove();
  }
})();
</script>`;

export default function AppointmentsPage() {
  return <ShopifyClonePage page="appointments" injectBeforeClose={STORE_B_REOPEN_SCRIPT} />;
}
