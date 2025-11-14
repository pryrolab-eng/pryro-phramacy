import { createClient } from "../../../supabase/server";

export default async function DebugAuth() {
  const supabase = createClient();
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    let pharmacyData = null;
    if (user) {
      const { data, error } = await supabase
        .from('pharmacy_users')
        .select('*')
        .eq('user_id', user.id);
      pharmacyData = { data, error: error?.message };
    }

    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">User Status:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                hasUser: !!user,
                userEmail: user?.email,
                userId: user?.id,
                userError: userError?.message
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Session Status:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify({
                hasSession: !!session,
                sessionError: sessionError?.message,
                expiresAt: session?.expires_at
              }, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold mb-2">Pharmacy Access:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(pharmacyData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Debug Error</h1>
        <pre className="bg-red-100 p-4 rounded text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }
}