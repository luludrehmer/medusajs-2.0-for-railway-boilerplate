/**
 * Medusa Admin Widget: Order Line Item Customer Images
 *
 * Displays previewImageUrl from line item metadata as thumbnails and links.
 * For Art Transform orders, the customer's transformed image is stored in metadata.
 *
 * Install: Copy this file to your Medusa backend's src/admin/widgets/ directory.
 * Medusa will auto-register widgets in that folder.
 *
 * Zone: order.details.after
 */

import type { WidgetConfig } from "@medusajs/admin";

type OrderItem = {
  id: string;
  title?: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
  detail?: { metadata?: Record<string, unknown> };
};

type Order = {
  id: string;
  items?: OrderItem[];
};

type OrderDetailsWidgetProps = {
  data?: Order;
  order?: Order;
};

function getPreviewUrl(item: OrderItem): string | undefined {
  const meta = item.metadata ?? item.detail?.metadata ?? {};
  const productConfig = meta.productConfig as Record<string, unknown> | undefined;
  const url =
    (meta.previewImageUrl as string) ??
    (meta.preview_image_url as string) ??
    (productConfig?.previewImageUrl as string) ??
    (productConfig?.preview_image_url as string);
  return typeof url === "string" && url.length > 0 && !url.includes("localhost") ? url : undefined;
}

const OrderLineItemImages = ({ data, order }: OrderDetailsWidgetProps) => {
  const o = data ?? order;
  const items = o?.items ?? [];
  const itemsWithImage = items.filter((item) => getPreviewUrl(item));

  if (itemsWithImage.length === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Images</h3>
      <div className="space-y-3">
        {itemsWithImage.map((item) => {
          const url = getPreviewUrl(item)!;
          const title = item.title ?? "Item";
          return (
            <div
              key={item.id}
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

export default OrderLineItemImages;

export const config: WidgetConfig = {
  zone: "order.details.after",
};
