import { NextRequest, NextResponse } from "next/server";
import {
  updateAdminUser,
  deleteAdminUser,
} from "@/lib/services/admin-users-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    const body = await req.json().catch(() => ({}));
    const { name, role } = body as {
      name?: string;
      role?: "admin" | "super_admin";
    };

    await updateAdminUser(email, { name, role });

    return NextResponse.json({
      success: true,
      message: "Admin user updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);
    await deleteAdminUser(email);

    return NextResponse.json({
      success: true,
      message: "Admin user deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete admin user" },
      { status: 500 }
    );
  }
}
