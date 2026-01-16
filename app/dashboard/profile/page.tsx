import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ProfilePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return notFound();
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single();

    const { data: clients } = await supabase
        .from('clients')
        .select('client_name, trading_id, dp_id')
        .eq('user_id', user.id);

    return (
        <div className="p-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>Your personal information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="font-semibold">Username</p>
                        <p>{profile?.username || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Full Name</p>
                        <p>{profile?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Email</p>
                        <p>{user.email}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Client Details</CardTitle>
                    <CardDescription>Clients you have access to.</CardDescription>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-left">
                        <thead>
                            <tr>
                                <th className="py-2">Client Name</th>
                                <th className="py-2">Trading ID</th>
                                <th className="py-2">DP ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients?.map((client) => (
                                <tr key={client.trading_id}>
                                    <td className="py-2">{client.client_name}</td>
                                    <td className="py-2">{client.trading_id}</td>
                                    <td className="py-2">{client.dp_id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
