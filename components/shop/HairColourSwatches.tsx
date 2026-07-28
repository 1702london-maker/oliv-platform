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
            className={`ohs-swatch${i === active ? " ohs-swatch--active" : ""}`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
      <span className="ohs-swatch-label">{colours[active]?.name}</span>
    </div>
  );
}
