import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { getApiErrorMessage } from "../api/axios";
import { useAuth } from "../hooks/auth-context";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
    email: z.string().trim().email("البريد الإلكتروني غير صالح").max(255),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .max(72),
    confirmPassword: z.string().min(1, "يرجى تأكيد كلمة المرور"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function Register() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      navigate("/login", { state: { registered: true } });
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
        <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب</h1>
        {errors.root?.serverError ? (
          <div
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errors.root.serverError.message}
          </div>
        ) : null}
        <Input
          id="name"
          label="الاسم الكامل"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          id="confirmPassword"
          label="تأكيد كلمة المرور"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {isSubmitting ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب"}
        </Button>
        <p className="text-center text-sm text-gray-500">
          لديك حساب؟{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            سجّل دخولك
          </Link>
        </p>
      </form>
    </div>
  );
}
