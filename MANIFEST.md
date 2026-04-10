# Parent Backup Plan - MANIFEST

Emergency backup plans for every parenting scenario. Be prepared, not panicked.

## Overview

A mobile-first web app for parents to create and access emergency backup plans when things go wrong - sick childminders, cancelled clubs, weather chaos, school surprises. Create plans ahead of time so when chaos hits, you just pull up the app and follow the steps.

## Tech Stack

- **Framework:** Next.js 16.2.3 (App Router)
- **Database:** Neon PostgreSQL (serverless)
- **Styling:** Tailwind CSS (dark mode, mobile-first)
- **Analytics:** @vercel/analytics + @vercel/speed-insights
- **Deployment:** Vercel

## Database Schema

### bp_families
- `id` SERIAL PK
- `name` TEXT - Family name
- `code` TEXT UNIQUE - Join code (PLAN-XXXX format)
- `created_at` TIMESTAMPTZ

### bp_scenarios
- `id` SERIAL PK
- `family_id` INT FK (NULL for templates)
- `category` TEXT (childcare|weather|health|transport|school|general)
- `title` TEXT
- `description` TEXT
- `icon` TEXT (emoji)
- `is_template` BOOLEAN
- `created_at` TIMESTAMPTZ

### bp_plans
- `id` SERIAL PK
- `scenario_id` INT FK
- `family_id` INT FK
- `title` TEXT
- `priority` INT (1=Plan A, 2=Plan B, 3=Plan C)
- `steps` JSONB - Array of {order, text}
- `contacts` JSONB - Array of {name, phone, role}
- `notes` TEXT
- `last_used` TIMESTAMPTZ
- `times_used` INT
- `created_at` TIMESTAMPTZ

## Pages

### `/` - Landing Page
- Create new family (generates unique code)
- Join existing family with code
- Family ID stored in localStorage

### `/dashboard` - Main Dashboard
- Category grid (6 categories) with scenario/plan counts
- Quick Access section for recently used plans
- Big, tappable cards for emergency access

### `/category/[slug]` - Category View
- List of all scenarios in category (templates + custom)
- Shows plan count per scenario
- Links to individual scenarios

### `/scenario/[id]` - Scenario Detail
- Full scenario view with all backup plans
- Plans ordered by priority (Plan A first)
- Each plan shows: steps checklist, emergency contacts with tel: links
- "Activate Plan" button tracks usage

### `/plan/new?scenarioId=X` - Create Plan
- Title, priority dropdown
- Dynamic steps list (add/remove)
- Dynamic contacts list (name, phone, role)
- Notes textarea

### `/plan/[id]/edit` - Edit Plan
- Same form as create, pre-filled
- Delete plan option

## API Routes

- `POST /api/family` - Create family, returns code
- `POST /api/family/join` - Join with code
- `GET /api/scenarios?familyId=X` - Get all scenarios
- `POST /api/scenarios` - Create custom scenario
- `GET /api/plans?scenarioId=X` - Get plans for scenario
- `POST /api/plans` - Create plan
- `PUT /api/plans/[id]` - Update plan
- `DELETE /api/plans/[id]` - Delete plan
- `POST /api/plans/[id]/activate` - Track plan usage

## Seed Data (16 Template Scenarios)

### Childcare
- Childminder sick 🤒
- Nursery closed unexpectedly 🏫
- After-school club cancelled ⚽

### Weather
- Rainy day - outdoor plans cancelled 🌧️
- Snow day - school closed ❄️
- Heatwave - too hot for park 🌡️

### Health
- Child sick - can't go to school 🤧
- Parent sick - need backup 😷
- A&E visit needed 🚑

### Transport
- Car won't start on school run 🚗
- Public transport strike 🚌

### School
- School closed for INSET day (forgotten) 📚
- School event I forgot about 🎭

### General
- Power cut ⚡
- Unexpected visitors 👋
- Double-booked commitments 📅

## Design Principles

1. **SPEED over aesthetics** - 3 taps max to reach any plan
2. **Big touch targets** - Emergency = shaky hands
3. **One-tap calling** - Contact numbers are tel: links
4. **Priority ordering** - Plan A first, always
5. **Usage tracking** - Know which plans actually get used

## Environment Variables

```
DATABASE_URL=postgresql://...
```

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```