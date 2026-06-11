"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import styles from "./HairMatchPro.module.css";
import type { HairMatchAnalysis, HairMatchPhoto, HairMatchProduct, HairMatchRecommendation, HairMatchAngle } from "@/lib/hairmatch/types";

const ThreeHeadViewer = dynamic(() => import("./ThreeHeadViewer").then((mod) => mod.ThreeHeadViewer), { ssr: false });

const ANGLES: Array<{ key: HairMatchAngle; label: string; help: string }> = [
  { key: "front", label: "Front", help: "Face forward" },
  { key: "left", label: "Left", help: "Left profile" },
  { key: "right", label: "Right", help: "Right profile" },
  { key: "hair", label: "Hair", help: "Current hair" },
  { key: "back", label: "Back", help: "Back view" },
];

type ApiState = "idle" | "loading" | "done" | "error";

export function HairMatchProClient() {
  const [photos, setPhotos] = useState<Partial<Record<HairMatchAngle, string>>>({});
  const [cameraAngle, setCameraAngle] = useState<HairMatchAngle | null>(null);
  const [analysis, setAnalysis] = useState<HairMatchAnalysis | null>(null);
  const [products, setProducts] = useState<HairMatchProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [status, setStatus] = useState<ApiState>("idle");
  const [tryOnStatus, setTryOnStatus] = useState<ApiState>("idle");
  const [saveStatus, setSaveStatus] = useState<ApiState>("idle");
  const [message, setMessage] = useState("");
  const [bookingDone, setBookingDone] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const photoList = useMemo<HairMatchPhoto[]>(() => {
    return ANGLES.flatMap((angle) => photos[angle.key] ? [{ angle: angle.key, dataUrl: photos[angle.key] as string }] : []);
  }, [photos]);

  const selectedRecommendation = useMemo(() => {
    return analysis?.recommendations.find((rec) => rec.id === selectedId) || analysis?.recommendations[0] || null;
  }, [analysis, selectedId]);

  async function openCamera(angle: HairMatchAngle) {
    setCameraAngle(angle);
    setMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 0);
    } catch {
      setMessage("Camera access was blocked. Please use photo upload for this angle.");
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraAngle(null);
  }

  function capturePhoto() {
    if (!videoRef.current || !cameraAngle) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 900;
    canvas.height = videoRef.current.videoHeight || 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setPhotos((current) => ({ ...current, [cameraAngle]: canvas.toDataURL("image/jpeg", 0.86) }));
    closeCamera();
  }

  async function handleUpload(angle: HairMatchAngle, file?: File) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setPhotos((current) => ({ ...current, [angle]: dataUrl }));
  }

  async function handleBulk(files: FileList | null) {
    if (!files) return;
    const next: Partial<Record<HairMatchAngle, string>> = {};
    for (const [index, file] of Array.from(files).slice(0, 5).entries()) {
      next[ANGLES[index].key] = await fileToDataUrl(file);
    }
    setPhotos((current) => ({ ...current, ...next }));
  }

  async function analyze() {
    setStatus("loading");
    setMessage("");
    setAnalysis(null);
    setProducts([]);
    try {
      const res = await fetch("/api/hairmatch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: photoList }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Analysis failed");
      setAnalysis(data.analysis);
      setProducts(data.products || []);
      setSelectedId(data.analysis.recommendations?.[0]?.id || null);
      setStatus("done");
      document.getElementById("hairmatch-results")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "HairMatch analysis failed.");
    }
  }

  async function generateTryOn() {
    if (!selectedRecommendation || !photoList[0]) return;
    setTryOnStatus("loading");
    setTryOnImage(null);
    setMessage("");
    try {
      const res = await fetch("/api/hairmatch/tryon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: photoList[0].dataUrl, recommendation: selectedRecommendation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Try-on failed");
      setTryOnImage(data.image);
      setTryOnStatus("done");
    } catch (error) {
      setTryOnStatus("error");
      setMessage(error instanceof Error ? error.message : "AI try-on failed.");
    }
  }

  async function saveResult(formData: FormData) {
    if (!analysis) return;
    setSaveStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/hairmatch/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis,
          products,
          tryOnImages: tryOnImage ? [tryOnImage] : [],
          name: formData.get("name"),
          email: formData.get("email"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save result");
      setSaveStatus("done");
      setMessage(`Saved. Result reference: ${data.id}`);
    } catch (error) {
      setSaveStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not save HairMatch result.");
    }
  }

  async function bookConsultation(formData: FormData) {
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const startsAt = new Date(`${date}T${time || "10:00"}:00+02:00`);
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const phone = String(formData.get("phone") || "");
    const locationName = String(formData.get("location") || "Store A");

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        serviceName: "OHS AI HairMatch Consultation",
        stylistName: "HairMatch Stylist",
        locationName,
        locationAddress: locationName,
        dateLabel: date,
        timeLabel: time,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        estimatedPrice: "Consultation",
        source: "hairmatch",
        notes: `HairMatch recommendation: ${selectedRecommendation?.name || "Not selected"}`,
        noShowFeeAgreed: true,
      }),
    });
    const data = await res.json();
    if (res.ok) setBookingDone(data.bookingId);
    else setMessage(`Booking failed: ${data.error || "Please choose another slot."}`);
  }

  const progress = Math.round((photoList.length / ANGLES.length) * 100);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>OHS AI · HairMatch Pro</span>
          <h1>AI <em>HairMatch</em> Pro</h1>
          <p className={styles.lead}>Find your most flattering luxury hair before you buy.</p>
          <p className={styles.copy}>Upload or capture your photos, receive a real AI analysis, preview your recommended look, match directly to OlivHairSupply products, save your result and book a consultation.</p>
          <div className={styles.actions}>
            <a className={styles.btn} href="#capture">Start Analysis</a>
            <a className={styles.btnOutline} href="/pages/services">Back To Services</a>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.grid3}>
          <Info title="Capture" text="Use live camera capture or upload the five angles needed for a strong hair profile." />
          <Info title="Analyze" text="AI reviews face shape, skin tone, undertone, hairline, proportions and current hair." />
          <Info title="Try On" text="Generate a realistic image, view a 3D head guide, save the result and book with OHS." />
        </div>
      </section>

      <section className={styles.section} id="capture">
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>Step 1 · Photo Studio</span>
          <h2 className={styles.title}>Capture Your <em>Hair Profile</em></h2>
          <p className={styles.sectionDesc}>For best results, use natural light and a clean background. One front photo is enough to start, but five angles make the recommendations more accurate.</p>
        </div>
        <div className={styles.captureGrid}>
          {ANGLES.map((angle) => (
            <div className={styles.slot} key={angle.key} onClick={() => openCamera(angle.key)}>
              {photos[angle.key] ? <img src={photos[angle.key]} alt={`${angle.label} capture`} /> : (
                <div className={styles.slotText}><strong>{angle.label}</strong><span>{angle.help}</span></div>
              )}
              <input className={styles.hiddenInput} type="file" accept="image/*" onChange={(event) => handleUpload(angle.key, event.target.files?.[0])} />
            </div>
          ))}
        </div>
        <div className={styles.progress}><span style={{ width: `${progress}%` }} /></div>
        <div className={styles.actions}>
          <label className={styles.btnOutline}>Upload Photos<input className={styles.hiddenInput} type="file" accept="image/*" multiple onChange={(event) => handleBulk(event.target.files)} /></label>
          <button className={styles.btn} onClick={analyze} disabled={!photoList.length || status === "loading"}>{status === "loading" ? "Analysing..." : "Analyse My Photos"}</button>
        </div>
        {message && <div className={`${styles.notice} ${status === "error" || tryOnStatus === "error" || saveStatus === "error" ? styles.error : ""}`}>{message}</div>}
      </section>

      {analysis && (
        <>
          <section className={styles.resultBand} id="hairmatch-results">
            <div className={styles.resultInner}>
              <div>
                <span className={styles.eyebrow}>AI Analysis Complete</span>
                <h2 className={styles.title}>{analysis.faceShape} · <em>{analysis.undertone}</em></h2>
                <p className={styles.copy}>{analysis.summary}</p>
              </div>
              <div>
                <div className={styles.score}>{analysis.confidence}%</div>
                <p className={styles.copy}>HairMatch confidence based on facial structure, tone, hairline and proportions.</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.metrics}>
              {analysis.metrics.map((metric) => (
                <div className={styles.metric} key={metric.label}>
                  <div className={styles.metricTop}><span>{metric.label}</span><span>{metric.value}</span></div>
                  <div className={styles.bar}><span style={{ width: `${metric.score}%` }} /></div>
                  <p className={styles.sectionDesc}>{metric.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Recommendations</span>
              <h2 className={styles.title}>Luxury Styles <em>Matched To You</em></h2>
            </div>
            <div className={styles.recommendations}>
              {analysis.recommendations.map((rec) => (
                <button className={`${styles.rec} ${selectedRecommendation?.id === rec.id ? styles.recActive : ""}`} key={rec.id} onClick={() => setSelectedId(rec.id)}>
                  <span className={styles.pill}>{rec.matchScore}% Match</span>
                  <h3>{rec.name}</h3>
                  <p>{rec.category} · {rec.texture} · {rec.length}</p>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.studio}>
              <div className={styles.beforeAfter}>
                <div className={styles.compare}>
                  {photoList[0] ? <img src={photoList[0].dataUrl} alt="Before HairMatch" /> : <div className={styles.placeholder}>Before</div>}
                  {tryOnImage ? <img src={tryOnImage} alt="AI generated try-on result" /> : <div className={styles.placeholder}>Generate your AI try-on image</div>}
                </div>
              </div>
              <div>
                <span className={styles.eyebrow}>AI Try-On</span>
                <h2 className={styles.title}>Preview The <em>Result</em></h2>
                <p className={styles.sectionDesc}>{selectedRecommendation?.reason}</p>
                <div className={styles.actions}>
                  <button className={styles.btn} onClick={generateTryOn} disabled={tryOnStatus === "loading"}>{tryOnStatus === "loading" ? "Generating..." : "Generate Try-On"}</button>
                </div>
              </div>
            </div>
            <div className={styles.sectionHead} style={{ marginTop: 56 }}>
              <span className={styles.eyebrow}>3D Head Visualisation</span>
            </div>
            <div className={styles.viewer}>
              <ThreeHeadViewer colour={selectedRecommendation?.colour} texture={selectedRecommendation?.texture} />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Product Match</span>
              <h2 className={styles.title}>Shop Your <em>Recommended Edit</em></h2>
            </div>
            <div className={styles.products}>
              {products.map((product) => (
                <article className={styles.product} key={product.slug}>
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.title} /> : <div className={styles.productImage}>OHS</div>}
                  <div className={styles.productBody}>
                    <span className={styles.pill}>Matched Product</span>
                    <h3>{product.title}</h3>
                    <p className={styles.sectionDesc}>{product.reason}</p>
                    <p className={styles.price}>€{(product.priceCents / 100).toFixed(2)}</p>
                    <div className={styles.actions}>
                      <a className={styles.btnDark} href={`/products/${product.slug}`}>View Product</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>Save & Book</span>
              <h2 className={styles.title}>Keep Your Result <em>And Book</em></h2>
            </div>
            <div className={styles.two}>
              <form className={styles.form} action={saveResult}>
                <div className={styles.field}><label>Name</label><input name="name" required /></div>
                <div className={styles.field}><label>Email</label><input name="email" type="email" required /></div>
                <button className={styles.btn} disabled={saveStatus === "loading"}>{saveStatus === "loading" ? "Saving..." : "Save HairMatch Result"}</button>
              </form>
              <form className={styles.form} action={bookConsultation}>
                <div className={styles.two}>
                  <div className={styles.field}><label>Name</label><input name="name" required /></div>
                  <div className={styles.field}><label>Email</label><input name="email" type="email" required /></div>
                </div>
                <div className={styles.two}>
                  <div className={styles.field}><label>Phone</label><input name="phone" /></div>
                  <div className={styles.field}><label>Location</label><select name="location"><option>Store A</option><option>Store B</option></select></div>
                </div>
                <div className={styles.two}>
                  <div className={styles.field}><label>Date</label><input name="date" type="date" required /></div>
                  <div className={styles.field}><label>Time</label><input name="time" type="time" required /></div>
                </div>
                <button className={styles.btnDark}>Book HairMatch Consultation</button>
                {bookingDone && <p className={styles.sectionDesc}>Confirmed. Booking reference: {bookingDone}</p>}
              </form>
            </div>
          </section>
        </>
      )}

      {cameraAngle && (
        <div className={styles.cameraModal}>
          <button className={styles.close} onClick={closeCamera}>x</button>
          <div className={styles.cameraBox}>
            <span className={styles.eyebrow}>{ANGLES.find((item) => item.key === cameraAngle)?.label} photo</span>
            <video ref={videoRef} className={styles.video} autoPlay playsInline />
            <div className={styles.actions} style={{ marginTop: 18 }}>
              <button className={styles.btn} onClick={capturePhoto}>Capture Photo</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return <article className={styles.card}><h3>{title}</h3><p>{text}</p></article>;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
