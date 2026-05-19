import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export async function userProfileService(email, password) {
  const { data } = await api.get("/auth/user_profile");
  console.log(data);
  return data;
}

export async function uploadHeadshot(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/upload-headshot", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function createJob({ prompt, numThumbnails, headshotUrl }) {
  const { data } = await api.post("/jobs", {
    prompt,
    num_thumbnails: numThumbnails,
    headshot_url: headshotUrl,
  });

  return data;
}

export async function getJob(jobId) {
  const { data } = await api.get(`/jobs/${jobId}`);
  return data;
}

export function subscribeToJob(
  jobId,
  { onThumbnailReady, onThumbnailFailed, onJobComplete, onError },
) {
  const eventSource = new EventSource(`${API_BASE}/api/jobs/${jobId}/stream`);

  eventSource.addEventListener("thumbnail_ready", (event) => {
    const data = JSON.parse(event.data);
    onThumbnailReady?.(data);
  });

  eventSource.addEventListener("thumbnail_failed", (event) => {
    const data = JSON.parse(event.data);
    onThumbnailFailed?.(data);
  });

  eventSource.addEventListener("job_completed", (event) => {
    const data = JSON.parse(event.data);
    onJobComplete?.(data);
    eventSource.close();
  });

  eventSource.onerror = (event) => {
    onError?.(event);
    eventSource.close();
  };

  return eventSource;
}
 