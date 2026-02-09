import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('[order-placed] event received', { orderId: data.id })
  let order: any
  try {
    const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
    
    order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })

    // shipping_address pode vir populado pela relation ou como ID
    let shippingAddress = order.shipping_address
    if (shippingAddress && typeof shippingAddress === 'object' && 'address_1' in shippingAddress) {
      // ja populado
    } else if (shippingAddress?.id) {
      try {
        const addrSvc = (orderModuleService as any).orderAddressService_
        if (addrSvc) shippingAddress = await addrSvc.retrieve(shippingAddress.id)
      } catch (e) {
        console.warn('[order-placed] Could not retrieve shipping_address, using fallback', e)
        shippingAddress = { first_name: '', last_name: '', address_1: '', city: '', province: '', postal_code: '', country_code: 'US' }
      }
    } else {
      shippingAddress = { first_name: '', last_name: '', address_1: '', city: '', province: '', postal_code: '', country_code: 'US' }
    }

    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: 'Your order has been placed'
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order!'
      }
    })
  } catch (error) {
    console.error('[order-placed] Error:', {
      orderId: data.id,
      orderEmail: order?.email,
      errorMessage: error instanceof Error ? error.message : String(error),
      error,
    })
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
