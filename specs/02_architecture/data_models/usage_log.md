model UsageLog {
  id         String   @id @default(uuid())
  userId     String
  service    String   // openai, claude
  model      String   // gpt-4, claude-3
  tokens     Int
  credits    Int
  metadata   Json?
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([service, createdAt])
  @@map("usage_logs")
}