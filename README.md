# Durga Puja Photography Competition — 3-Model AI Authenticity Screening System

An internal competition management system engineered to evaluate photographic authenticity for the **Durga Puja Photography Competition** (~300 entry capacity).

The system uses a **3-model independent AI detector ensemble** with a majority-voting mechanism, deadband confidence gating, cryptographic deduplication (SHA-256), perceptual visual similarity matching (dHash), and forensic EXIF extraction.

---

## Key Features

1. **3-Model Screening Ensemble**:
   - **Detector 1 (High-Precision Anchor)**: SwinV2 Transformer (`haywoodsloan/ai-image-detector-deploy`)
   - **Detector 2 (Vision-Language Contrastive)**: SigLIP (`Ateeqq/ai-vs-human-image-detector`)
   - **Detector 3 (Forensic Sentry)**: ViT-Base Deepfake / Photographic Artifact (`dima806/deepfake_vs_real_image_detection`)
2. **2-of-3 Majority Decision with Deadband Gating**:
   - Scores between `0.30` and `0.70` return `INCONCLUSIVE` (suppresses false accusations on complex cultural/night photos).
   - `ai_votes >= 2` $\rightarrow$ **AI SUSPECTED (RED)**
   - `real_votes >= 2` $\rightarrow$ **LIKELY AUTHENTIC (GREEN)**
   - Conflicting / Inconclusive $\rightarrow$ **MANUAL REVIEW (YELLOW)**
   - Inference Failure $\rightarrow$ **PARTIAL ANALYSIS (GRAY)**
3. **No Automatic Disqualification**:
   - Automated detectors act solely as decision-support triage. Human judges make binding decisions.
4. **Task Separation**:
   - Full synthetic generation detection is isolated from local inpainting detection (`AI EDIT DETECTION: NOT AVAILABLE`).
5. **Forensic Signals**:
   - **SHA-256**: Identifies exact duplicate files.
   - **Perceptual dHash**: Identifies near-duplicate re-encodings ($\ge 85\%$ visual similarity).
   - **EXIF Extraction**: Camera Make/Model, Lens, ISO, Exposure, Software tags (Photoshop/Lightroom).
6. **Robust Batch Queue**:
   - Handles multi-file uploads with concurrency throttling (concurrency = 2) and exponential backoff on rate limits.
7. **Offline / Custom Worker**:
   - Standalone CLI worker (`workers/python_detector_worker.py`) for running custom local PyTorch / ONNX weights offline.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

HF_TOKEN=hf_...

AI_DETECTOR_MODEL_1=haywoodsloan/ai-image-detector-deploy
AI_DETECTOR_MODEL_2=Ateeqq/ai-vs-human-image-detector
AI_DETECTOR_MODEL_3=dima806/deepfake_vs_real_image_detection

AI_THRESHOLD=0.70
REAL_THRESHOLD=0.30
AI_AUTO_DISQUALIFY=false
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 3. Production Build
```bash
npm run build
npm start
```
