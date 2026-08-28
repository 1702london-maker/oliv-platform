"use client";

import { useState } from "react";

type Colour = {
  name: string;
  hex: string;
  imageUrl: string;
};

export function HairColourSwatches({
  colours,
  onColourChange,
}: {
  colours: Colour[];
  onColourChange: (imageUrl: string, colourName: string) => void;
}) {
  const [active, setActive] = useState(0);
  const usesPhotoSwatches = colours.some((c) => c.imageUrl.includes("/extension-swatches/"));

  function select(index: number) {
    setActive(index);
    onColourChange(colours[index].imageUrl, colours[index].name);
  }

  return (
    <div className="ohs-swatches-wrap">
      <div className="ohs-swatches" aria-label="Farbauswahl">
        {colours.map((c, i) => (
          <button
            key={c.name}
            title={c.name}
            aria-label={c.name}
            aria-pressed={i === active}
            onClick={() => select(i)}
            className={`ohs-swatch${usesPhotoSwatches ? " ohs-swatch--photo" : ""}${i === active ? " ohs-swatch--active" : ""}`}
            style={usesPhotoSwatches ? undefined : { background: c.hex }}
          >
            {usesPhotoSwatches ? <img src={c.imageUrl} alt="" loading="lazy" /> : null}
          </button>
        ))}
      </div>
      <span className="ohs-swatch-label">{colours[active]?.name}</span>
    </div>
  );
}
