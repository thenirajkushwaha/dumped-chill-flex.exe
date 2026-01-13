"use client";

import { useEffect, useState } from "react";
import type { Service } from "../../../lib/types/service";
import { supabase } from "../../../lib/supabase/client";

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("services")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setServices(data as Service[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Services</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <article
            key={s.id}
            className="border rounded-lg overflow-hidden bg-white shadow hover:shadow-lg transition"
          >
            {s.mediaUrl && s.mediaType === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.mediaUrl}
                alt={s.title}
                className="w-full h-40 object-cover"
              />
            )}

            {s.mediaUrl && s.mediaType === "video" && (
              <video
                className="w-full h-40 object-cover"
                src={s.mediaUrl}
                controls
              />
            )}

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{s.title}</h2>
                  <p className="text-sm text-gray-500">{s.slug}</p>
                </div>

                {s.badge && (
                  <span className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                    {s.badge}
                  </span>
                )}
              </div>

              <p className="mt-3 text-gray-600 line-clamp-3">
                {s.description}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <strong>Duration:</strong>{" "}
                  {s.durationMinutes?.length
                    ? `${s.durationMinutes.join(" / ")} min`
                    : "—"}
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold">₹{s.price}</div>
                  {s.originalPrice && (
                    <div className="text-sm line-through text-gray-400">
                      ₹{s.originalPrice}
                    </div>
                  )}
                </div>
              </div>

              {s.benefits?.length > 0 && (
                <ul className="mt-3 list-disc list-inside text-sm text-gray-700">
                  {s.benefits.slice(0, 4).map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center text-gray-500 mt-6">
          No services found.
        </div>
      )}
    </div>
  );
}
