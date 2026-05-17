import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

export async function uploadHeadshot(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post("/upload-headshot", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(
      error?.response?.data?.detail || "Failed to upload headshot",
    );
  }
}

export async function createJob({
  prompt,
  numThumbnails,
  headshotUrl,
}) {
  try {
    const { data } = await api.post("/jobs", {
      prompt,
      num_thumbnails: numThumbnails,
      headshot_url: headshotUrl,
    });
    console.log(data);

    return data;
  } catch (error) {
    console.error(error);
    throw new Error(
      error?.response?.data?.detail || "Failed to create job",
    );
  }
}

export async function getJob(jobId) {
  try {
    const { data } = await api.get(`/jobs/${jobId}`);
    return data;
  } catch (error) {
    console.error(error);
    throw new Error(
      error?.response?.data?.detail || "Failed to fetch job",
    );
  }
}

export function subscribeToJob(
  jobId,
  {
    onThumbnailReady,
    onThumbnailFailed,
    onJobComplete,
    onError,
  },
) {
  const eventSource = new EventSource(
    `${API_BASE}/api/jobs/${jobId}/stream`,
  );

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

  eventSource.onerror = ((event) => {
    onError?.(event);
    eventSource.close();
  });

  return eventSource;
}