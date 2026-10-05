import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "../api/axios";
import { useAuth } from "../hooks/auth-context";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صالح").max(255),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(72),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LocationState {
  from?: string;
  registered?: boolean;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registered =
    (location.state as LocationState | null)?.registered === true;
  const from = (location.state as LocationState | null)?.from ?? "/";

  useEffect(() => {
    if (registered) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [registered, navigate, location.pathname]);

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values);
      navigate(from, { replace: true });
    } catch (requestError) {
      setError("root.serverError", {
        message: getApiErrorMessage(requestError),
      });
    }
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-[70vh] items-center justify-center py-12"
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold text-gray-900">تسجيل الدخول</h1>
        {registered ? (
          <div
            className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            role="status"
          >
            تم إنشاء حسابك بنجاح — سجّل دخولك الآن
          </div>
        ) : null}
        {errors.root?.serverError ? (
          <div
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errors.root.serverError.message}
          </div>
        ) : null}
        <Input
          id="email"
          label="البريد الإلكتروني"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          id="password"
          label="كلمة المرور"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {isSubmitting ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
        </Button>
        <p className="text-center text-sm text-gray-500">
          ليس لديك حساب؟{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            سجّل الآن
          </Link>
        </p>
      </form>
    </div>
  );
}
