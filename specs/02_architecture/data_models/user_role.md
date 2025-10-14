model UserRole {
  userId    String
  roleId    String
  assignedAt DateTime @default(now())

  user      User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}