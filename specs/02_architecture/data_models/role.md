model Role {
  id          String   @id @default(uuid())
  name        String   @unique // admin, manager, user, guest
  description String?

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}