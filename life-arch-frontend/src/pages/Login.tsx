import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";

// 1. Define the validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  // 2. Initialize the form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // 3. Handle submission
  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setServerError(null);
      const response = await api.post("/auth/login", data);

      // Save token, email, and fullName to Zustand
      setAuth(response.data.token, response.data.email, response.data.fullName);

      // Redirect to the protected app area
      navigate("/app", { replace: true });
    } catch (error: any) {
      setServerError(
        error.response?.data?.message || "Invalid email or password",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#85a3c2] rounded-xl text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-500/20">
            L
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Sign in to continue your progress with LifeArch.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-2">
            <span className="text-lg">⚠️</span> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="name@example.com"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all text-slate-800 dark:text-slate-200"
            />
            {errors.email && (
              <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#85a3c2] outline-none transition-all text-slate-800 dark:text-slate-200"
            />
            {errors.password && (
              <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-[#85a3c2] hover:bg-[#7291b0] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#85a3c2] font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
