// src/lib/inquiries.ts
import { supabase } from "./supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

export interface Inquiry {
  id: number;
  project_id: number;
  user_id: string;
  title: string;
  content: string;
  inquiry_type: 'general' | 'proposal';
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  created_at: string;
  status: "pending" | "answered";
  Project: {
    title: string;
    users: {
      username: string;
      email?: string;
    };
  };
}

/**
 * Get all inquiries for a specific user.
 */
export async function getUserInquiries(userId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("ProjectInquiry")
    .select(`
      id,
      project_id,
      user_id,
      title,
      content,
      inquiry_type,
      contact_name,
      contact_email,
      contact_phone,
      created_at,
      status,
      Project (
        title,
        users (
          username
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inquiries:", error);
    return [];
  }
  
  // Return data as Inquiry[]
  return (data as unknown as Inquiry[]) || [];
}

/**
 * Add an inquiry for a project.
 */
export async function addInquiry(
  projectId: string | number,
  userId: string,
  title: string,
  content: string,
  inquiryType: 'general' | 'proposal' = 'general',
  contactName: string,
  contactEmail: string,
  contactPhone?: string
): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from("ProjectInquiry")
    .insert({
      project_id: Number(projectId),
      user_id: userId,
      title,
      content,
      inquiry_type: inquiryType,
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding inquiry:", error);
    return null;
  }
  return data as unknown as Inquiry;
}

/**
 * Delete an inquiry.
 */
export async function deleteInquiry(inquiryId: number, userId: string): Promise<{ data: null; error: PostgrestError | null }> {
  let query = supabase.from("ProjectInquiry").delete().eq("id", inquiryId);
  // If userId is provided, it's a user deleting their own. Otherwise, it's an admin.
  if (userId) {
    query = query.eq("user_id", userId);
  }
  const { error } = await query;

  return { data: null, error };
}

/**
 * (Admin) Get all inquiries.
 */
export async function getAllInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("ProjectInquiry")
    .select(`
      id,
      project_id,
      user_id,
      title,
      content,
      inquiry_type,
      contact_name,
      contact_email,
      contact_phone,
      created_at,
      status,
      Project (
        title,
        users (
          username,
          email
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all inquiries:", error);
    return [];
  }
  
  return (data as unknown as Inquiry[]) || [];
}

/**
 * (Admin) Update inquiry status.
 */
export async function updateInquiryStatus(
  inquiryId: number,
  status: "pending" | "answered"
): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from("ProjectInquiry")
    .update({ status })
    .eq("id", inquiryId)
    .select()
    .single();

  if (error) {
    console.error("Error updating inquiry status:", error);
    return null;
  }
  return data as unknown as Inquiry;
}

