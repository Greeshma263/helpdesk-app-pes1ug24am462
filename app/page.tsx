"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type HelpRequest = {
  id: number;
  student_name: string;
  message: string;
  created_at: string;
};

type RequestsResponse = {
  requests?: HelpRequest[];
  source?: "Redis" | "PostgreSQL";
  error?: string;
};

export default function Home() {
  const [studentName, setStudentName] = useState("");
  const [message, setMessage] = useState("");
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [source, setSource] = useState<"Redis" | "PostgreSQL" | null>(null);
  const [views, setViews] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const [requestsResult, viewsResult] = await Promise.allSettled([
      fetch("/api/requests", { cache: "no-store" }),
      fetch("/api/views", { cache: "no-store" }),
    ]);

    if (requestsResult.status === "fulfilled" && requestsResult.value.ok) {
      const data = (await requestsResult.value.json()) as RequestsResponse;
      setRequests(data.requests ?? []);
      setSource(data.source ?? null);
    } else {
      setError("Unable to load help requests. Please try again.");
    }

    if (viewsResult.status === "fulfilled" && viewsResult.value.ok) {
      const data = (await viewsResult.value.json()) as { views?: number };
      setViews(data.views ?? null);
    } else {
      setError((currentError) =>
        currentError
          ? `${currentError} The view counter is currently unavailable.`
          : "The view counter is currently unavailable.",
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBoard();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadBoard]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = studentName.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedMessage) {
      setError("Please enter your name and a help request.");
      return;
    }

    setIsPosting(true);
    setError("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          student_name: trimmedName,
          message: trimmedMessage,
        }),
      });
      const data = (await response.json()) as RequestsResponse;

      if (!response.ok) {
        setError(data.error ?? "Unable to post your request.");
        return;
      }

      setStudentName("");
      setMessage("");
      await loadBoard();
    } catch (requestError) {
      console.error("Failed to post help request:", requestError);
      setError("Unable to post your request. Please try again.");
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-700">
            Student support
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Campus Help Desk Board
          </h1>
          <p className="mt-3 text-slate-600">
            Share a help request with the campus community and see the latest
            requests below.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold">Post a help request</h2>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="student-name">
                Student name
              </label>
              <input
                id="student-name"
                maxLength={50}
                onChange={(event) => setStudentName(event.target.value)}
                placeholder="Enter your name"
                required
                value={studentName}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="message">
                Help request
              </label>
              <textarea
                id="message"
                maxLength={200}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="What do you need help with?"
                required
                rows={4}
                value={message}
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPosting}
              type="submit"
            >
              {isPosting ? "Posting..." : "Post Request"}
            </button>
          </form>
        </section>

        {error && (
          <p
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Latest 10 requests</h2>
            <div className="flex gap-3 text-sm text-slate-600">
              <span>
                Source: <strong>{source ?? "Loading..."}</strong>
              </span>
              <span>
                Board views: <strong>{views ?? "Loading..."}</strong>
              </span>
            </div>
          </div>

          {isLoading ? (
            <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
              Loading requests...
            </p>
          ) : requests.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">
              No help requests have been posted yet.
            </p>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <article
                  className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
                  key={request.id}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{request.student_name}</h3>
                    <time
                      className="text-sm text-slate-500"
                      dateTime={request.created_at}
                    >
                      {new Date(request.created_at).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {request.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
