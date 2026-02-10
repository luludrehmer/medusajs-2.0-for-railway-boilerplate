import { Text, Section, Hr, Img, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

type ItemWithMeta = { metadata?: Record<string, unknown>; variant?: { title?: string } }

function getPreviewUrl(item: ItemWithMeta): string | undefined {
  const meta = item.metadata ?? {}
  const productConfig = meta.productConfig as Record<string, unknown> | undefined
  const photoUrls = meta.photoUrls as string[] | undefined
  const url =
    (meta.previewImageUrl as string) ??
    (meta.preview_image_url as string) ??
    (productConfig?.previewImageUrl as string) ??
    (productConfig?.preview_image_url as string) ??
    (Array.isArray(photoUrls) && photoUrls[0] ? photoUrls[0] : undefined)
  return typeof url === 'string' && url.length > 0 && !url.includes('localhost') ? url : undefined
}

function getDownloadUrl(item: ItemWithMeta): string | undefined {
  const meta = item.metadata ?? {}
  const productConfig = meta.productConfig as Record<string, unknown> | undefined
  const url =
    (meta.downloadUrl as string) ??
    (meta.download_url as string) ??
    (productConfig?.downloadUrl as string) ??
    (productConfig?.download_url as string) ??
    getPreviewUrl(item)
  return typeof url === 'string' && url.length > 0 && !url.includes('localhost') ? url : undefined
}

function isDigitalItem(item: ItemWithMeta): boolean {
  const meta = item.metadata ?? {}
  const variantTitle = (item.variant?.title as string) || ''
  return (
    meta.productType === 'digital' ||
    meta.productType === 'Digital' ||
    meta.variantType === 'digital' ||
    meta.source === 'art-transform' ||
    variantTitle.toLowerCase().includes('digital')
  )
}

export const ORDER_PLACED = 'order-placed'

interface OrderPlacedPreviewProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
}

export interface OrderPlacedTemplateProps {
  order: OrderDTO & { display_id: string; summary: { raw_current_order_total: { value: number } } }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isOrderPlacedTemplateData = (data: any): data is OrderPlacedTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
  PreviewProps: OrderPlacedPreviewProps
} = ({ order, shippingAddress, preview = 'Your order has been placed!' }) => {
  return (
    <Base preview={preview}>
      <Section>
        <Text style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }}>
          Order Confirmation
        </Text>

        <Text style={{ margin: '0 0 15px' }}>
          Dear {shippingAddress?.first_name ?? ''} {shippingAddress?.last_name ?? ''},
        </Text>

        <Text style={{ margin: '0 0 30px' }}>
          Thank you for your recent order! Here are your order details:
        </Text>

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Order Summary
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order ID: {order.display_id ?? order.id}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          Order Date: {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          Total: {order.summary?.raw_current_order_total?.value ?? order.total ?? '—'} {order.currency_code ?? 'USD'}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }}>
          Shipping Address
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {shippingAddress?.address_1 ?? '—'}
        </Text>
        <Text style={{ margin: '0 0 5px' }}>
          {[shippingAddress?.city, shippingAddress?.province, shippingAddress?.postal_code].filter(Boolean).join(', ') || '—'}
        </Text>
        <Text style={{ margin: '0 0 20px' }}>
          {shippingAddress?.country_code ?? '—'}
        </Text>

        <Hr style={{ margin: '20px 0' }} />

        <Text style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }}>
          Order Items
        </Text>

        <div style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
          margin: '10px 0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f2f2f2',
            padding: '8px',
            borderBottom: '1px solid #ddd'
          }}>
            <Text style={{ fontWeight: 'bold' }}>Item</Text>
            <Text style={{ fontWeight: 'bold' }}>Quantity</Text>
            <Text style={{ fontWeight: 'bold' }}>Price</Text>
          </div>
          {(order.items ?? []).map((item: any) => {
            const itemTyped = item as ItemWithMeta
            const imageUrl = getPreviewUrl(itemTyped)
            const imgSrc = imageUrl ? (imageUrl.includes('?') ? imageUrl : `${imageUrl}?w=120&q=80`) : null
            const downloadUrl = isDigitalItem(itemTyped) ? getDownloadUrl(itemTyped) : undefined
            return (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid #ddd'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  {imgSrc && (
                    <Img
                      src={imgSrc}
                      alt={item.title || 'Item'}
                      width={48}
                      height={48}
                      style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  )}
                  <div>
                    <Text style={{ margin: 0 }}>{item.title}{item.product_title ? ` - ${item.product_title}` : ''}</Text>
                    {downloadUrl && (
                      <Link
                        href={downloadUrl}
                        style={{
                          fontSize: '14px',
                          color: '#2563eb',
                          textDecoration: 'underline',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}
                      >
                        Download your artwork
                      </Link>
                    )}
                  </div>
                </div>
                <Text>{item.quantity}</Text>
                <Text>{item.unit_price} {order.currency_code}</Text>
              </div>
            )
          })}
        </div>
      </Section>
    </Base>
  )
}

OrderPlacedTemplate.PreviewProps = {
  order: {
    id: 'test-order-id',
    display_id: 'ORD-123',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    currency_code: 'USD',
    items: [
      { id: 'item-1', title: 'Pet Portrait Art', product_title: 'Pet Portrait Art', quantity: 1, unit_price: 29, metadata: { source: 'art-transform', previewImageUrl: 'https://pub-ec72d28400074017a168ab75baec0ff4.r2.dev/hero-carousel/hero-5.webp' } },
      { id: 'item-2', title: 'Item 2', product_title: 'Product 2', quantity: 1, unit_price: 25 }
    ],
    shipping_address: {
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Main St',
      city: 'Anytown',
      province: 'CA',
      postal_code: '12345',
      country_code: 'US'
    },
    summary: { raw_current_order_total: { value: 45 } }
  },
  shippingAddress: {
    first_name: 'Test',
    last_name: 'User',
    address_1: '123 Main St',
    city: 'Anytown',
    province: 'CA',
    postal_code: '12345',
    country_code: 'US'
  }
} as OrderPlacedPreviewProps

export default OrderPlacedTemplate
