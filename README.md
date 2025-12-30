# 📐 Stark // The Creator Protocol

**Build. Share. Inspire.**  
*Design isn't real until it ships.*

![Stark Hero](https://github.com/user-attachments/assets/85c24007-0ff1-4e09-8bb0-5180c389404e)

![Explore Hub](https://github.com/user-attachments/assets/e8fda599-6490-4649-b16a-11ba2bc094d2)

![Global Trending](https://github.com/user-attachments/assets/88833918-96e3-427c-aafc-2c47c7287ab7)

Stark is a **unified, context-first portfolio network** built for the modern **Full-Stack Creator**.  

Unlike traditional platforms (Dribbble, Behance) that treat design as static images, Stark bridges the **Soul** (source code) and the **Body** (live deployment). Every project is a living, functional entity — complete with tech stack, repo health, and real-world performance.

## 👁️ The Vision

We believe context is just as inspiring as aesthetics. For developers, designers, and motion artists:

- See the **code behind the pixels**
- Explore **live deployments**
- Discover **repository insights** (stars, languages, documentation)

> **"Technical Minimalism"** — Honesty in design through visible grids, precision in sharp edges, and power in high contrast.

### Brand Palette & Principles
- **Deep Zinc** `#09090b` — Background
- **Stark White** `#FFFFFF` — Primary text
- **Hyper Red** `#FF0000` — Accents & highlights
- No border radius. Sharp. Engineered. Accurate.

## 🛠️ Core Features

### 1. Scout Bot (Intelligence Engine)
Automated project enrichment — no manual entry required.

- **GitHub Integration** → Auto-pulls README, stars, primary language, deploy URLs
- **Auto-Capture** → Server-side Puppeteer generates pixel-perfect desktop + mobile screenshots
- **Quality Scoring** → Proprietary 0–100 algorithm based on documentation depth and repo health

### 2. Hype Engine (Trending System)
Real-time leaderboard capturing system momentum.

- **Weighted Ranking**: Followers (20×), Stars (10×), Node Reach (1×)
- **Daily Velocity Calculation** → Surfaces rising creators and projects
- Metrics updated every 24 hours

### 3. Dossier (Creator Profiles)
Technical passports meets RPG character sheets.

- **Node Reach** → Unique profile interactions in real-time
- **Activity Heatmap** → Visualizes deployment frequency
- **The Handshake** → Gated messaging: only mutual followers can connect

### 4. God Mode (Admin Panel)
Terminal-style control center for operators.

- Immutable security audit logs
- Moderation queue with automated risk scoring
- High-fidelity incident tools

## 💻 Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Next.js 15 (App Router)             |
| Styling        | Tailwind CSS (`rounded-none`)       |
| Animations     | Framer Motion                       |
| Backend/DB     | Supabase (PostgreSQL)               |
| Realtime       | Supabase Realtime                   |
| Intelligence   | Puppeteer (Headless Chrome)         |
| Validation     | Zod                                 |

## 🚀 Getting Started

### 1. Environment Setup
```bash
git clone https://github.com/your-repo/stark.git
cd stark
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
```

### 2. Database Setup
Run the migrations in `/supabase/migrations` or execute the key RPC:

```sql
CREATE OR REPLACE FUNCTION public.register_view(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_viewer_hash TEXT
) RETURNS BOOLEAN AS $$
  -- Full implementation in project docs
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Install & Run
```bash
npm install
npm run dev
```

## 📡 Protocol Roadmap

| Phase                  | Focus                                      |
|-----------------------|--------------------------------------------|
| **Phase 1**           | Core UI + Industrial component library     |
| **Phase 2**           | Scout Bot — Auto-metadata & screenshots    |
| **Phase 3**           | Social Layer — Realtime chat & notifications |
| **Phase 4**           | Global Index — Search & filtering           |
| **Phase 5**           | Collaborative Nodes — Multi-author support |

## 🤝 Contribution Protocol

We welcome contributors who vibe with the Stark aesthetic.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit: `git commit -m 'feat: YourFeature description'`
4. Push: `git push origin feature/YourFeature`
5. Open a Pull Request

---

**[Website](https://stark-01.vercel.app/)** · **[Report Issue](https://github.com/andymarrow/stark/issues)** · **[Request Access](https://t.me/andymarrow)**

Built with precision. Deployed with intent.  



## ⚖️ License

**Stark** is source-available. 

- **Personal/Educational Use**: Feel free to fork, modify, and use this for your personal portfolio.
- **Commercial Use**: Prohibited without prior written consent. If you intend to use this code for a paid product, startup, or commercial venture, you must contact the author.

Licensed under the [Polyform Noncommercial 1.0.0](LICENSE).


**Stark // The Creator Protocol**
