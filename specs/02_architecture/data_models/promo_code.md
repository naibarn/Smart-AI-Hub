model PromoCode {
  id          String   @id @default(uuid())
  code        String   @unique
  credits     Int
  maxUses     Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  redemptions PromoRedemption[]

  @@index([code])
  @@map("promo_codes")
}