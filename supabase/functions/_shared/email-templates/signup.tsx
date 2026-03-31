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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="bg" dir="ltr">
    <Head />
    <Preview>Потвърдете имейла си за {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Потвърдете имейла си</Heading>
        <Text style={text}>
          Благодарим ви за регистрацията в{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Моля, потвърдете имейл адреса си (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ), като натиснете бутона по-долу:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Потвърди имейл
        </Button>
        <Text style={footer}>
          Ако не сте създавали акаунт, можете спокойно да игнорирате този имейл.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
