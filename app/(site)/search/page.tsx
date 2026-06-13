"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type SearchResult = {
  title: string;
  slug: string;
  description: string | null;
  url: string;
  price: string | null;
  image: string | null;
  category: string | null;
};

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(q)}&limit=12`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ) runSearch(initialQ);
    inputRef.current?.focus();
  }, [initialQ, runSearch]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (v.trim().length >= 2) runSearch(v.trim());
      else if (!v.trim()) { setResults([]); setSearched(false); }
    }, 320);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) runSearch(query.trim());
  }

  return (
    <div id="ohs-search-page">
      <style>{`
        #ohs-search-page {
          background: #F5F0E8;
          font-family: 'Montserrat', sans-serif;
          min-height: 70vh;
        }
        .ohs-search-hero {
          background: #2B2620;
          padding: 56px 24px 52px;
        }
        .ohs-search-hero-inner {
          max-width: 720px;
          margin: 0 auto;
        }
        .ohs-search-eyebrow {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #B68A45;
          margin: 0 0 14px;
        }
        .ohs-search-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 52px;
          font-weight: 300;
          color: #fff;
          margin: 0 0 32px;
          line-height: 1.05;
        }
        .ohs-search-form {
          display: flex;
          gap: 0;
          max-width: 600px;
        }
        .ohs-search-input {
          flex: 1;
          border: 1px solid #4a3f38;
          border-right: none;
          background: #3a2e28;
          color: #fff;
          padding: 15px 20px;
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          min-width: 0;
        }
        .ohs-search-input::placeholder { color: #8B7355; }
        .ohs-search-input:focus { border-color: #B68A45; }
        .ohs-search-btn {
          background: #B68A45;
          border: 1px solid #B68A45;
          color: #fff;
          padding: 15px 28px;
          font-family: 'Montserrat', sans-serif;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .ohs-search-btn:hover { background: #9a7539; }

        .ohs-search-body {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 24px 80px;
        }
        .ohs-search-status {
          font-size: 12px;
          color: #6B5C4E;
          margin: 0 0 32px;
        }
        .ohs-search-status strong { color: #2B2620; font-weight: 600; }

        .ohs-search-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .ohs-search-card {
          background: #fff;
          border: 1px solid #E2D5C0;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          transition: box-shadow 0.2s;
        }
        .ohs-search-card:hover { box-shadow: 0 4px 20px rgba(43,38,32,0.10); }

        .ohs-search-card-img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          display: block;
          background: #F5F0E8;
        }
        .ohs-search-card-img-placeholder {
          width: 100%;
          aspect-ratio: 1;
          background: #F0EAE0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ohs-search-card-img-placeholder span {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 300;
          color: #C4B5A0;
        }
        .ohs-search-card-body {
          padding: 16px 18px 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ohs-search-card-cat {
          font-size: 7.5px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #B68A45;
          margin: 0 0 6px;
        }
        .ohs-search-card-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 300;
          color: #2B2620;
          margin: 0 0 6px;
          line-height: 1.25;
        }
        .ohs-search-card-desc {
          font-size: 11px;
          color: #6B5C4E;
          margin: 0 0 14px;
          line-height: 1.6;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ohs-search-card-price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 18px;
          color: #2B2620;
          font-weight: 400;
          margin: 0;
        }

        .ohs-search-empty {
          text-align: center;
          padding: 64px 20px;
        }
        .ohs-search-empty-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 300;
          font-style: italic;
          color: #2B2620;
          margin: 0 0 12px;
        }
        .ohs-search-empty-sub {
          font-size: 12px;
          color: #6B5C4E;
          margin: 0 0 32px;
        }
        .ohs-search-empty-link {
          display: inline-block;
          background: #2B2620;
          color: #fff;
          padding: 13px 28px;
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .ohs-search-empty-link:hover { background: #3d3530; }

        .ohs-search-prompt {
          text-align: center;
          padding: 64px 20px;
        }
        .ohs-search-prompt-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 300;
          color: #2B2620;
          margin: 0 0 10px;
        }
        .ohs-search-prompt-sub {
          font-size: 12px;
          color: #9B8878;
          margin: 0;
        }

        .ohs-search-spinner {
          text-align: center;
          padding: 64px 20px;
          font-size: 12px;
          color: #9B8878;
        }

        @media (max-width: 900px) {
          .ohs-search-grid { grid-template-columns: repeat(2, 1fr); }
          .ohs-search-heading { font-size: 38px; }
        }
        @media (max-width: 500px) {
          .ohs-search-grid { grid-template-columns: 1fr; }
          .ohs-search-form { flex-direction: column; }
          .ohs-search-input { border-right: 1px solid #4a3f38; border-bottom: none; }
        }
      `}</style>

      <div className="ohs-search-hero">
        <div className="ohs-search-hero-inner">
          <p className="ohs-search-eyebrow">OlivHairSupply</p>
          <h1 className="ohs-search-heading">Search</h1>
          <form className="ohs-search-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="ohs-search-input"
              type="search"
              placeholder="Search products, extensions, accessories…"
              value={query}
              onChange={handleInput}
              autoComplete="off"
            />
            <button className="ohs-search-btn" type="submit">Search</button>
          </form>
        </div>
      </div>

      <div className="ohs-search-body">
        {loading ? (
          <div className="ohs-search-spinner">Searching…</div>
        ) : searched && results.length === 0 ? (
          <div className="ohs-search-empty">
            <p className="ohs-search-empty-title">No results found</p>
            <p className="ohs-search-empty-sub">
              We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try a different term or browse the full collection.
            </p>
            <a href="/shop" className="ohs-search-empty-link">Browse All Products</a>
          </div>
        ) : searched && results.length > 0 ? (
          <>
            <p className="ohs-search-status">
              <strong>{results.length}</strong> result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>
            <div className="ohs-search-grid">
              {results.map((r) => (
                <a key={r.slug} href={r.url} className="ohs-search-card">
                  {r.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.image} alt={r.title} className="ohs-search-card-img" />
                  ) : (
                    <div className="ohs-search-card-img-placeholder">
                      <span>{r.title.charAt(0)}</span>
                    </div>
                  )}
                  <div className="ohs-search-card-body">
                    {r.category && <p className="ohs-search-card-cat">{r.category.replace(/-/g, " ")}</p>}
                    <p className="ohs-search-card-name">{r.title}</p>
                    {r.description && <p className="ohs-search-card-desc">{r.description}</p>}
                    {r.price && <p className="ohs-search-card-price">{r.price}</p>}
                  </div>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="ohs-search-prompt">
            <p className="ohs-search-prompt-title">What are you looking for?</p>
            <p className="ohs-search-prompt-sub">Try &ldquo;BiziLuxe&rdquo;, &ldquo;body wave&rdquo;, or &ldquo;clip-in&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
