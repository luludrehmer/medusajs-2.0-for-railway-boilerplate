import { defineWidgetConfig } from "@medusajs/admin-sdk";

type OrderItem = {
  id: string;
  title?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  detail?: { metadata?: Record<string, unknown> };
};

type Order = {
  id?: string;
  display_id?: number;
  items?: OrderItem[];
  metadata?: Record<string, unknown>;
};

type WidgetProps = {
  data?: Order;
  order?: Order;
};

function getMeta(item: OrderItem): Record<string, unknown> {
  return (item.metadata ?? item.detail?.metadata ?? {}) as Record<string, unknown>;
}

function getPhotoUrls(item: OrderItem): string[] {
  const meta = getMeta(item);
  const urls = (meta.photoUrls ?? meta.uploadedPhotoUrls ?? meta.uploaded_photo_urls ?? []) as unknown[];
  return Array.isArray(urls) ? urls.filter((u): u is string => typeof u === "string" && u.length > 0) : [];
}

function extractItems(props: WidgetProps): OrderItem[] {
  const order = props.data ?? props.order;
  if (!order) return [];
  const items = (order as any).items ?? (order as any).line_items ?? [];
  return Array.isArray(items) ? items : [];
}

function extractOrderMeta(props: WidgetProps): Record<string, unknown> {
  const order = props.data ?? props.order;
  return ((order as any)?.metadata ?? {}) as Record<string, unknown>;
}

const OrderPaintingDetails = (props: WidgetProps) => {
  const items = extractItems(props);
  const orderMeta = extractOrderMeta(props);

  const allPhotos: { url: string; itemTitle: string }[] = [];
  const specs: { label: string; value: string }[] = [];
  const instructions: string[] = [];

  items.forEach((item) => {
    const meta = getMeta(item);
    const photos = getPhotoUrls(item);
    photos.forEach((url) => allPhotos.push({ url, itemTitle: item.title ?? "Item" }));

    const size = meta.size ?? meta.canvasSize ?? meta.paintingSize;
    const framing = meta.framing ?? meta.frame ?? meta.framingType;
    const subjects = meta.subjectCount ?? meta.subjects ?? meta.numberOfSubjects;
    const photoMode = meta.photoMode ?? meta.mode ?? meta.uploadMode;
    const notes = meta.uploadLaterNotes ?? meta.combinationInstructions ?? meta.customerInstructions ?? meta.notes;

    if (size) specs.push({ label: "Size", value: String(size) });
    if (framing) specs.push({ label: "Framing", value: String(framing) });
    if (subjects) specs.push({ label: "Subjects", value: String(subjects) });
    if (photoMode) specs.push({ label: "Photo Mode", value: String(photoMode) });
    if (notes && String(notes).trim()) instructions.push(String(notes).trim());
  });

  const depositAmount = orderMeta.depositAmount;
  const totalAmount = orderMeta.totalAmount;
  const remainingAmount = orderMeta.remainingAmount;
  const depositPaid = orderMeta.depositPaid;
  const finalPaymentPaid = orderMeta.finalPaymentPaid;

  const hasContent = allPhotos.length > 0 || specs.length > 0 || instructions.length > 0;
  if (!hasContent && !depositAmount) return null;

  return (
    <div style={{ marginTop: "24px", padding: "20px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fafafa" }}>
      <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#111827", marginBottom: "16px", marginTop: 0 }}>
        Painting Order Details
      </h3>

      {specs.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginTop: 0 }}>
            Specifications
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {specs.map((spec, i) => (
              <span key={i} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "12px", background: "#ede9fe", color: "#5b21b6", fontWeight: 500 }}>
                {spec.label}: {spec.value}
              </span>
            ))}
          </div>
        </div>
      )}

      {instructions.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginTop: 0 }}>
            Customer Instructions
          </p>
          {instructions.map((note, i) => (
            <p key={i} style={{ fontSize: "13px", color: "#374151", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px 12px", margin: "0 0 8px 0" }}>
              {note}
            </p>
          ))}
        </div>
      )}

      {allPhotos.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginTop: 0 }}>
            Customer Photos ({allPhotos.length})
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {allPhotos.map((photo, i) => (
              <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" title={`${photo.itemTitle} — click to view full size`}>
                <img
                  src={photo.url}
                  alt={`${photo.itemTitle} photo ${i + 1}`}
                  style={{ width: "96px", height: "96px", objectFit: "cover", borderRadius: "6px", border: "2px solid #e5e7eb", cursor: "pointer" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {(depositAmount || totalAmount) && (
        <div style={{ paddingTop: "12px", borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", marginTop: 0 }}>
            Payment Summary
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {totalAmount && (
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Total: <strong>${Number(totalAmount).toFixed(2)}</strong>
              </span>
            )}
            {depositAmount && (
              <span style={{ fontSize: "13px", color: depositPaid ? "#065f46" : "#92400e" }}>
                Deposit: <strong>${Number(depositAmount).toFixed(2)}</strong>{" "}
                <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: depositPaid ? "#d1fae5" : "#fef3c7", color: depositPaid ? "#065f46" : "#92400e" }}>
                  {depositPaid ? "Paid" : "Pending"}
                </span>
              </span>
            )}
            {remainingAmount && (
              <span style={{ fontSize: "13px", color: finalPaymentPaid ? "#065f46" : "#374151" }}>
                Remaining: <strong>${Number(remainingAmount).toFixed(2)}</strong>{" "}
                {finalPaymentPaid && (
                  <span style={{ fontSize: "11px", padding: "2px 6px", borderRadius: "4px", background: "#d1fae5", color: "#065f46" }}>Paid</span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default OrderPaintingDetails;
