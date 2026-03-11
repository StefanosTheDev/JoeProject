import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface Session {
  id: string;
  campaign_id: string;
  scheduled_at: string;
  is_active: boolean;
  mux_playback_id: string | null;
  chat_enabled: boolean;
  created_at: string;
}

interface PlaybackUrl {
  playback_id: string;
  hls_url: string;
}

export default function WebinarRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const simulateNow = searchParams.get("simulate") === "1" || searchParams.get("simulate") === "true";
  const [session, setSession] = useState<Session | null>(null);
  const [playback, setPlayback] = useState<PlaybackUrl | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(`/api/webinars/sessions/${sessionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setSession(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !session?.mux_playback_id) return;
    let cancelled = false;
    fetch(`/api/webinars/sessions/${sessionId}/playback-url`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setPlayback(data);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, session?.mux_playback_id]);

  useEffect(() => {
    if (!session?.scheduled_at || simulateNow) return;
    const scheduled = new Date(session.scheduled_at).getTime();
    const tick = () => {
      const now = Date.now();
      if (now >= scheduled) {
        setCanPlay(true);
        setCountdown(null);
        return;
      }
      const d = Math.floor((scheduled - now) / 1000);
      const h = Math.floor(d / 3600);
      const m = Math.floor((d % 3600) / 60);
      const s = d % 60;
      setCountdown(`${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session?.scheduled_at]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Funnel · Webinar</p>
          <h1 className="font-semibold text-lg">Webinar</h1>
          <p className="text-sm text-muted-foreground">
            {session.scheduled_at
              ? new Date(session.scheduled_at).toLocaleString()
              : "—"}
          </p>
        </div>
        <div className="flex-1 flex p-4 gap-4">
          <div className="flex-1 min-w-0 flex flex-col">
            {countdown && !canPlay && !simulateNow ? (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground mb-2">Starting in</p>
                  <p className="text-4xl font-mono font-semibold">{countdown}</p>
                </CardContent>
              </Card>
            ) : (canPlay || simulateNow) && playback?.hls_url ? (
              <Card className="flex-1 overflow-hidden">
                <div className="aspect-video w-full bg-black">
                  <video
                    className="w-full h-full"
                    controls
                    playsInline
                    src={playback.hls_url}
                  >
                    Your browser does not support the video tag. Try Safari or install HLS support.
                  </video>
                </div>
              </Card>
            ) : canPlay || simulateNow ? (
              <Card className="flex-1 flex items-center justify-center">
                <CardContent className="text-muted-foreground">
                  No video configured for this session. Add a Mux playback ID to the session.
                </CardContent>
              </Card>
            ) : null}
          </div>
          {session.chat_enabled && (
            <aside className="w-80 border rounded-lg flex flex-col bg-muted/30">
              <div className="p-2 border-b font-medium text-sm">Chat</div>
              <div className="flex-1 p-2 text-sm text-muted-foreground">
                Chat (Supabase Realtime or REST) can be wired here.
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
