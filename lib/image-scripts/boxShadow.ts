import BezierEasing from "bezier-easing";

interface BoxShadowOptions {
  angle?: number;
  length?: number;
  finalBlur?: number;
  spread?: number;
  finalTransparency?: number;
}

interface ShadowLayer {
  xOffset: number;
  yOffset: number;
  blur: number;
  spread: number;
  alpha: number;
}

/**
 * Returns a string of box shadows separated based on user input
 */
export function getBoxShadows(
  numShadowLayers: number,
  options: BoxShadowOptions = {}
): string {
  const {
    angle = 40,
    length = 130,
    finalBlur = 800,
    spread = 0,
    finalTransparency = 0.15,
  } = options;

  const angleToRadians = (angle: number): number => angle * (Math.PI / 180);

  const rgba = (r: number, g: number, b: number, a: number): string =>
    `rgba(${r}, ${g}, ${b}, ${a})`;

  const shadow = (
    left: number,
    top: number,
    blur: number,
    spread: number,
    color: string
  ): string => `${left}px ${top}px ${blur}px ${spread}px ${color}`;

  // Bezier curve control points for different aspects of the shadow
  const alphaEasingValue = [0.1, 0.5, 0.9, 0.5];
  const offsetEasingValue = [0.7, 0.1, 0.9, 0.3];
  const blurEasingValue = [0.7, 0.1, 0.9, 0.3];

  const alphaEasing = BezierEasing(
    alphaEasingValue[0],
    alphaEasingValue[1],
    alphaEasingValue[2],
    alphaEasingValue[3]
  );
  const offsetEasing = BezierEasing(
    offsetEasingValue[0],
    offsetEasingValue[1],
    offsetEasingValue[2],
    offsetEasingValue[3]
  );
  const blurEasing = BezierEasing(
    blurEasingValue[0],
    blurEasingValue[1],
    blurEasingValue[2],
    blurEasingValue[3]
  );

  const shadowLayers: ShadowLayer[] = Array.from(
    { length: numShadowLayers },
    (_, i) => {
      const fraction = (i + 1) / numShadowLayers;

      // Calculate eased values
      const easedAlpha = alphaEasing(fraction);
      const easedOffset = offsetEasing(fraction);
      const easedBlur = blurEasing(fraction);

      // Calculate offsets based on angle
      const yOffset = easedOffset * Math.cos(angleToRadians(angle)) * length;
      const xOffset = easedOffset * Math.sin(angleToRadians(angle)) * length;

      return {
        xOffset,
        yOffset,
        blur: easedBlur * finalBlur,
        spread,
        alpha: easedAlpha * finalTransparency,
      };
    }
  );

  return shadowLayers
    .map(({ xOffset, yOffset, blur, spread, alpha }) =>
      shadow(xOffset, yOffset, blur, spread, rgba(0, 0, 0, alpha))
    )
    .join(",\n");
}

/**
 * A function with predefined options for artwork dropshadow
 */
export function generateArtShadows(
  layers: number,
  shadowIntensity: number = 0.4
): string {
  // Ensure shadowIntensity is between 0 and 1
  shadowIntensity = Math.max(0, Math.min(1, shadowIntensity));

  // Calculate the intensity factor
  const intensityFactor = shadowIntensity * 2;

  const opts = {
    longShadow: {
      angle: 40,
      length: 125 * intensityFactor,
      finalBlur: 65 * (2 - intensityFactor),
      finalTransparency: 0.1 * intensityFactor,
    },
    shortShadow: {
      angle: 35,
      length: 90 * intensityFactor,
      finalBlur: 20 * (2 - intensityFactor),
      finalTransparency: 0.09 * intensityFactor,
    },
    upperShadow: {
      angle: -62,
      length: -80 * intensityFactor,
      finalBlur: 55 * (2 - intensityFactor),
      finalTransparency: 0.08 * intensityFactor,
    },
  };

  // Combine all shadow layers
  return [
    getBoxShadows(layers, opts.longShadow),
    getBoxShadows(layers, opts.shortShadow),
    getBoxShadows(layers, opts.upperShadow),
  ].join(",\n");
}
