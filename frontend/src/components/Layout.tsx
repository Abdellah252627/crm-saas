import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/auth-context";
import { Button } from "./ui/Button";

const NAV_ITEMS = [
  { to: "/", label: "لوحة التحكم", end: true },
  { to: "/clients", label: "العملاء", end: false },
  { to: "/pipeline", label: "خط الأنابيب", end: false },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex items-center gap-4">
            <span className="font-bold text-gray-900">CRM SaaS</span>
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
          <div className="flex items-center gap-3">
            {user !== null ? (
              <span className="hidden text-sm text-gray-500 sm:block">
                {user.name}
              </span>
            ) : null}
            <Button variant="secondary" onClick={() => void logout()}>
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl py-8">
        <Outlet />
      </main>
    </div>
  );
}
