"use client";

export function PrintInvoiceButton({ label = "Print Invoice" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} style={printBtn}>
      {label}
    </button>
  );
}

const printBtn: React.CSSProperties = {
  border: "none",
  background: "#2b2620",
  color: "#fff",
  padding: "12px 18px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  cursor: "pointer"
};
