import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiErrorMessage } from "../api/axios";
import { useCreateClient, useUpdateClient } from "../hooks/useClients";
import { STAGES, STAGE_LABELS, type Client } from "../types/client";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { LABEL_CLASS } from "../lib/ui";

const optionalEmail = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .email("البريد الإلكتروني غير صالح")
      .max(255),
  ])
  .optional();

const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(120),
  company: z.string().trim().max(120).optional(),
  email: optionalEmail,
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  stage: z.enum(STAGES).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
}

export function ClientModal({ client, onClose }: ClientModalProps) {
  const isEditing = client != null;
  const { mutateAsync: createClientMutation } = useCreateClient();
  const { mutateAsync: updateClientMutation } = useUpdateClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? "",
      company: client?.company ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      city: client?.city ?? "",
      stage: client?.stage ?? "LEAD",
    },
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function onSubmit(values: ClientFormValues) {
    try {
      if (isEditing && client) {
        await updateClientMutation({ id: client.id, data: values });
      } else {
        await createClientMutation(values);
      }
      onClose();
    } catch (requestError) {
      setError("root.serverError", {
        message: getApiErrorMessage(requestError),
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-gray-900/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold text-gray-900">
          {isEditing ? "تعديل العميل" : "إضافة عميل"}
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-4 space-y-4"
        >
          {errors.root?.serverError ? (
            <div
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {errors.root.serverError.message}
            </div>
          ) : null}
          <Input
            id="client-name"
            label="الاسم"
            type="text"
            autoComplete="name"
            required
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            id="client-company"
            label="الشركة"
            type="text"
            autoComplete="organization"
            error={errors.company?.message}
            {...register("company")}
          />
          <Input
            id="client-email"
            label="البريد الإلكتروني"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            id="client-phone"
            label="الهاتف"
            type="tel"
            autoComplete="tel"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            id="client-city"
            label="المدينة"
            type="text"
            autoComplete="address-level2"
            error={errors.city?.message}
            {...register("city")}
          />
          <div>
            <label
              htmlFor="client-stage"
              className={LABEL_CLASS}
            >
              المرحلة
            </label>
            <select
              id="client-stage"
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register("stage")}
            >
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full"
          >
            {isSubmitting
              ? "جارٍ الحفظ…"
              : isEditing
                ? "حفظ التعديلات"
                : "إضافة العميل"}
          </Button>
        </form>
      </div>
    </div>
  );
}
