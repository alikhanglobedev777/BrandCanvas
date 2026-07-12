"use client";

import {
  getAuthMeQueryKey,
  type LoginDto,
  useAuthLogin,
} from "@brandcanvas/contracts";
import { AppButton, AuthShell } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

export function AdminLoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({ defaultValues: { email: "", password: "" } });

  const login = useAuthLogin({
    mutation: {
      onSuccess: async (response) => {
        queryClient.setQueryData(getAuthMeQueryKey(), response.user);
        await queryClient.invalidateQueries({ queryKey: getAuthMeQueryKey() });
        router.replace("/admin/dashboard");
      },
    },
  });

  const onSubmit = handleSubmit((data) => login.mutate({ data }));

  return (
    <AuthShell>
      <Stack component="form" spacing={3} onSubmit={onSubmit} noValidate>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>
            BrandCanvas administration
          </Typography>
          <Typography variant="h4">Sign in</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Super admins and sellers use the same portal. Your account permissions determine which tools are available.
          </Typography>
        </Box>

        {login.isError ? <Alert severity="error">{getApiErrorMessage(login.error, "Sign in failed.")}</Alert> : null}

        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register("email", {
            required: "Email is required.",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address." },
          })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register("password", {
            required: "Password is required.",
            minLength: { value: 8, message: "Password must contain at least 8 characters." },
          })}
        />
        <AppButton type="submit" loading={login.isPending}>
          Sign in
        </AppButton>
      </Stack>
    </AuthShell>
  );
}
