export function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && req.headers.get("x-admin-password") === expected;
}
