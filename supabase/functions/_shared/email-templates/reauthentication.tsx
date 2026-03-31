/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="bg" dir="ltr">
    <Head />
    <Preview>Вашият код за потвърждение</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Потвърждение на самоличност</Heading>
        <Text style={text}>Използвайте кода по-долу, за да потвърдите самоличността си:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Кодът ще изтече скоро. Ако не сте поискали това, можете спокойно да
          игнорирате този имейл.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#2b9348',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
