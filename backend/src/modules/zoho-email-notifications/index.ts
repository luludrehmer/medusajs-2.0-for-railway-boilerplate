import { ModuleProviderExports } from '@medusajs/framework/types'
import { ZohoSmtpNotificationService } from './zoho-smtp'

const services = [ZohoSmtpNotificationService]

const providerExport: ModuleProviderExports = {
  services,
}

export default providerExport
