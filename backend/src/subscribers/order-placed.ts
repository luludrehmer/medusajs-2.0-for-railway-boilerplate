import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

const FALLBACK_ADDRESS = {
  first_name: '',
  last_name: '',
  address_1: '',
  city: '',
  province: '',
  postal_code: '',
  country_code: 'US',
}

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('[order-placed] event received', { orderId: data?.id })
  let order: any
  try {
    let notificationModuleService: INotificationModuleService
    try {
      notificationModuleService = container.resolve(Modules.NOTIFICATION)
    } catch (resolveErr) {
      console.error(
        '[order-placed] NOTIFICATION module not available. Email will not be sent. ' +
        'Set ZOHO_SMTP_USER + ZOHO_SMTP_PASS (or RESEND/SendGrid) in Railway env.',
        resolveErr
      )
      return
    }

    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
    order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })

    let shippingAddress = order.shipping_address
    if (shippingAddress && typeof shippingAddress === 'object' && 'address_1' in shippingAddress) {
      // already populated
    } else if (shippingAddress?.id) {
      try {
        const addrSvc = (orderModuleService as any).orderAddressService_
        if (addrSvc) shippingAddress = await addrSvc.retrieve(shippingAddress.id)
      } catch (e) {
        console.warn('[order-placed] Could not retrieve shipping_address, using fallback', e)
        shippingAddress = FALLBACK_ADDRESS
      }
    } else {
      shippingAddress = FALLBACK_ADDRESS
    }

    if (!order.email) {
      console.warn('[order-placed] Order has no email, skipping notification', { orderId: order.id })
      return
    }

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: 'Your order has been placed',
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order!',
      },
    })
    console.log('[order-placed] Email sent to', order.email)
  } catch (error) {
    console.error('[order-placed] Error:', {
      orderId: data?.id,
      orderEmail: order?.email,
      errorMessage: error instanceof Error ? error.message : String(error),
      error,
    })
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
