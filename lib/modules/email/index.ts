/**
 * EMAIL MODULE - Public exports
 */

export type {
  EmailSettings,
  EmailMessage,
  EmailSendResult,
  EmailAddress,
  EmailPurpose,
  SmtpSettings,
  EmailTemplate
} from './types';

export {
  defaultEmailSettings,
  defaultEmailAddresses,
  defaultSmtpSettings,
  purposeLabels
} from './types';

export {
  readEmailSettings,
  writeEmailSettings,
  sendEmail,
  sendTestEmail,
  testSmtpConnection,
  getEmailAddress,
  getEmailAddressByPurpose,
  addEmailAddress,
  updateEmailAddress,
  deleteEmailAddress,
  sendOrderConfirmation,
  sendAdminInvitationEmail
} from './service';
