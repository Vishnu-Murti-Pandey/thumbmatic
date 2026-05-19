import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { loginService } from "../services/loginService.js";

export default function ThumbmaticLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
    } else if (name === "password") {
      setPassword(value);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter email");
      return;
    }

    if (!password.trim()) {
      toast.error("Please enter password");
      return;
    }

    try {
      setLoading(true);
      const data = await loginService(email, password);

      localStorage.setItem("access_token", data.access_token);
      toast.success(data.message || "Login successful");
      navigate("/");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050816] text-white flex items-center justify-center px-6 py-10">
      <Toaster position="top-right" />
      {/* BACKGROUND */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/20 blur-[140px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[140px] rounded-full" />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_0_120px_rgba(0,0,0,0.45)] grid lg:grid-cols-2">
        {/* LEFT */}
        <div className="hidden lg:flex flex-col justify-center p-14 border-r border-white/10 relative">
          {/* floating glow */}
          <div className="absolute top-20 left-20 w-40 h-40 bg-fuchsia-500/20 blur-[90px] rounded-full" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-indigo-500/20 blur-[90px] rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 mb-8">
              <Sparkles size={16} className="text-fuchsia-300" />

              <span className="text-sm text-white/70 tracking-wide">
                AI Thumbnail Creator
              </span>
            </div>

            <h1 className="text-6xl font-black leading-[0.95] tracking-tight">
              Welcome to
              <span className="block mt-3 bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Thumbmatic
              </span>
            </h1>

            <p className="mt-8 text-lg leading-relaxed text-white/60 max-w-md">
              Generate cinematic, viral YouTube thumbnails using AI. Upload your
              headshot, describe your idea, and let Thumbmatic create
              scroll-stopping visuals instantly.
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-14">
          <div className="w-full max-w-md">
            {/* MOBILE BRAND */}
            <div className="lg:hidden mb-10">
              <h1 className="text-4xl font-black tracking-tight">Thumbmatic</h1>

              <p className="text-white/50 mt-3 leading-relaxed">
                AI-powered viral thumbnail generation for creators.
              </p>
            </div>

            {/* LOGIN HEADER */}
            <div className="mb-10">
              <h2 className="text-5xl font-black tracking-tight">Log In</h2>

              <p className="text-white/50 mt-4 text-lg">
                Continue creating viral thumbnails.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* EMAIL */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-fuchsia-500/40 transition-all"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-5 py-4 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-fuchsia-500/40 transition-all"
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="group relative cursor-pointer overflow-hidden w-full rounded-[24px] py-4 text-lg font-bold bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 hover:scale-[1.01] transition-all shadow-[0_20px_80px_rgba(168,85,247,0.35)] disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Logging In...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Login to Thumbmatic
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* FOOTER */}
            <p className="text-center text-white/40 text-sm mt-4">
              Don&apos;t have an account?{" "}
              <span
                onClick={() => navigate("/register")}
                className="text-fuchsia-300 hover:text-fuchsia-200 cursor-pointer font-medium transition"
              >
                Register
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
 