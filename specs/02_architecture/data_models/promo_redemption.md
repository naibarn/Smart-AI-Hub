model PromoRedemption {
  id        String   @id @default(uuid())
  userId    String
  codeId    String
  credits   Int
  redeemedAt DateTime @default(now())

  code PromoCode @relation(fields: [codeId], references: [id])

  @@unique([userId, codeId])
  @@index([userId])
  @@map("promo_redemptions")
}