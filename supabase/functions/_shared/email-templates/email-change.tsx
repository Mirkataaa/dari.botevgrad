/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="bg" dir="ltr">
    <Head />
    <Preview>Потвърдете промяната на имейла за {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Промяна на имейл адрес</Heading>
        <Text style={text}>
          Заявихте промяна на имейл адреса си за {siteName} от{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          на{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Натиснете бутона по-долу, за да потвърдите промяната:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Потвърди промяната
        </Button>
        <Text style={footer}>
          Ако не сте заявили тази промяна, моля, защитете акаунта си незабавно.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Nunito', 'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#1a2e1a',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55675d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: '#2b9348', textDecoration: 'underline' }
const button = {
  backgroundColor: '#2b9348',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 24px',
  textDecoration: 'none',
  fontWeight: 'bold' as const,
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
