import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PowerOverloadEasyPage from "./PowerOverloadEasyPage";
import PowerOverloadMediumPage from "./PowerOverloadMediumPage";
import PowerOverloadHardPage from "./PowerOverloadHardPage";

const PowerOverloadPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeDifficulty, setActiveDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | null>(null);

  useEffect(() => {
    const diffParam = searchParams.get("difficulty")?.toUpperCase();
    if (diffParam === "EASY" || diffParam === "MEDIUM" || diffParam === "HARD") {
      setActiveDifficulty(diffParam as 'EASY' | 'MEDIUM' | 'HARD');
    } else {
      // Randomly select difficulty level if not explicitly provided (e.g. entered directly from main page)
      const difficulties: ('EASY' | 'MEDIUM' | 'HARD')[] = ['EASY', 'MEDIUM', 'HARD'];
      const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
      setActiveDifficulty(randomDiff);
    }
  }, [searchParams]);

  if (!activeDifficulty) {
    return (
      <div className="bg-black min-h-screen text-zinc-500 font-mono flex items-center justify-center">
        INITIALIZING MAIN JUNCTION MAINBOARD...
      </div>
    );
  }

  if (activeDifficulty === "EASY") {
    return <PowerOverloadEasyPage />;
  } else if (activeDifficulty === "MEDIUM") {
    return <PowerOverloadMediumPage />;
  } else {
    return <PowerOverloadHardPage />;
  }
};

export default PowerOverloadPage;
