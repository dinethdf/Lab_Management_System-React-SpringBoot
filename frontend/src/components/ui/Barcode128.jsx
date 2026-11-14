import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * Barcode128 — Beginner-friendly linear 1D barcode component (Code 128 standard).
 * Renders crisp, scalable vector SVG barcodes readable by all physical laser & camera scanners.
 *
 * @param {string} value - The text / code to encode (e.g. "PS-2026-00001", "LS-2026-00001")
 * @param {number} height - Height of the vertical barcode lines in pixels (default: 45)
 * @param {number} width - Width scaling for individual bars (default: 1.5)
 * @param {boolean} displayValue - Whether to print the alphanumeric code under the bars (default: true)
 * @param {number} fontSize - Text font size in pixels (default: 12)
 * @param {number} margin - Padding around the barcode in pixels (default: 4)
 * @param {string} className - Optional CSS classes for styling wrapper
 */
const Barcode128 = ({
  value,
  height = 45,
  width = 1.5,
  displayValue = true,
  fontSize = 12,
  margin = 4,
  className = '',
}) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, String(value), {
        format: 'CODE128',
        lineColor: '#111827', // Tailwind gray-900 for dark, high-contrast lines
        width: Number(width),
        height: Number(height),
        displayValue: Boolean(displayValue),
        fontSize: Number(fontSize),
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 3,
        margin: Number(margin),
        background: '#ffffff',
      });
    } catch (err) {
      console.warn('Failed to render Barcode128 for value:', value, err);
    }
  }, [value, height, width, displayValue, fontSize, margin]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white ${className}`}>
      <svg ref={svgRef} className="max-w-full block" />
    </div>
  );
};

export default Barcode128;
export { Barcode128 };
