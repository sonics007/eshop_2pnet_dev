/**
 * EMAIL MODULE - Types (IMAP only)
 */

// ==================== IMAP SETTINGS ====================
export interface ImapSettings {
  host: string;
  port: number;
  secure: boolean; // SSL/TLS
  auth: {
    user: string;
    pass: string;
  };
}

// ==================== SMTP SETTINGS (odosielanie) ====================
export interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean; // true pre SSL/TLS (465), false pre STARTTLS (587)
  auth: {
    user: string;
    pass: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
  connectionTimeout?: number;
  greetingTimeout?: number;
}

// ==================== EMAIL ADDRESSES ====================

export type EmailPurpose =
  | 'general'
  | 'orders'
  | 'support'
  | 'complaints'
  | 'invoices'
  | 'marketing'
  | 'noreply';

export interface EmailAddress {
  id: string;
  purpose: EmailPurpose;
  label: string;
  email: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  enabled: boolean;
}

// ==================== EMAIL SETTINGS ====================

export interface EmailSettings {
  // IMAP nastavenia (prijímanie)
  imap: ImapSettings;

  // SMTP nastavenia (odosielanie)
  smtp: SmtpSettings;

  // Emailové adresy pre rôzne účely (len úložisko)
  addresses: EmailAddress[];

  // Predvolené mená/adresy (uloženie)
  defaultFromEmail: string;
  defaultFromName: string;
  defaultReplyTo?: string;
  fromAliases?: string[];
  publicBaseUrl?: string; // (NEXT_PUBLIC_SITE_URL) pre generovanie linkov v emailoch

  // Šablóna registračného emailu
  registrationTemplate: RegistrationTemplate;
  templates?: EmailTemplate[];

  // Vypínač (len informácia)
  enabled: boolean;
  testMode: boolean;
  testModeRecipient?: string;

  // Footer/Branding (uloženie)
  footerHtml?: string;
  footerText?: string;
  logoUrl?: string;
  brandColor?: string;
}

export interface RegistrationTemplate {
  subject: string;
  title: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  closing: string;
  fromEmail?: string;
}

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  title: string;
  intro: string;
  buttonLabel: string;
  buttonUrl: string;
  closing: string;
  fromEmail?: string;
}

// ==================== DEFAULT VALUES ====================

export const defaultImapSettings: ImapSettings = {
  host: '',
  port: 993,
  secure: true,
  auth: {
    user: '',
    pass: ''
  }
};

export const defaultSmtpSettings: SmtpSettings = {
  host: '',
  port: 587,
  secure: false,
  auth: {
    user: '',
    pass: ''
  },
  tls: {
    rejectUnauthorized: true
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000
};

export const defaultEmailAddresses: EmailAddress[] = [
  {
    id: 'general',
    purpose: 'general',
    label: 'Všeobecný kontakt',
    email: '',
    name: 'Eshop',
    isDefault: true,
    enabled: true
  },
  {
    id: 'orders',
    purpose: 'orders',
    label: 'Objednávky',
    email: '',
    name: 'Objednávky',
    isDefault: true,
    enabled: true
  },
  {
    id: 'support',
    purpose: 'support',
    label: 'Podpora',
    email: '',
    name: 'Zákaznícka podpora',
    isDefault: true,
    enabled: true
  },
  {
    id: 'complaints',
    purpose: 'complaints',
    label: 'Reklamácie',
    email: '',
    name: 'Reklamácie',
    isDefault: true,
    enabled: true
  },
  {
    id: 'invoices',
    purpose: 'invoices',
    label: 'Faktúry',
    email: '',
    name: 'Fakturácia',
    isDefault: true,
    enabled: true
  },
  {
    id: 'noreply',
    purpose: 'noreply',
    label: 'No-reply',
    email: '',
    name: 'Eshop',
    isDefault: true,
    enabled: true
  }
];

export const defaultRegistrationTemplate: RegistrationTemplate = {
  subject: 'Vitajte v eshope',
  title: 'Ďakujeme za registráciu',
  intro: 'Váš účet bol úspešne vytvorený. Nižšie nájdete odkaz na prihlásenie.',
  buttonLabel: 'Prejsť do účtu',
  buttonUrl: '/account',
  closing: 'Ak ste sa neregistrovali vy, ignorujte tento email.'
};

export const defaultTemplates: EmailTemplate[] = [
  {
    id: 'registration',
    key: 'registration',
    name: 'Registrácia',
    subject: defaultRegistrationTemplate.subject,
    title: defaultRegistrationTemplate.title,
    intro: defaultRegistrationTemplate.intro,
    buttonLabel: defaultRegistrationTemplate.buttonLabel,
    buttonUrl: defaultRegistrationTemplate.buttonUrl,
    closing: defaultRegistrationTemplate.closing,
    fromEmail: ''
  },
  {
    id: 'reset',
    key: 'reset',
    name: 'Obnova hesla',
    subject: 'Obnova hesla',
    title: 'Obnova hesla',
    intro: 'Požiadali ste o obnovu hesla. Kliknite na tlačidlo nižšie a nastavte si nové heslo.',
    buttonLabel: 'Obnoviť heslo',
    buttonUrl: '/account/reset',
    closing: 'Ak ste o obnovu nežiadali, ignorujte tento email.',
    fromEmail: ''
  },
  {
    id: 'issue',
    key: 'issue',
    name: 'Hlásenie chýb',
    subject: 'Aktualizácia hlásenia',
    title: 'Vaše hlásenie bolo aktualizované',
    intro: 'Prinášame vám aktuálne informácie k vášmu hláseniu. Nižšie nájdete detail a komentáre.',
    buttonLabel: 'Zobraziť hlásenie',
    buttonUrl: '/admin/issues',
    closing: 'Ak máte ďalšie otázky, odpovedzte na tento email.',
    fromEmail: ''
  },
  {
    id: 'admin-invitation',
    key: 'admin-invitation',
    name: 'Pozvánka administrátora',
    subject: 'Pozvánka do administrácie e-shopu',
    title: 'Boli ste pozvaní ako administrátor',
    intro: 'Boli ste pridaní ako administrátor e-shopu. Kliknite na tlačidlo nižšie a nastavte si heslo pre prístup do administrácie.',
    buttonLabel: 'Nastaviť heslo',
    buttonUrl: '/admin/set-password',
    closing: 'Tento odkaz je platný 24 hodín. Ak ste o tento prístup nežiadali, kontaktujte správcu systému.',
    fromEmail: ''
  }
];

export const defaultEmailSettings: EmailSettings = {
  imap: defaultImapSettings,
  smtp: defaultSmtpSettings,
  addresses: defaultEmailAddresses,
  defaultFromEmail: '',
  defaultFromName: 'Eshop',
  defaultReplyTo: '',
  fromAliases: [],
  publicBaseUrl: '',
  registrationTemplate: defaultRegistrationTemplate,
  templates: defaultTemplates,
  enabled: false,
  testMode: false,
  testModeRecipient: '',
  footerHtml: '',
  footerText: '',
  logoUrl: '',
  brandColor: '#1e293b'
};

// ==================== EMAIL MESSAGE ====================
export interface EmailMessage {
  to: string | string[];
  subject: string;
  from?: {
    email: string;
    name?: string;
  };
  replyTo?: string;
  html?: string;
  text?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ==================== PURPOSE LABELS ====================

export const purposeLabels: Record<EmailPurpose, string> = {
  general: 'Všeobecný kontakt',
  orders: 'Objednávky',
  support: 'Podpora',
  complaints: 'Reklamácie',
  invoices: 'Faktúry',
  marketing: 'Marketing',
  noreply: 'No-reply'
};
