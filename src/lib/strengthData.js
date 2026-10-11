// Strength words and behavior-based discovery questions for "How I Work"

export const STRENGTH_WORDS = [
  "Reliable",
  "Hardworking",
  "On time",
  "Consistent",
  "Focused",
  "Organized",
  "Flexible",
  "Independent",
  "Team-oriented",
  "Fast learner",
  "Detail-oriented",
  "Calm under pressure",
  "Good with people",
  "Patient",
  "Safety-conscious",
  "Problem solver",
  "Takes initiative",
  "Follows directions",
  "Willing to learn",
  "Gets the job done",
];

export const BEHAVIOR_QUESTIONS = [
  {
    id: "q1",
    question: "When you start a new job, what do you usually do first?",
    options: [
      { text: "I show up early and get myself ready", suggests: ["On time", "Reliable"] },
      { text: "I ask questions to understand what's expected of me", suggests: ["Willing to learn", "Good with people"] },
      { text: "I look around and figure out what needs to be done", suggests: ["Takes initiative", "Problem solver"] },
    ],
  },
  {
    id: "q2",
    question: "When something goes wrong at work, what do you do?",
    options: [
      { text: "I stay calm and figure out a solution", suggests: ["Calm under pressure", "Problem solver"] },
      { text: "I ask my supervisor or a coworker for help", suggests: ["Follows directions", "Team-oriented"] },
      { text: "I fix it myself and keep going", suggests: ["Independent", "Gets the job done"] },
    ],
  },
  {
    id: "q3",
    question: "How do you feel about doing the same task over and over?",
    options: [
      { text: "I don't mind — I like getting into a routine", suggests: ["Consistent", "Focused"] },
      { text: "I like it because I can do it well and fast", suggests: ["Detail-oriented", "Hardworking"] },
      { text: "I prefer variety but I'll do what's needed", suggests: ["Flexible", "Willing to learn"] },
    ],
  },
  {
    id: "q4",
    question: "When you work with others, what role do you usually take?",
    options: [
      { text: "I help keep things organized and on track", suggests: ["Organized", "Team-oriented"] },
      { text: "I step up and help guide the group", suggests: ["Takes initiative", "Problem solver"] },
      { text: "I do my part and support the team", suggests: ["Reliable", "Follows directions"] },
    ],
  },
  {
    id: "q5",
    question: "What matters most to you at work?",
    options: [
      { text: "Doing the job safely and correctly", suggests: ["Safety-conscious", "Detail-oriented"] },
      { text: "Helping customers or coworkers", suggests: ["Good with people", "Patient"] },
      { text: "Learning new things and growing", suggests: ["Willing to learn", "Fast learner"] },
    ],
  },
];

// Generate a natural-sounding strength statement (2–3 sentences) from selected words
export function generateStrengthStatement(words) {
  if (!words || words.length === 0) return "";
  const lower = words.map((w) => w.toLowerCase());
  const has = (w) => lower.includes(w.toLowerCase());

  const sentences = [];

  // Opening: dependability / work ethic / safety
  if (has("Reliable") || has("On time") || has("Consistent")) {
    sentences.push("I take pride in being someone employers can depend on.");
  } else if (has("Hardworking") || has("Gets the job done")) {
    sentences.push("I'm someone who puts in the effort and gets the job done.");
  } else if (has("Safety-conscious")) {
    sentences.push("I take safety seriously and always do things the right way.");
  } else {
    sentences.push(`I bring ${lower.slice(0, 3).join(", ")} to everything I do.`);
  }

  // Middle: work style
  const midParts = [];
  if (has("Independent") || has("Takes initiative")) {
    midParts.push("work well on my own");
  }
  if (has("Team-oriented") || has("Good with people")) {
    midParts.push(midParts.length > 0 ? "collaborate with others" : "work well with others");
  }
  if (has("Fast learner") || has("Willing to learn")) {
    midParts.push(midParts.length > 0 ? "pick up new skills quickly" : "learn new things quickly");
  }
  if (has("Problem solver")) {
    midParts.push(midParts.length > 0 ? "find solutions when challenges come up" : "solve problems effectively");
  }
  if (has("Organized")) {
    midParts.push(midParts.length > 0 ? "stay organized" : "keep things organized");
  }
  if (has("Patient") || has("Calm under pressure")) {
    midParts.push(midParts.length > 0 ? "stay steady under pressure" : "stay calm under pressure");
  }
  if (has("Flexible")) {
    midParts.push(midParts.length > 0 ? "adapt to change" : "adapt easily to new situations");
  }
  if (has("Detail-oriented")) {
    midParts.push(midParts.length > 0 ? "pay attention to detail" : "pay close attention to detail");
  }
  if (has("Focused")) {
    midParts.push(midParts.length > 0 ? "stay focused on the task" : "stay focused until the job is done");
  }
  if (has("Follows directions")) {
    midParts.push(midParts.length > 0 ? "follow directions carefully" : "follow directions well");
  }

  if (midParts.length === 1) {
    sentences.push(`I ${midParts[0]}.`);
  } else if (midParts.length === 2) {
    sentences.push(`I ${midParts[0]} and ${midParts[1]}.`);
  } else if (midParts.length >= 3) {
    sentences.push(`I ${midParts.slice(0, -1).join(", ")}, and ${midParts[midParts.length - 1]}.`);
  }

  // Closing: follow-through / steadiness / commitment
  if (sentences.length < 3) {
    if (has("Consistent") || has("Focused") || has("Detail-oriented")) {
      sentences.push("I consistently follow through on my responsibilities.");
    } else if (has("Calm under pressure") || has("Patient") || has("Flexible")) {
      sentences.push("I stay steady and focused, even when things get busy.");
    } else if (has("Hardworking") || has("Gets the job done")) {
      sentences.push("I put in the effort and follow through on everything I do.");
    } else {
      sentences.push("I'm committed to doing good work every day.");
    }
  }

  if (sentences.length < 2) {
    sentences.push("I'm ready to bring my best to the job every day.");
  }

  return sentences.slice(0, 3).join(" ");
}