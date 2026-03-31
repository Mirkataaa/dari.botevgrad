/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="bg" dir="ltr">
    <Head />
    <Preview>Възстановяване на парола за {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Възстановяване на парола</Heading>
        <Text style={text}>
          Получихме заявка за нулиране на паролата ви за {siteName}. Натиснете
          бутона по-долу, за да изберете нова парола.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Нулиране на парола
        </Button>
        <Text style={footer}>
          Ако не сте поискали нулиране на паролата, можете спокойно да игнорирате
          този имейл. Паролата ви няма да бъде променена.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
