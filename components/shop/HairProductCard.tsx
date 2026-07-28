"use client";

import { useState } from "react";
import { HairColourSwatches } from "./HairColourSwatches";

type Colour = {
  name: string;
  hex: string;
  imageUrl: string;
};

type Props = {
  title: string;
  href: string;
  mainImage: string;
  price: string;
  colours: Colour[];
};

export function HairProductCard({ title, href, mainImage, price, colours }: Props) {
  const [image, setImage] = useState(mainImage);
  const [colourName, setColourName] = useState(colours[0]?.name ?? "");

  function handleColourChange(imageUrl: string, name: string) {
    setImage(imageUrl);
    setColourName(name);
  }

  return (
    <article className="ohs-product-card">
      <a className="ohs-product-media" href={href}>
        <img src={image} alt={`${title} – ${colourName}`} loading="lazy" />
      </a>
      <div className="ohs-product-copy">
        <h2>{title}</h2>
        {colours.length > 0 && (
          <HairColourSwatches colours={colours} onColourChange={handleColourChange} />
        )}
        <p>{colourName ? colourName : price}</p>
        <p className="ohs-product-price">{price}</p>
        <a href={href} className="ohs-product-btn">
          View Product
        </a>
      </div>
    </article>
  );
}
