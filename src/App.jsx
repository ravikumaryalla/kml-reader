import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import * as toGeoJSON from "@tmcw/togeojson";
import "leaflet/dist/leaflet.css";
import classes from "./App.module.css";

const KMLViewer = () => {
  const [geojson, setGeojson] = useState(null);
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const parser = new DOMParser();
      const kml = parser.parseFromString(event.target.result, "text/xml");
      const converted = toGeoJSON.kml(kml);
      setGeojson(converted);
      processKMLData(converted);
    };

    reader.readAsText(file);
  };

  const processKMLData = (data) => {
    const counts = {};
    const lengths = {};

    data.features.forEach((feature) => {
      const type = feature.geometry.type;
      counts[type] = (counts[type] || 0) + 1;

      if (type.includes("LineString")) {
        const length = feature.geometry.coordinates.reduce(
          (total, coords, index, arr) => {
            if (index === 0) return total;
            const [lon1, lat1] = arr[index - 1];
            const [lon2, lat2] = coords;
            return total + Math.sqrt((lon2 - lon1) ** 2 + (lat2 - lat1) ** 2);
          },
          0
        );
        lengths[type] = (lengths[type] || 0) + length;
      }
    });

    setSummary(counts);
    setDetails(lengths);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".kml",
    multiple: false,
  });

  return (
    <div className={classes["container-wrapper"]}>
      <div className={classes["container"]}>
        <h1 className="title">KML File Viewer</h1>
        <div {...getRootProps()} className={classes["dropzone"]}>
          <input {...getInputProps()} />
          <p> Drag & drop a KML file here, or click to select one</p>
        </div>

        {geojson && (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            className={classes["map-container"]}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <GeoJSON data={geojson} />
          </MapContainer>
        )}

        {geojson && (
          <div className={classes["buttons"]}>
            <button
              className={classes["action-buttons"]}
              onClick={() => setShowSummary(!showSummary)}
            >
              {showSummary ? "Hide Summary" : "Show Summary"}
            </button>
            <button
              className={classes["action-buttons"]}
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide Details" : "Show Details"}
            </button>
          </div>
        )}

        {showSummary && summary && (
          <div className={classes["table-container"]}>
            <h2> Summary</h2>
            <table className={classes["styled-table"]}>
              <thead>
                <tr>
                  <th>Element Type</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary).map(([type, count]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showDetails && details && (
          <div className={classes["table-container"]}>
            <h2> Detailed View</h2>
            <table className={classes["styled-table"]}>
              <thead>
                <tr>
                  <th>Element Type</th>
                  <th>Total Length</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(details).map(([type, length]) => (
                  <tr key={type}>
                    <td>{type}</td>
                    <td>{length.toFixed(2)} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default KMLViewer;
