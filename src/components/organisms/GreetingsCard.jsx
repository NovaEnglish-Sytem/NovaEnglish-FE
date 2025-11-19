import React from "react";
import { classes } from "../../config/theme/tokens.js";

export default function GreetingsCard({
  role = "Tutor",
  margin= "mt-0",
  nickname = "",
  GreetingsIcon = "",
}) {
  return (
    <div className="w-full flex justify-center">
      <div className={['w-full', margin].filter(Boolean).join(' ')}>
        <div className="max-w-[1314px] mx-auto bg-[#f4f9f3] rounded-2xl border border-[#d9e7d6] shadow-[4px_4px_2px_#0000000d] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-xl sm:text-2xl font-bold leading-snug">
              <span className="text-[#2E7D20]">Welcome to your dashboard, </span>
              <span className={classes.textSuccess}>
                {nickname}
              </span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-500">
              {role === "Tutor"
                ? "Here’s the Student Performance Summary."
                : "Here’s your progress so far – let’s reach the next level together!"}
            </p>
          </div>
          {GreetingsIcon && (
            <img
              src={GreetingsIcon}
              alt="Greetings Icon"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 max-[320px]:hidden md:-translate-x-15 lg:-translate-x-25"
            />
          )}
        </div>
      </div>
    </div>
  );
}
