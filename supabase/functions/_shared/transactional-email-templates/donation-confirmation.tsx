import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "dari.botevgrad"

interface DonationConfirmationProps {
  amount?: string
  campaignTitle?: string
  donationId?: string
  date?: string
}

const DonationConfirmationEmail = ({
  amount,
  campaignTitle,
  donationId,
  date,
}: DonationConfirmationProps) => (
  <Html lang="bg" dir="ltr">
    <Head />
    <Preview>Благодарим Ви за дарението на {amount ? `${amount} €` : ''} за {campaignTitle || 'кампания'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={logo}>{SITE_NAME}</Heading>
        </Section>

        <Section style={contentSection}>
          <Heading style={h1}>Благодарим Ви за дарението! 💚</Heading>
          <Text style={text}>
            Вашето дарение беше успешно обработено. Ето обобщение на вашата транзакция:
          </Text>

          <Section style={summaryBox}>
            {campaignTitle && (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Кампания:</span> {campaignTitle}
              </Text>
            )}
            {amount && (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Сума:</span> {amount} €
              </Text>
            )}
            {date && (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Дата:</span> {date}
              </Text>
            )}
            {donationId && (
              <Text style={summaryRow}>
                <span style={summaryLabel}>Референция:</span>{' '}
                <span style={refCode}>{donationId}</span>
              </Text>
            )}
          </Section>

          <Text style={text}>
            Вашата щедрост помага да направим промяна в нашата общност. Благодарим Ви, че подкрепяте каузата!
          </Text>

          <Section style={{ textAlign: 'center' as const, marginTop: '24px' }}>
            <Button style={button} href="https://dari.botevgrad.bg/active">
              Разгледай други кампании
            </Button>
          </Section>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          С уважение, Екипът на {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DonationConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `Потвърждение за дарение${data.campaignTitle ? ` — ${data.campaignTitle}` : ''}`,
  displayName: 'Потвърждение за дарение',
  previewData: {
    amount: '50',
    campaignTitle: 'Помощ за местното училище',
    donationId: 'abc12345',
    date: '31.03.2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', 'Inter', Arial, sans-serif" }
const container = { padding: '0', maxWidth: '560px', margin: '0 auto' }
const headerSection = {
  backgroundColor: '#2b9348',
  padding: '24px 32px',
  borderRadius: '12px 12px 0 0',
}
const logo = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '700' as const,
  margin: '0',
  fontFamily: "'Nunito', Arial, sans-serif",
}
const contentSection = { padding: '32px' }
const h1 = {
  fontSize: '22px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  margin: '0 0 16px',
  fontFamily: "'Nunito', Arial, sans-serif",
}
const text = {
  fontSize: '15px',
  color: '#444444',
  lineHeight: '1.6',
  margin: '0 0 16px',
  fontFamily: "'Inter', Arial, sans-serif",
}
const summaryBox = {
  backgroundColor: '#f0faf3',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '20px 0',
  border: '1px solid #d4edda',
}
const summaryRow = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.8',
  margin: '0',
  fontFamily: "'Inter', Arial, sans-serif",
}
const summaryLabel = { fontWeight: '600' as const, color: '#1a1a1a' }
const refCode = { fontFamily: 'monospace', fontSize: '13px', color: '#2b9348' }
const button = {
  backgroundColor: '#2b9348',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block' as const,
  fontFamily: "'Nunito', Arial, sans-serif",
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = {
  fontSize: '12px',
  color: '#999999',
  margin: '0',
  textAlign: 'center' as const,
  fontFamily: "'Inter', Arial, sans-serif",
}
