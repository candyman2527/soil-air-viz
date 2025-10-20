import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin status
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminCheck } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!adminCheck) {
      throw new Error('Forbidden: Admin access required');
    }

    const { action, userId, role } = await req.json();

    console.log(`Admin action: ${action} for user: ${userId}`);

    switch (action) {
      case 'delete_user': {
        // Delete user from auth
        const { error } = await supabaseClient.auth.admin.deleteUser(userId);
        if (error) throw error;

        console.log(`User ${userId} deleted successfully`);
        return new Response(
          JSON.stringify({ success: true, message: 'User deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add_role': {
        const { error } = await supabaseClient
          .from('user_roles')
          .insert({ user_id: userId, role });
        
        if (error) throw error;

        console.log(`Role ${role} added to user ${userId}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Role added successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove_role': {
        const { error } = await supabaseClient
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        
        if (error) throw error;

        console.log(`Role ${role} removed from user ${userId}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Role removed successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('Error in admin-manage-users:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: error.message.includes('Unauthorized') ? 401 : 
                error.message.includes('Forbidden') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});