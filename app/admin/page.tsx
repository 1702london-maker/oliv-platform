const adminAreas = [
  "Products",
  "Orders",
  "Appointments",
  "Wholesale accounts",
  "Affiliate accounts",
  "Commissions",
  "Payouts"
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-linen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Admin</p>
        <h1 className="mt-3 font-serif text-5xl">Operations dashboard</h1>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {adminAreas.map((area) => (
            <div key={area} className="border border-[#e3d6c5] bg-white p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cocoa">{area}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
