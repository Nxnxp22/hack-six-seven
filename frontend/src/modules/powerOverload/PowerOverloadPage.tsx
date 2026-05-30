import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PowerOverloadEasyPage from "./PowerOverloadEasyPage";
import PowerOverloadMediumPage from "./PowerOverloadMediumPage";
import PowerOverloadHardPage from "./PowerOverloadHardPage";

const PowerOverloadPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeDifficulty, setActiveDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | null>(null);

  useEffect(() => {
    const savedDifficulty = sessionStorage.getItem("active_game_difficulty")?.toUpperCase();
    if (savedDifficulty === "EASY" || savedDifficulty === "MEDIUM" || savedDifficulty === "HARD") {
      setActiveDifficulty(savedDifficulty as 'EASY' | 'MEDIUM' | 'HARD');
      if (searchParams.get("difficulty")?.toUpperCase() !== savedDifficulty) {
        setSearchParams({ difficulty: savedDifficulty.toLowerCase() }, { replace: true });
      }
      return;
    }

    const diffParam = searchParams.get("difficulty")?.toUpperCase();
    if (diffParam === "EASY" || diffParam === "MEDIUM" || diffParam === "HARD") {
      setActiveDifficulty(diffParam as 'EASY' | 'MEDIUM' | 'HARD');
    } else {
      const difficulties: ('EASY' | 'MEDIUM' | 'HARD')[] = ['EASY', 'MEDIUM', 'HARD'];
      const randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
      setActiveDifficulty(randomDiff);
    }
  }, [searchParams, setSearchParams]);

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
