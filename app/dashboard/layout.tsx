import Sidebar from '@/components/dashboard/sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Persistent Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                {/* Optional: Top Global Header could go here */}
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}