import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import shafts from "./shafts.json";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

function classifySimilarity(a, b) {
  const tipFlexClose = Math.abs(a.tip_flex - b.tip_flex) <= 6;
  const cpmClose = Math.abs(a.cpm - b.cpm) <= 6;
  const torqueClose = Math.abs(a.torque - b.torque) <= 0.5;

  if (!tipFlexClose || !cpmClose || !torqueClose) return "Not Similar";

  const balancePointClose = Math.abs(a.balance_point - b.balance_point) <= 0.5;
  const eiWithin5 = a.ei_profile.every((val, i) => Math.abs(val - b.ei_profile[i]) <= 5);
  const eiWithin10 = a.ei_profile.every((val, i) => Math.abs(val - b.ei_profile[i]) <= 10);

  if (balancePointClose && eiWithin5) return "High Similarity";
  if (balancePointClose && eiWithin10) return "Medium Similarity";
  return "Low Similarity";
}

export default function App() {
  const [tab, setTab] = useState("matching");
  const [selected, setSelected] = useState(null);
  const [comparison, setComparison] = useState([]);

  const matches = selected
    ? shafts
        .filter((s) => s !== selected)
        .map((s) => ({
          ...s,
          similarityTier: classifySimilarity(selected, s),
        }))
    : [];

  const chartData = (main, compareList) => ({
    labels: main.ei_profile.map((_, i) => `EI${i + 1}`),
    datasets: [
      {
        label: `${main.model}`,
        data: main.ei_profile,
        borderColor: "blue",
      },
      ...compareList.map((s, i) => ({
        label: `${s.model}`,
        data: s.ei_profile,
        borderColor: ["green", "orange", "gray", "purple", "red", "teal"][i % 6],
      })),
    ],
  });

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Golf Shaft Comparison</h1>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setTab("matching")}>Shaft Matching</button>
        <button onClick={() => setTab("comparison")}>Shaft Comparison</button>
      </div>

      {tab === "matching" && (
        <div>
          <select onChange={(e) => setSelected(shafts.find(s => s.model === e.target.value))} defaultValue="">
            <option value="" disabled>Select a shaft</option>
            {shafts.map((shaft, i) => (
              <option key={i} value={shaft.model}>
                {shaft.brand} - {shaft.model} ({shaft.flex})
              </option>
            ))}
          </select>

          {selected && (
            <div>
              <h2>Selected: {selected.brand} {selected.model}</h2>
              <p><strong>Weight:</strong> {selected.weight}g</p>
              <p><strong>Torque:</strong> {selected.torque}</p>
              <p><strong>Balance Point:</strong> {selected.balance_point}</p>
              <p><strong>Tip Flex:</strong> {selected.tip_flex}</p>
              <p><strong>CPM:</strong> {selected.cpm}</p>

              <h3>EI Profile Comparison</h3>
              <Line data={chartData(selected, matches.filter(m =>
                m.similarityTier === "High Similarity" || m.similarityTier === "Medium Similarity"))} />

              <h3>Matches</h3>
              {["High Similarity", "Medium Similarity", "Low Similarity", "Not Similar"].map((tier) => (
                <div key={tier}>
                  <h4>{tier}</h4>
                  <ul>
                    {matches
                      .filter((m) => m.similarityTier === tier)
                      .map((m, i) => (
                        <li key={i}>
                          {m.brand} {m.model} ({m.flex}) – Weight: {m.weight}g, Torque: {m.torque}, Balance Point: {m.balance_point}, Tip Flex: {m.tip_flex}, CPM: {m.cpm}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "comparison" && (
        <div>
          <h2>Compare EI Profiles</h2>
          <select multiple onChange={(e) => {
            const selectedModels = Array.from(e.target.selectedOptions).map(o => o.value);
            setComparison(shafts.filter(s => selectedModels.includes(s.model)));
          }} style={{ width: "100%", height: "150px" }}>
            {shafts.map((shaft, i) => (
              <option key={i} value={shaft.model}>
                {shaft.brand} - {shaft.model} ({shaft.flex})
              </option>
            ))}
          </select>

          {comparison.length > 0 && (
            <div>
              <h3>EI Curve Comparison</h3>
              <Line data={chartData(comparison[0], comparison.slice(1))} />
              <h3>Specs</h3>
              <ul>
                {comparison.map((s, i) => (
                  <li key={i}>
                    {s.brand} {s.model} ({s.flex}) – Weight: {s.weight}g, Torque: {s.torque}, Balance Point: {s.balance_point}, Tip Flex: {s.tip_flex}, CPM: {s.cpm}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
