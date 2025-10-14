model Permission {
  id          String   @id @default(uuid())
  name        String   @unique
  resource    String   // users, credits, services
  action      String   // create, read, update, delete

  roles       RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}