import { NextRequest, NextResponse } from "next/server";
import {
  createAdminUser,
  listAdminUsers,
} from "@/lib/services/admin-users-service";

export async function GET() {
  try {
    const admins = await listAdminUsers();
    return NextResponse.json({ success: true, data: admins });
  } catch (error: any) {
    console.error("Error listing admin users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list admin users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, password, role, created_by } = body as {
      name?: string;
      email?: string;
      password?: string;
      role?: "admin" | "super_admin";
      created_by?: string;
    };

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    const { admin, tempPassword } = await createAdminUser({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role: role || "admin",
      created_by,
    });

    return NextResponse.json({
      success: true,
      data: {
        admin,
        tempPassword,
      },
    });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create admin user" },
      { status: 500 }
    );
  }
}
