import { useAuth } from "@/_core/hooks/useAuth";
import { LayoutDashboard, LogOut, PanelRight, Store, UserRound } from "lucide-react";
import { FormEvent, ReactNode, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "طلبات التقسيط", path: "/admin" },
  { icon: Store, label: "عرض المتجر", path: "/" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) return <div className="min-h-screen bg-[#f7fafb]" />;

  if (!user) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-[#f7fafb]" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-20 hidden w-[278px] flex-col bg-[#071d32] px-5 py-7 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="brand-mark">A</div>
          <div><p className="text-lg font-extrabold tracking-tight">Appl</p><p className="text-xs text-[#a6becd]">إدارة المتجر</p></div>
        </div>
        <nav className="mt-12 space-y-2">
          {menuItems.map(item => {
            const active = location === item.path;
            return <button key={item.path} onClick={() => setLocation(item.path)} className={`flex h-12 w-full items-center gap-3 rounded-xl px-4 text-right text-sm font-bold transition ${active ? "bg-[#173c5d] text-[#80e1d5]" : "text-[#c2d1dc] hover:bg-[#0b2e4d]"}`}>
              <item.icon className="h-4 w-4" />{item.label}
            </button>
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#80e1d5] text-[#071d32]"><UserRound className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">{user.name || "مدير المتجر"}</p><p className="text-xs text-[#a6becd]">{user.role === "admin" ? "مدير" : "حساب مستخدم"}</p></div></div>
          <button onClick={logout} className="mt-4 flex items-center gap-2 text-xs font-bold text-[#c2d1dc] hover:text-white"><LogOut className="h-3.5 w-3.5" />تسجيل الخروج</button>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 lg:mr-[278px] lg:px-9">
        <div className="flex items-center gap-2"><PanelRight className="h-4 w-4 text-[#25887e]" /><span className="text-sm font-extrabold text-[#071d32]">لوحة التحكم</span></div>
        <span className="rounded-full bg-[#eaf8f4] px-3 py-1 text-xs font-bold text-[#17845e]">بيانات محمية</span>
      </header>
      <main className="min-h-[calc(100vh-4rem)] p-5 lg:mr-[278px] lg:p-9">{children}</main>
    </div>
  );
}

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = trpc.adminAuth.login.useMutation({ onSuccess: () => window.location.reload(), onError: error => toast.error(error.message || "تعذر تسجيل الدخول") });
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate({ username, password }); };
  return <main className="min-h-screen grid place-items-center bg-[#f7fafb] px-4" dir="rtl"><section className="w-full max-w-md rounded-[30px] bg-white p-8 text-center shadow-xl shadow-slate-200/60"><div className="brand-mark mx-auto mb-6">A</div><h1 className="text-2xl font-extrabold text-[#071d32]">لوحة إدارة Appl</h1><p className="mt-3 text-sm leading-7 text-slate-500">سجّل الدخول لإدارة الطلبات وبيانات التوصيل.</p><form onSubmit={submit} className="mt-7 space-y-3 text-right"><label className="block text-xs font-bold text-slate-600">اسم المستخدم<input required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} className="form-field mt-2" /></label><label className="block text-xs font-bold text-slate-600">كلمة المرور<input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="form-field mt-2" /></label><Button type="submit" disabled={login.isPending} className="button-dark mt-4 h-12 w-full rounded-xl">{login.isPending ? "جارٍ التحقق…" : "تسجيل الدخول"}</Button></form></section></main>;
}

