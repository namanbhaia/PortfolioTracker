"use client"
export default function LoginPage() {
  const handleLogin = async (data) => {
    // 1. Hash password
    // 2. Validate against 'Profiles' table
    // 3. Set 'user_id' in session/cookie
    // 4. Redirect to /dashboard
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-sm p-8 space-y-4 border rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Portfolio Manager</h1>
        <input type="email" placeholder="Email" className="w-full p-2 border" />
        <input type="password" placeholder="Password" className="w-full p-2 border" />
        <button className="w-full bg-black text-white p-2 rounded">Access Accounts</button>
      </div>
    </div>
  );
}