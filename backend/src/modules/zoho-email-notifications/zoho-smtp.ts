/**
 * Zoho SMTP Notification Provider for Medusa v2
 * Uses same env vars as Photos-to-Paintings: ZOHO_SMTP_USER, ZOHO_SMTP_PASS, ZOHO_SMTP_FROM
 */

import { Logger, NotificationTypes } from '@medusajs/framework/types'
import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import { render } from '@react-email/render'
import React from 'react'
import nodemailer from 'nodemailer'
import { generateEmailTemplate } from '../email-notifications/templates'

type InjectedDependencies = {
  logger: Logger
}

interface ZohoSmtpOptions {
  user: string
  pass: string
  from: string
}

export class ZohoSmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = 'ZOHO_SMTP_SERVICE'
  protected config_: ZohoSmtpOptions
  protected logger_: Logger

  constructor({ logger }: InjectedDependencies, options: ZohoSmtpOptions) {
    super()
    this.config_ = options
    this.logger_ = logger
  }

  async send(
    notification: NotificationTypes.ProviderSendNotificationDTO
  ): Promise<NotificationTypes.ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'No notification information provided')
    }
    if (notification.channel === 'sms') {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'SMS notification not supported')
    }

    let emailContent: React.ReactNode
    try {
      emailContent = generateEmailTemplate(notification.template, notification.data)
    } catch (error) {
      if (error instanceof MedusaError) {
        throw error
      }
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to generate email content for template: ${notification.template}`
      )
    }

    const emailOptions = notification.data?.emailOptions as { subject?: string } | undefined
    const subject = emailOptions?.subject ?? 'You have a new notification'

    const html = await render(emailContent as React.ReactElement)

    const port = parseInt(process.env.ZOHO_SMTP_PORT || '465', 10)
    const transporter = nodemailer.createTransport({
      host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
      port,
      secure: port === 465,
      auth: {
        user: this.config_.user,
        pass: this.config_.pass,
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    })

    await transporter.sendMail({
      from: this.config_.from,
      to: notification.to,
      subject,
      html,
    })

    this.logger_.log(
      `Successfully sent "${notification.template}" email to ${notification.to} via Zoho SMTP`
    )
    return {}
  }
}
