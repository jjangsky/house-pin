"use client";

import { useMemo } from "react";
import { findSimilarProperties } from "@/lib/utils/property";
import PropertyCard from "@/components/properties/PropertyCard";
import type { Property } from "@/types";

interface SimilarPropertiesProps {
  target: Property;
  allProperties: Property[];
  affordablePrice: number;
}

export default function SimilarProperties({
  target,
  allProperties,
  affordablePrice,
}: SimilarPropertiesProps) {
  const similarProperties = useMemo(
    () => findSimilarProperties(target, allProperties, 5),
    [target, allProperties],
  );

  if (similarProperties.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-lg font-semibold text-primary">비슷한 매물</h3>
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
        {similarProperties.map((property, i) => (
          <div
            key={`${property.name}-${property.floor}-${i}`}
            className="min-w-[280px] shrink-0 snap-start"
          >
            <PropertyCard
              property={property}
              affordablePrice={affordablePrice}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
