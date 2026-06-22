import type { Metadata } from "next";
import { ShopifyClonePage } from "@/components/ShopifyClonePage";

export const metadata: Metadata = {
  title: "Haarverlängerung Termin Berlin buchen — OlivHairSupply Salon",
  description: "Buche deinen Luxus-Haar-Termin bei OlivHairSupply Berlin. BiziLuxe Extensions Installation, Bonding, Tape & Clip-In Services. Jetzt online buchen.",
  keywords: ["Haarverlängerung Termin Berlin", "Extensions Termin Berlin", "Bonding Extensions Berlin Termin", "BiziLuxe Installation Berlin", "Luxus Haartermin Berlin"],
  openGraph: { title: "Haarverlängerung Termin Berlin — OlivHairSupply", description: "BiziLuxe Extensions Installation in Berlin. Jetzt Salontermin online buchen.", url: "https://olivhairsupply.de/appointments" },
  alternates: { canonical: "https://olivhairsupply.de/appointments" }
};



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