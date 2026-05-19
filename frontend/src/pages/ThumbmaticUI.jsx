import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Sparkles,
  Upload,
  Wand2,
  Zap,
  Cloud,
  ImageIcon,
  Clapperboard,
  Layers3,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Cpu,
  Activity,
  LogOut,
} from "lucide-react";

import {
  uploadHeadshot,
  createJob,
  subscribeToJob,
  getJob,
  userProfileService,
} from "../services/jobService.js";

const styles = [
  {
    id: 1,
    label: "1 Thumbnail Pack",
    icon: <ImageIcon size={18} />,
    desc: "Generate: Bold Dramatic",
    includes: ["Bold Dramatic"],
  },
  {
    id: 2,
    label: "2 Thumbnail Pack",
    icon: <Sparkles size={18} />,
    desc: "Generate: Bold Dramatic + Clean Minimal",
    includes: ["Bold Dramatic", "Clean Minimal"],
  },
  {
    id: 3,
    label: "3 Thumbnail Pack",
    icon: <Clapperboard size={18} />,
    desc: "Generate all premium styles",
    includes: ["Bold Dramatic", "Clean Minimal", "Vibrant Energetic"],
  },
];

export default function ThumbmaticUI() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const eventSourceRef = useRef(null);
  const streamRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(1);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [streamEvents, setStreamEvents] = useState([]);

  const [userData, setUserData] = useState(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const data = await userProfileService();
        setUserData(data);
      } catch (error) {
        toast.error(
          error?.response?.data?.detail || "Failed to fetch user data",
        );
      }
    }

    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTo({
        top: streamRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [streamEvents]);

  const progress = useMemo(() => {
    if (!result?.thumbnails?.length) return 0;

    const finished = result.thumbnails.filter(
      (t) => t.status === "uploaded" || t.status === "failed",
    ).length;

    return Math.round((finished / result.thumbnails.length) * 100);
  }, [result]);

  const addEvent = ({ type = "info", title, message, image = null }) => {
    setStreamEvents((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        image,
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "image/png") {
      toast.error("Only PNG files are allowed");

      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));

    addEvent({
      type: "success",
      title: "Headshot Selected",
      message: `${file.name} ready for generation`,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please upload a headshot");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setStreamEvents([]);

      addEvent({
        title: "Initializing Thumbmatic",
        message: "Preparing generation pipeline",
      });

      toast.loading("Uploading headshot...", {
        id: "upload",
      });

      addEvent({
        title: "Uploading Headshot",
        message: "Sending image to cloud infrastructure",
      });

      // Upload
      const uploadRes = await uploadHeadshot(selectedFile);

      toast.success("Headshot uploaded", {
        id: "upload",
      });

      addEvent({
        type: "success",
        title: "Upload Complete",
        message: "Headshot uploaded successfully",
      });

      toast.loading("Creating AI Job...", {
        id: "job",
      });

      addEvent({
        title: "Creating AI Job",
        message: "Allocating GPU resources",
      });

      // Create Job
      const jobRes = await createJob({
        prompt,
        numThumbnails: selectedStyle,
        headshotUrl: uploadRes.url,
      });

      toast.success("Generation started", {
        id: "job",
      });

      addEvent({
        type: "success",
        title: "Generation Started",
        message: `Job ID: ${jobRes.job_id}`,
      });

      // Initial fetch
      const initialJob = await getJob(jobRes.job_id);

      setResult(initialJob);

      // Subscribe
      eventSourceRef.current = subscribeToJob(jobRes.job_id, {
        onThumbnailReady: async (data) => {
          toast.success(`${data.style_name} generated`);

          addEvent({
            type: "success",
            title: `${data.style_name} Ready`,
            message: "Thumbnail generated successfully",
            image: data.image_url,
          });

          const updatedJob = await getJob(jobRes.job_id);

          setResult(updatedJob);
        },

        onThumbnailFailed: async (data) => {
          toast.error(`${data.style_name} failed`);

          addEvent({
            type: "error",
            title: `${data.style_name} Failed`,
            message: data.error_message || "Generation failed",
          });

          const updatedJob = await getJob(jobRes.job_id);

          setResult(updatedJob);
        },

        onJobComplete: async () => {
          toast.success("All thumbnails completed");

          addEvent({
            type: "success",
            title: "Generation Completed",
            message: "All thumbnails rendered successfully",
          });

          const finalJob = await getJob(jobRes.job_id);

          setResult(finalJob);
          setLoading(false);
        },

        onError: (err) => {
          console.error(err);

          toast.error("Realtime connection failed");

          addEvent({
            type: "error",
            title: "Connection Failed",
            message: "Realtime streaming disconnected",
          });

          setLoading(false);
        },
      });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Something went wrong");

      addEvent({
        type: "error",
        title: "Generation Error",
        message: "Unexpected error occurred",
      });

      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-hidden relative">
      <Toaster position="top-right" />

      {/* GRID */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "70px 70px",
          }}
        />
      </div>

      {/* BLOBS */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-fuchsia-500/20 rounded-full blur-[140px]" />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[140px]" />

      <div className="relative z-10 min-h-screen p-6">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <Sparkles size={15} className="text-fuchsia-300" />

              <span className="text-sm font-medium">AI Thumbnail Studio</span>
            </div>

            <h1 className="mt-4 text-5xl font-black tracking-tight">
              Thumbmatic
            </h1>

            <p className="text-white/50 mt-2">
              Real-time cinematic thumbnail generation
            </p>
          </div>

          <div className="flex items-center gap-3 self-start">
            <StatCard
              email={userData?.email}
              name={userData?.email.substring(0, 4)}
            />
          </div>
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr_420px] gap-6">
          {/* SIDEBAR */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-6 h-fit">
            <div className="space-y-8">
              {/* UPLOAD */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">
                  Upload Headshot
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer rounded-[28px] border border-dashed border-white/10 bg-black/30 overflow-hidden hover:border-fuchsia-500/40 transition-all"
                >
                  <div className="p-8 flex flex-col items-center text-center">
                    {preview ? (
                      <img
                        src={preview}
                        alt=""
                        className="w-32 h-32 rounded-3xl object-cover border border-white/10 shadow-2xl"
                      />
                    ) : (
                      <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center">
                        <Upload size={40} />
                      </div>
                    )}

                    <h3 className="mt-5 font-bold text-lg">
                      {selectedFile ? selectedFile.name : "Drop Your Image"}
                    </h3>

                    <p className="text-sm text-white/40 mt-2">
                      Only PNG • Max 10MB
                    </p>

                    <button
                      type="button"
                      className="mt-5 px-5 py-3 cursor-pointer rounded-2xl bg-white text-black font-semibold"
                    >
                      Choose File
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".png,image/png"
                  onChange={handleFileChange}
                />
              </div>

              {/* PROMPT */}
              <div>
                <label className="text-sm text-white/60 mb-3 block">
                  Thumbnail Prompt
                </label>

                <div className="relative">
                  <textarea
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Create an ultra viral YouTube thumbnail with dramatic lighting, shocked expression, cinematic shadows..."
                    className="w-full rounded-[28px] border border-white/10 bg-black/30 p-5 pr-14 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40"
                  />

                  <Wand2
                    className="absolute top-5 right-5 text-fuchsia-400"
                    size={20}
                  />
                </div>
              </div>

              {/* STYLES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm text-white/60">
                    Generation Pack
                  </label>

                  <span className="text-xs text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-1 rounded-full">
                    {selectedStyle} Style
                    {selectedStyle > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-4">
                  {styles.map((style) => (
                    <StyleCard
                      key={style.id}
                      icon={style.icon}
                      label={style.label}
                      desc={style.desc}
                      includes={style.includes}
                      active={selectedStyle === style.id}
                      onClick={() => setSelectedStyle(style.id)}
                    />
                  ))}
                </div>
              </div>

              {/* BUTTON */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="group cursor-pointer relative overflow-hidden w-full rounded-[26px] py-5 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-lg font-bold shadow-[0_20px_80px_rgba(168,85,247,0.35)] hover:scale-[1.01] transition-all"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={22} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate Thumbnail
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* STREAM PANEL */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl overflow-hidden flex flex-col min-h-[850px]">
            {/* HEADER */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-left">
                    Live AI Stream
                  </h2>

                  <p className="text-white/50 mt-1 text-left">
                    Real-time thumbnail generation events
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />

                  <span className="text-green-300 text-sm">LIVE</span>
                </div>
              </div>

              {/* PROGRESS */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/50">Progress</span>

                  <span className="text-sm font-semibold">{progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* STREAM */}
            <div
              ref={streamRef}
              className="flex-1 overflow-y-auto p-6 space-y-5"
            >
              {streamEvents.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center">
                    <Sparkles size={36} className="text-fuchsia-400" />
                  </div>

                  <h3 className="mt-6 text-2xl font-bold">
                    Waiting For Generation
                  </h3>

                  <p className="text-white/40 mt-2 max-w-md">
                    Upload a headshot and start generating cinematic AI
                    thumbnails.
                  </p>
                </div>
              )}

              {streamEvents.map((event, idx) => (
                <StreamEvent
                  key={event.id}
                  event={event}
                  isLast={idx === streamEvents.length - 1}
                />
              ))}
            </div>
          </div>

          {/* PREVIEW PANEL */}
          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-2xl p-5 min-h-[850px]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-2xl font-black text-left">
                  Generated Results
                </h2>

                <p className="text-white/50 mt-1 text-left">
                  Cinematic thumbnail gallery
                </p>
              </div>

              {loading && (
                <Loader2 className="animate-spin text-fuchsia-400" size={22} />
              )}
            </div>

            <div className="space-y-5">
              {result?.thumbnails?.map((thumb) => (
                <ThumbnailCard key={thumb.id} thumb={thumb} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* COMPONENTS */

function StreamEvent({ event, isLast }) {
  const Icon =
    event.type === "success"
      ? CheckCircle2
      : event.type === "error"
        ? XCircle
        : Sparkles;

  return (
    <div className="flex gap-4 animate-[fadeIn_.4s_ease]">
      {/* LINE */}
      <div className="flex flex-col items-center">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
            event.type === "success"
              ? "bg-green-500/10 border-green-400/20 text-green-300"
              : event.type === "error"
                ? "bg-red-500/10 border-red-400/20 text-red-300"
                : "bg-fuchsia-500/10 border-fuchsia-400/20 text-fuchsia-300"
          }`}
        >
          <Icon size={18} />
        </div>

        {!isLast && <div className="w-px flex-1 bg-white/10 mt-2" />}
      </div>

      {/* CONTENT */}
      <div className="flex-1 rounded-3xl border border-white/10 bg-black/30 p-5">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h3 className="font-bold text-lg text-left">{event.title}</h3>

            <p className="text-white/50 mt-1 text-left">{event.message}</p>
          </div>

          <span className="text-xs text-white/30 whitespace-nowrap">
            {event.time}
          </span>
        </div>

        {event.image && (
          <img
            src={event.image}
            alt=""
            className="mt-5 rounded-2xl border border-white/10"
          />
        )}
      </div>
    </div>
  );
}

function ThumbnailCard({ thumb }) {
  return (
    <div className="group rounded-[28px] overflow-hidden border border-white/10 bg-black/30 hover:border-fuchsia-500/20 transition-all">
      {/* IMAGE */}
      <div className="relative aspect-video overflow-hidden">
        {thumb.imagekit_url ? (
          <>
            <img
              src={thumb.imagekit_url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : thumb.status === "failed" ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <XCircle className="text-red-400" size={34} />

            <p className="mt-4 font-semibold text-red-300">Generation Failed</p>

            <p className="text-xs text-white/40 mt-2">{thumb.error_message}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-fuchsia-400" size={32} />

            <p className="text-white/50 mt-4">Generating...</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg text-left">{thumb.style_name}</h3>

          <p className="text-sm text-white/40 capitalize mt-1 text-left">
            {thumb.status}
          </p>
        </div>

        {thumb.imagekit_url && (
          <a
            href={thumb.imagekit_url}
            target="_blank"
            rel="noreferrer"
            className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-2xl bg-white text-black font-semibold hover:scale-105 transition"
          >
            <Download size={16} />
            Open
          </a>
        )}
      </div>
    </div>
  );
}

function StyleCard({
  icon,
  label,
  desc,
  includes = [],
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group cursor-pointer relative w-full overflow-hidden rounded-[28px] border text-left transition-all duration-300 ${
        active
          ? "border-fuchsia-500 bg-gradient-to-br from-fuchsia-500/15 to-indigo-500/10 shadow-[0_10px_50px_rgba(217,70,239,0.15)]"
          : "border-white/10 bg-black/30 hover:bg-white/[0.05]"
      }`}
    >
      {/* GLOW */}
      <div
        className={`absolute inset-0 opacity-0 transition-opacity duration-500 ${
          active ? "opacity-100" : "group-hover:opacity-100"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-indigo-500/5" />
      </div>

      <div className="relative p-5">
        {/* TOP */}
        <div className="flex items-start gap-4">
          {/* ICON */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              active
                ? "bg-gradient-to-br from-fuchsia-500 to-indigo-500 shadow-lg shadow-fuchsia-500/20"
                : "bg-white/10"
            }`}
          >
            {icon}
          </div>

          {/* TEXT */}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-lg">{label}</h3>

              {active && (
                <div className="px-3 py-1 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/20 text-xs font-semibold text-fuchsia-200">
                  Selected
                </div>
              )}
            </div>

            <p className="text-sm text-white/45 mt-1">{desc}</p>
          </div>
        </div>

        {/* INCLUDED STYLES */}
        <div className="mt-5 flex flex-wrap gap-2">
          {includes.map((item, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded-xl text-sm border transition-all ${
                active
                  ? "bg-white/10 border-white/10 text-white"
                  : "bg-white/[0.03] border-white/5 text-white/60"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* BOTTOM INFO */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-xs text-white/35">
            {includes.length} thumbnail
            {includes.length > 1 ? "s" : ""} will be generated
          </p>

          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              active ? "border-fuchsia-400 bg-fuchsia-500" : "border-white/20"
            }`}
          >
            {active && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>
      </div>
    </button>
  );
}

function StatCard({ email, name = "User" }) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);

  const displayName = email
    ?.split("@")[0]
    ?.split(".")
    ?.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    ?.join(" ");

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="group relative flex items-center gap-3 rounded-[15px] border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07] hover:border-fuchsia-500/30 hover:shadow-[0_10px_40px_rgba(168,85,247,0.15)] cursor-pointer"
      >
        <div className="absolute inset-0 rounded-[22px] bg-gradient-to-r from-fuchsia-500/0 via-fuchsia-500/5 to-indigo-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-xl font-bold text-white shadow-lg">
          {name.charAt(0).toUpperCase()}
        </div>

        <div className="relative hidden min-w-0 flex-col text-left sm:flex">
          <span className="truncate text-[15px] font-semibold text-white">
            {displayName}
          </span>

          {email && (
            <span className="max-w-[140px] truncate text-[11px] text-white/45 sm:max-w-[180px]">
              {email}
            </span>
          )}
        </div>
      </button>

      {open && (
        <button
          onClick={handleLogout}
          className="group flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2.5 text-sm font-medium text-red-300 backdrop-blur-xl transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/12 hover:shadow-[0_10px_35px_rgba(239,68,68,0.18)] active:scale-[0.98] sm:justify-start cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 transition-all duration-300 group-hover:bg-red-500/20">
            <LogOut size={18} />
          </div>

          <span className="hidden tracking-wide sm:block">Logout</span>
        </button>
      )}
    </div>
  );
}
