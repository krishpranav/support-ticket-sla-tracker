"use server";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/session";
export type CreateState = Readonly<{ error?: string; ticketId?: string }>;
export async function createTicket(_: CreateState, form: FormData): Promise<CreateState> {
  try {
    const data = await api<{ createTicket: { id: string } }>("mutation($title:String!,$description:String!,$priority:Priority!){createTicket(title:$title,description:$description,priority:$priority){id}}", { title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), priority: String(form.get("priority") ?? "MEDIUM") }, await getToken());
    return { ticketId: data.createTicket.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to create ticket" };
  }
}
