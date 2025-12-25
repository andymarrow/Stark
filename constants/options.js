// app/constants/options.js

export const TECH_STACKS = {
  code: [
    "React", "Next.js", "TypeScript", "Tailwind", "Node.js", "Supabase", 
    "Vue", "Svelte", "Python", "Go", "Rust", "Docker", "AWS", "Firebase"
  ],
  design: [
    "Figma", "Adobe XD", "Photoshop", "Illustrator", "Blender", 
    "Spline", "Sketch", "Procreate", "InDesign"
  ],
  video: [
    "After Effects", "Premiere Pro", "DaVinci Resolve", "Cinema 4D", 
    "Final Cut", "Unreal Engine", "Houdini"
  ]
};

// Countries mapped to your Map Regions (na, eu, as, sa, af, au)
export const COUNTRIES = [
  // =====================
  // North America (na)
  // =====================
  { label: "United States", value: "United States", region: "na" },
  { label: "Canada", value: "Canada", region: "na" },
  { label: "Mexico", value: "Mexico", region: "na" },
  { label: "Guatemala", value: "Guatemala", region: "na" },
  { label: "Cuba", value: "Cuba", region: "na" },
  { label: "Dominican Republic", value: "Dominican Republic", region: "na" },
  { label: "Haiti", value: "Haiti", region: "na" },
  { label: "Jamaica", value: "Jamaica", region: "na" },
  { label: "Panama", value: "Panama", region: "na" },
  { label: "Costa Rica", value: "Costa Rica", region: "na" },

  // =====================
  // South America (sa)
  // =====================
  { label: "Brazil", value: "Brazil", region: "sa" },
  { label: "Argentina", value: "Argentina", region: "sa" },
  { label: "Chile", value: "Chile", region: "sa" },
  { label: "Colombia", value: "Colombia", region: "sa" },
  { label: "Peru", value: "Peru", region: "sa" },
  { label: "Venezuela", value: "Venezuela", region: "sa" },
  { label: "Bolivia", value: "Bolivia", region: "sa" },
  { label: "Ecuador", value: "Ecuador", region: "sa" },
  { label: "Paraguay", value: "Paraguay", region: "sa" },
  { label: "Uruguay", value: "Uruguay", region: "sa" },

  // =====================
  // Europe (eu)
  // =====================
  { label: "United Kingdom", value: "United Kingdom", region: "eu" },
  { label: "Ireland", value: "Ireland", region: "eu" },
  { label: "Germany", value: "Germany", region: "eu" },
  { label: "France", value: "France", region: "eu" },
  { label: "Spain", value: "Spain", region: "eu" },
  { label: "Portugal", value: "Portugal", region: "eu" },
  { label: "Italy", value: "Italy", region: "eu" },
  { label: "Netherlands", value: "Netherlands", region: "eu" },
  { label: "Belgium", value: "Belgium", region: "eu" },
  { label: "Switzerland", value: "Switzerland", region: "eu" },
  { label: "Austria", value: "Austria", region: "eu" },
  { label: "Poland", value: "Poland", region: "eu" },
  { label: "Czech Republic", value: "Czech Republic", region: "eu" },
  { label: "Sweden", value: "Sweden", region: "eu" },
  { label: "Norway", value: "Norway", region: "eu" },
  { label: "Denmark", value: "Denmark", region: "eu" },
  { label: "Finland", value: "Finland", region: "eu" },
  { label: "Greece", value: "Greece", region: "eu" },
  { label: "Romania", value: "Romania", region: "eu" },
  { label: "Ukraine", value: "Ukraine", region: "eu" },

  // =====================
  // Africa (af)
  // =====================
  { label: "Ethiopia", value: "Ethiopia", region: "af" },
  { label: "Nigeria", value: "Nigeria", region: "af" },
  { label: "Kenya", value: "Kenya", region: "af" },
  { label: "South Africa", value: "South Africa", region: "af" },
  { label: "Egypt", value: "Egypt", region: "af" },
  { label: "Ghana", value: "Ghana", region: "af" },
  { label: "Uganda", value: "Uganda", region: "af" },
  { label: "Tanzania", value: "Tanzania", region: "af" },
  { label: "Rwanda", value: "Rwanda", region: "af" },
  { label: "Somalia", value: "Somalia", region: "af" },
  { label: "Sudan", value: "Sudan", region: "af" },
  { label: "Morocco", value: "Morocco", region: "af" },
  { label: "Algeria", value: "Algeria", region: "af" },
  { label: "Tunisia", value: "Tunisia", region: "af" },
  { label: "Senegal", value: "Senegal", region: "af" },
  { label: "Ivory Coast", value: "Ivory Coast", region: "af" },
  { label: "Cameroon", value: "Cameroon", region: "af" },
  { label: "Zambia", value: "Zambia", region: "af" },
  { label: "Zimbabwe", value: "Zimbabwe", region: "af" },
  { label: "Namibia", value: "Namibia", region: "af" },

  // =====================
  // Asia (as)
  // =====================
  { label: "India", value: "India", region: "as" },
  { label: "China", value: "China", region: "as" },
  { label: "Japan", value: "Japan", region: "as" },
  { label: "South Korea", value: "South Korea", region: "as" },
  { label: "North Korea", value: "North Korea", region: "as" },
  { label: "Pakistan", value: "Pakistan", region: "as" },
  { label: "Bangladesh", value: "Bangladesh", region: "as" },
  { label: "Sri Lanka", value: "Sri Lanka", region: "as" },
  { label: "Nepal", value: "Nepal", region: "as" },
  { label: "Bhutan", value: "Bhutan", region: "as" },
  { label: "Thailand", value: "Thailand", region: "as" },
  { label: "Vietnam", value: "Vietnam", region: "as" },
  { label: "Malaysia", value: "Malaysia", region: "as" },
  { label: "Singapore", value: "Singapore", region: "as" },
  { label: "Indonesia", value: "Indonesia", region: "as" },
  { label: "Philippines", value: "Philippines", region: "as" },
  { label: "Saudi Arabia", value: "Saudi Arabia", region: "as" },
  { label: "United Arab Emirates", value: "United Arab Emirates", region: "as" },
  { label: "Israel", value: "Israel", region: "as" },
  { label: "Turkey", value: "Turkey", region: "as" },

  // =====================
  // Oceania / Australia (au)
  // =====================
  { label: "Australia", value: "Australia", region: "au" },
  { label: "New Zealand", value: "New Zealand", region: "au" },
  { label: "Papua New Guinea", value: "Papua New Guinea", region: "au" },
  { label: "Fiji", value: "Fiji", region: "au" },
  { label: "Samoa", value: "Samoa", region: "au" },
  { label: "Tonga", value: "Tonga", region: "au" },
];
