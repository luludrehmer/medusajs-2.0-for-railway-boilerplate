import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import type { IOrderModuleService } from "@medusajs/framework/types";

/**
 * GET /admin/custom/orders/:id
 * Returns order with relations ["items", "summary", "shipping_address"] so that
 * items[].metadata (e.g. previewImageUrl) is present. Use this from the Admin
 * order detail page if the default order API does not return item metadata;
 * the "Customer Images" widget (order.details.after) needs items.metadata to show thumbnails.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Order ID required" });
  }

  try {
    const orderModuleService: IOrderModuleService = req.scope.resolve(Modules.ORDER);
    const order = await orderModuleService.retrieveOrder(id, {
      relations: ["items", "summary", "shipping_address"],
    });

    return res.json({ order });
  } catch (error) {
    console.warn("[admin/custom/orders] retrieve failed:", error);
    return res.status(404).json({ message: "Order not found" });
  }
}
