"use client";

import React from "react";
import AutoBattler from "@/components/AutoBattler";

const Home: React.FC = () => {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <AutoBattler />
    </div>
  );
};

export default Home;