/**
 * Medusa Admin Widget: Order Line Item Customer Images
 *
 * Displays previewImageUrl from line item metadata as thumbnails and links.
 * For Art Transform orders, the customer's transformed image is stored in metadata.
 *
 * Zone: order.details.after (Medusa v2 passes props with order data).
 *
 * Expected API: The Admin order-detail endpoint must return the order with
 * items (or line_items) and each item must include metadata (e.g. previewImageUrl).
 * Custom route: api/admin/custom/orders/[id] should use relations including items
 * so that items[].metadata is present. extractItems() supports multiple shapes:
 * data.items, data.line_items, data.detail.items, order.items, etc.
 */


type OrderItem = {
  id: string;
  title?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  detail?: { metadata?: Record<string, unknown> };
};

type Order = {
  id?: string;
  items?: OrderItem[];
  item?: OrderItem[];
  line_items?: OrderItem[];
  order?: Order;
  detail?: { items?: OrderItem[]; item?: OrderItem[]; line_items?: OrderItem[] };
};

type OrderDetailsWidgetProps = {
  data?: Order | { order?: Order; detail?: Order['detail'] };
  order?: Order;
};

function getPreviewUrl(item: OrderItem): string | undefined {
  const meta = (item.metadata ?? item.detail?.metadata ?? {}) as Record<string, unknown>;
  const productConfig = meta.productConfig as Record<string, unknown> | undefined;
  const url =
    (meta.previewImageUrl as string) ??
    (meta.preview_image_url as string) ??
    (productConfig?.previewImageUrl as string) ??
    (productConfig?.preview_image_url as string) ??
    (Array.isArray(meta.photoUrls) && meta.photoUrls[0] ? String(meta.photoUrls[0]) : undefined);
  return typeof url === "string" && url.length > 0 && !url.includes("localhost") ? url : undefined;
}

function extractItems(raw: OrderDetailsWidgetProps): OrderItem[] {
  const d = raw.data;
  const o = raw.order;
  const detail = d && typeof d === "object" && "detail" in d ? (d as Order).detail : undefined;
  const root = raw as unknown as Order;
  const candidates: (OrderItem[] | undefined)[] = [
    d && typeof d === "object" && "items" in d ? (d as Order).items : undefined,
    d && typeof d === "object" && "item" in d ? (d as Order).item : undefined,
    d && typeof d === "object" && "line_items" in d ? (d as Order).line_items : undefined,
    detail?.items,
    detail?.line_items,
    Array.isArray(detail?.item) ? detail?.item : undefined,
    d && typeof d === "object" && "order" in d ? (d as { order?: Order }).order?.items : undefined,
    d && typeof d === "object" && "order" in d ? (d as { order?: Order }).order?.item : undefined,
    d && typeof d === "object" && "order" in d ? (d as { order?: Order }).order?.line_items : undefined,
    o?.items,
    o?.item,
    o?.line_items,
    Array.isArray(root?.items) ? root.items : undefined,
    Array.isArray(root?.line_items) ? root.line_items : undefined,
  ];
  for (const arr of candidates) {
    if (Array.isArray(arr) && arr.length > 0) return arr;
  }
  return [];
}

const OrderLineItemImages = (props: OrderDetailsWidgetProps) => {
  const items = extractItems(props);
  const itemsWithImage = items.filter((item) => getPreviewUrl(item));

  if (itemsWithImage.length === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Images</h3>
      <div className="space-y-3">
        {itemsWithImage.map((item, idx) => {
          const url = getPreviewUrl(item)!;
          const title = item.title ?? "Item";
          return (
            <div
              key={item.id ?? `img-${idx}`}
              className="flex items-center gap-3 p-3 bg-white rounded border border-gray-100"
            >
              <img
                src={url.includes("?") ? url : `${url}?w=120&q=80`}
                alt={title}
                className="w-16 h-16 object-cover rounded border border-gray-200"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                >
                  View full image
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import { defineWidgetConfig } from "@medusajs/admin-sdk";

export default OrderLineItemImages;

export const config = defineWidgetConfig({
  zone: "order.details.after",
});
