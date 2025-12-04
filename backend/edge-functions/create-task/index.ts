// LearnLynk Tech Test - Task 3: Edge Function create-task

// Deno + Supabase Edge Functions style
// Docs reference: https://supabase.com/docs/guides/functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

// Basic env sanity check (will fail fast in logs if misconfigured)
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment");
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

type CreateTaskPayload = {
  application_id?: string;
  task_type?: string;
  due_at?: string;
};

const ALLOWED_TASK_TYPES = ["call", "email", "review"] as const;

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = (await req.json()) as CreateTaskPayload;
    const { application_id, task_type, due_at } = body;

    // TODO: validate application_id, task_type, due_at
    // - check task_type in VALID_TYPES
    // - parse due_at and ensure it's in the future

    // Answer Starts


    if (!application_id || typeof application_id !== "string") {
      return Response.json(
        { error: "application_id is required and must be a string" },
        { status: 400 },
      );
    }

    if (!task_type || typeof task_type !== "string") {
      return Response.json(
        { error: "task_type is required and must be a string" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TASK_TYPES.includes(task_type as any)) {
      return Response.json(
        { error: "task_type must be one of: call, email, review" },
        { status: 400 },
      );
    }

    if (!due_at || typeof due_at !== "string") {
      return Response.json(
        { error: "due_at is required and must be an ISO timestamp string" },
        { status: 400 },
      );
    }

    const dueDate = new Date(due_at);
    if (Number.isNaN(dueDate.getTime())) {
      return Response.json(
        { error: "due_at must be a valid ISO 8601 timestamp" },
        { status: 400 },
      );
    }

    const now = new Date();
    if (dueDate <= now) {
      return Response.json(
        { error: "due_at must be a future timestamp" },
        { status: 400 },
      );
    }

    // Answer Ends


    // ---- Fetch application to derive tenant_id ----
    // This ensures we respect the schema that requires tenant_id on tasks.

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .select("id, tenant_id")
      .eq("id", application_id)
      .single();

    if (applicationError || !application) {
      console.error("Application lookup failed", applicationError);
      return Response.json(
        { error: "Invalid application_id" },
        { status: 400 },
      );
    }

    // TODO: insert into tasks table using supabase client
    // TODO: handle error and return appropriate status code


    //Answer Starts

    const { data: taskRows, error: taskError } = await supabase
      .from("tasks")
      .insert({
        tenant_id: application.tenant_id,
        application_id: application.id,
        title: null, // could be default else all good
        type: task_type,
        status: "open",
        due_at: due_at, // Supabase can convert using timestamptz
      })
      .select("id")
      .single();

    if (taskError || !taskRows) {
      console.error("Task insert failed", taskError);
      return Response.json(
        { error: "Failed to create task" },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        task_id: taskRows.id,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Unexpected error in create-task function:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }

  // Answer Ends
});
