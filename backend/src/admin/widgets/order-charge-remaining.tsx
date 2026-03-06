import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { useState } from "react";

const REPLIT_API_BASE = "https://portraits.art-and-see.com/api";
const ADMIN_PASSWORD = "Dreh!234";

type Order = {
  id?: string;
  display_id?: number;
  metadata?: Record<string, unknown>;
};

type WidgetProps = {
  data?: Order;
  order?: Order;
};

const OrderChargeRemaining = (props: WidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const order = props.data ?? props.order ?? (props as any);
  const orderId = (order as any)?.id;
  const meta = ((order as any)?.metadata ?? {}) as Record<string, unknown>;

  const depositPaid = meta.depositPaid;
  const finalPaymentPaid = meta.finalPaymentPaid;
  const remainingAmount = Number(meta.remainingAmount ?? 0);

  if (!depositPaid || finalPaymentPaid || remainingAmount <= 0) {
    return null;
  }

  const handleCharge = async () => {
    if (!orderId) return;
    const confirmed = window.confirm(
      `Charge $${remainingAmount.toFixed(2)} to the customer's saved card?\n\nOrder #${(order as any)?.display_id ?? orderId}`
    );
    if (!confirmed) return;

    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch(`${REPLIT_API_BASE}/admin/medusa-orders/${orderId}/capture-remaining`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ADMIN_PASSWORD}`,
        },
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setResult({ success: true, message: `Successfully charged $${data.amountCaptured?.toFixed(2) ?? remainingAmount.toFixed(2)}` });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setResult({ success: false, message: data.message ?? "Charge failed" });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message ?? "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #fed7aa",
        background: "#fff7ed",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#9a3412", margin: "0 0 4px 0" }}>
            Ready to Charge Final Payment
          </p>
          <p style={{ fontSize: "13px", color: "#c2410c", margin: "0 0 12px 0" }}>
            Deposit paid. Remaining balance:{" "}
            <strong>${remainingAmount.toFixed(2)}</strong>
          </p>

          {result && (
            <p
              style={{
                fontSize: "13px",
                padding: "8px 12px",
                borderRadius: "6px",
                marginBottom: "12px",
                margin: "0 0 12px 0",
                background: result.success ? "#d1fae5" : "#fee2e2",
                color: result.success ? "#065f46" : "#991b1b",
              }}
            >
              {result.message}
            </p>
          )}

          <button
            onClick={handleCharge}
            disabled={loading}
            style={{
              background: loading ? "#d1d5db" : "#ea580c",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : `Charge $${remainingAmount.toFixed(2)} Remaining Balance`}
          </button>
        </div>
      </div>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default OrderChargeRemaining;
