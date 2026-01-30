# PRD: Computer Vision Best Practices Repository Upgrade

## Original Problem Statement
Transform the `NOTE-Best-Practices-for-Computer-Vision` GitHub repository from personal notes into a canonical, visual, engineering-grade Computer Vision best-practices guide suitable for pinning, sharing by practitioners, and referencing by juniors, seniors, and researchers.

## Core Requirements (Static)
1. DO NOT delete existing content
2. DO NOT overwrite the author's voice
3. Add structure, visuals, clarity, and navigation
4. Prefer diagrams and tables over long text
5. Every concept should answer: Why it matters, When it fails, What to do instead

## User Personas
- **ML Engineers**: Production-ready patterns, failure modes, debugging strategies
- **Data Scientists**: Experiment design, hyperparameter intuition, evaluation pitfalls
- **Students/Juniors**: Structured learning path from basics to deployment
- **Researchers**: Architecture trade-offs, reproducibility considerations
- **Tech Leads**: Decision frameworks, team onboarding material

## What's Been Implemented (January 2026)

### Phase 1 (Completed) ✅
1. **Top-level README.md rewritten**
   - Visual Mermaid lifecycle diagram
   - Quick navigation table
   - Model selection flowchart
   - Understanding CV models section with tables

2. **00_READ_THIS_FIRST.md created**
   - Who this repo is for
   - Reading modes (linear vs reference)
   - Suggested reading paths (Beginner, Practitioner, Research)
   - Key concepts mindmap

3. **Decision tables added to existing content**:
   - Data Augmentation selection cheatsheet
   - Model Selection CNN decision table
   - Learning Rate selection cheatsheet
   - Imbalanced Data handling decision table

4. **Failure modes added to key sections**:
   - Data Augmentation: Over-augmentation, label desync, semantic violation
   - CNN Model Selection: Architecture overkill, domain mismatch, resolution mismatch
   - Learning Rate: LR too high/low, no warmup, wrong schedule
   - Imbalanced Data: Metric blindness, overfitting minority, SMOTE artifacts
   - Deployment: Cold start, memory leak, feature skew, silent degradation

### Phase 2 (Completed) ✅
5. **production_considerations.md created**
   - Data drift vs concept drift with detection strategy
   - Latency vs accuracy trade-offs with quadrant chart
   - Model rollback strategies with decision tree
   - Dataset versioning schema and metadata template
   - Model serving architecture patterns
   - Production failure modes and checklist

6. **visualizations/ folder created**:
   - dataset_health.md: Class distribution, image quality, label quality, duplicates
   - augmentation_effects.md: Before/after grids, intensity spectrum, task compatibility
   - model_behavior.md: Feature maps, attention maps, embedding space, confidence
   - evaluation_pitfalls.md: Data leakage, metric selection, threshold, CV pitfalls

### Phase 3 (Completed) ✅
7. **templates/ folder created**:
   - model_card.md: Full model documentation template
   - dataset_card.md: Full dataset documentation template

## P0/P1/P2 Features Remaining

### P0 (Critical) - None remaining

### P1 (High Priority)
- Add decision tables to remaining sections (Batch Size, Optimizers, Object Detection, Segmentation)
- Add failure modes to more CV application sections (YOLO, Faster R-CNN, Image Captioning)

### P2 (Nice to Have)
- Add more Mermaid diagrams to individual topic pages
- Cross-link between related sections more thoroughly
- Add "Real-world case study" examples to failure modes
- Create a CONTRIBUTING.md for community guidelines

## Next Tasks List
1. User to review and provide feedback on current changes
2. Add decision tables to Object Detection section
3. Add failure modes to YOLO/Faster R-CNN comparison
4. Consider adding a "Common Mistakes by Experience Level" section

## Architecture Notes
- All content in Markdown with Mermaid diagrams (GitHub-native)
- No external image files generated (per user request)
- Preserved author's original voice; added professional structure
- Windows line endings converted to Unix for consistency

## Success Criteria Met
✅ Repo feels reference-grade, not tutorial-like
✅ Content emphasizes engineering judgment and trade-offs
✅ Visual roadmaps and decision tables throughout
✅ Failure modes documented for key concepts
✅ Production considerations included
✅ Templates for model/dataset documentation provided
