import { HelpPage, paragraphs } from "../help-page";

export default function SizeGuidePage() {
  return <HelpPage eyebrow="P&R / FIT & SIZING" title="Size Guide" sections={[
    { title: "Oversized fit", body: paragraphs("This chart applies to our full-length oversized T-shirts. Compare the garment measurements with a tee you already own; the oversized cut already includes extra room. Select from the sizes available on the product page.") },
    { title: "Baby tees and crop tees", body: paragraphs("Baby tees have a closer fit and crop tees have a shorter hem. The oversized measurements below do not apply to these styles. Contact us for the specific garment measurements before ordering.") },
    { title: "Garment measurements", body: <div className="help-table"><table><thead><tr><th>Size</th><th>Chest</th><th>Length</th><th>Shoulder</th></tr></thead><tbody>{[["XS","40 in / 102 cm","27 in / 69 cm","18 in / 46 cm"],["S","42 in / 107 cm","28 in / 71 cm","19 in / 48 cm"],["M","44 in / 112 cm","29 in / 74 cm","20 in / 51 cm"],["L","46 in / 117 cm","30 in / 76 cm","21 in / 53 cm"],["XL","48 in / 122 cm","31 in / 79 cm","22 in / 56 cm"]].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div> },
    { title: "Need sizing help?", body: paragraphs("Contact P&R support before ordering with your usual size and preferred fit. We will help you choose the closest option.") },
  ]} />;
}
