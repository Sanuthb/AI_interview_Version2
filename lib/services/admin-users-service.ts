import { adminSupabase } from "@/lib/supabase/admin";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "super_admin";
  created_by?: string;
}

export interface UpdateAdminUserInput {
  name?: string;
  password?: string;
  role?: "admin" | "super_admin";
}

// List all admin users
export async function listAdminUsers(): Promise<AdminUser[]> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { data, error } = await adminSupabase
    .from("admin_users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }

  return data || [];
}

// Get admin user by email (for authentication)
export async function getAdminByEmail(email: string): Promise<AdminUser | null> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { data, error } = await adminSupabase
    .from("admin_users")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error fetching admin by email:", error);
    throw error;
  }

  return data;
}

// Create a new admin user
export async function createAdminUser(
  input: CreateAdminUserInput
): Promise<{ admin: AdminUser; tempPassword: string }> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { name, email, password, role = "admin", created_by } = input;

  // Check if admin with this email already exists
  const { data: existing } = await adminSupabase
    .from("admin_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    throw new Error(`An admin account already exists for email ${email}`);
  }

  // Create admin user
  const { data, error } = await adminSupabase
    .from("admin_users")
    .insert({
      name,
      email,
      password,
      role,
      created_by: created_by || null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating admin user:", error);
    throw error || new Error("Failed to create admin user");
  }

  // Return the password that was set
  return { admin: data, tempPassword: password };
}

// Update admin user
export async function updateAdminUser(
  email: string,
  updates: UpdateAdminUserInput
): Promise<void> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { error } = await adminSupabase
    .from("admin_users")
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.password && { password: updates.password }),
      ...(updates.role && { role: updates.role }),
    })
    .eq("email", email);

  if (error) {
    console.error("Error updating admin user:", error);
    throw error;
  }
}

// Delete admin user
export async function deleteAdminUser(email: string): Promise<void> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { error } = await adminSupabase
    .from("admin_users")
    .delete()
    .eq("email", email);

  if (error) {
    console.error("Error deleting admin user:", error);
    throw error;
  }
}
