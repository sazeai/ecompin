"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { ADMIN_COOKIE, createAdminToken, verifyAdminPassword } from "@/lib/marketplace/admin-auth"

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") || "")
  if (!verifyAdminPassword(password)) redirect("/admin?error=1")

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  })
  redirect("/admin")
}
