# Test Content Samples for AI Flashcard Generation

This file contains different content samples to test whether the AI flashcard generation produces variable card counts based on content analysis.

## Test Sample 1: Minimal Content (Should generate 2-4 cards)
The capital of France is Paris. Paris is located in northern France on the River Seine.

## Test Sample 2: Short Educational Content (Should generate 5-8 cards)
Photosynthesis is the process by which plants convert sunlight into energy. During photosynthesis, plants use chlorophyll to absorb light energy. They combine carbon dioxide from the air with water from the soil to produce glucose (sugar) and oxygen. The chemical equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process occurs mainly in the leaves of plants, specifically in structures called chloroplasts.

## Test Sample 3: Medium Educational Content (Should generate 8-12 cards)
The American Civil War (1861-1865) was a defining moment in United States history. The war began when eleven Southern states seceded from the Union to form the Confederate States of America. The primary causes included disagreements over slavery, states' rights, and economic differences between the industrial North and agricultural South.

Key figures included President Abraham Lincoln, who led the Union, and Confederate President Jefferson Davis. Major battles occurred at Bull Run, Antietam, Gettysburg, and Vicksburg. The Emancipation Proclamation, issued by Lincoln in 1863, declared slaves in rebellious states to be free.

The war ended with Confederate General Robert E. Lee's surrender to Union General Ulysses S. Grant at Appomattox Court House in April 1865. The conflict resulted in approximately 620,000 deaths and led to the abolition of slavery through the 13th Amendment.

## Test Sample 4: Comprehensive Educational Content (Should generate 15-20 cards)
Cell biology is the study of cells, their physiological properties, structure, organelles, interactions with their environment, life cycle, division, and death. Cells are the fundamental units of life and can be broadly categorized into two types: prokaryotic and eukaryotic cells.

Prokaryotic cells, found in bacteria and archaea, lack a membrane-bound nucleus. Their genetic material is located in a nucleoid region. They typically have a cell wall, plasma membrane, ribosomes, and may contain plasmids. Some prokaryotes have flagella for movement and pili for attachment.

Eukaryotic cells, found in plants, animals, fungi, and protists, have a membrane-bound nucleus containing their DNA. They possess various organelles including:

1. Mitochondria: The powerhouse of the cell, responsible for cellular respiration and ATP production
2. Endoplasmic Reticulum (ER): Rough ER has ribosomes and synthesizes proteins; smooth ER lacks ribosomes and synthesizes lipids
3. Golgi Apparatus: Modifies, packages, and ships proteins from the ER
4. Lysosomes: Contain digestive enzymes that break down waste materials
5. Ribosomes: Sites of protein synthesis
6. Cytoskeleton: Provides structural support and maintains cell shape

Plant cells additionally contain chloroplasts (for photosynthesis), a large central vacuole (for storage and support), and a rigid cell wall made of cellulose.

Cell division occurs through mitosis in somatic cells and meiosis in reproductive cells. The cell cycle consists of interphase (G1, S, G2 phases) and the mitotic phase (M phase). During S phase, DNA replication occurs, ensuring each daughter cell receives an identical copy of genetic information.

## Test Sample 5: Complex Technical Content (Should generate 20+ cards)
Quantum mechanics is a fundamental theory in physics that describes the behavior of matter and energy at the atomic and subatomic scale. Unlike classical physics, which deals with predictable, deterministic systems, quantum mechanics introduces the concept of probability and uncertainty.

The foundation of quantum mechanics rests on several key principles:

**Wave-Particle Duality**: All matter and energy exhibit both wave-like and particle-like properties. This was first demonstrated through the double-slit experiment, where electrons or photons create an interference pattern when not observed, but behave like particles when measured.

**Heisenberg Uncertainty Principle**: Formulated by Werner Heisenberg, this principle states that it's impossible to simultaneously know both the exact position and momentum of a particle. The more precisely one property is measured, the less precisely the other can be known. Mathematically expressed as: Δx × Δp ≥ ℏ/2.

**Quantum Superposition**: Particles can exist in multiple states simultaneously until measured. The famous Schrödinger's cat thought experiment illustrates this concept, where a cat can be both alive and dead until observed.

**Quantum Entanglement**: Einstein called this "spooky action at a distance." When particles become entangled, measuring one particle instantly affects its partner, regardless of the distance separating them.

**Wave Function**: Described by the Schrödinger equation, the wave function (ψ) contains all possible information about a quantum system. The square of the wave function's magnitude gives the probability of finding a particle in a particular state.

**Quantum Numbers**: Four quantum numbers describe the state of an electron in an atom:
- Principal quantum number (n): Energy level
- Angular momentum quantum number (l): Orbital shape
- Magnetic quantum number (ml): Orbital orientation
- Spin quantum number (ms): Electron spin direction

**Applications**: Quantum mechanics has led to numerous technological advances including lasers, MRI machines, computer hard drives, and is the foundation for emerging technologies like quantum computing and quantum cryptography.

**Mathematical Framework**: The time-evolution of quantum systems is governed by the Schrödinger equation: iℏ(∂ψ/∂t) = Ĥψ, where Ĥ is the Hamiltonian operator representing the total energy of the system.

## Test Sample 6: Very Brief Content (Should generate 1-3 cards)
Water boils at 100°C.

## Test Sample 7: List-Heavy Content (Should generate 10-15 cards)
The Seven Wonders of the Ancient World were:

1. Great Pyramid of Giza (Egypt) - The only wonder still standing today
2. Hanging Gardens of Babylon (Iraq) - Terraced gardens built by King Nebuchadnezzar II
3. Temple of Artemis at Ephesus (Turkey) - Dedicated to the Greek goddess Artemis
4. Statue of Zeus at Olympia (Greece) - Massive gold and ivory statue by Phidias
5. Mausoleum at Halicarnassus (Turkey) - Tomb of Mausolus, origin of the word "mausoleum"
6. Colossus of Rhodes (Greece) - Giant bronze statue of Helios
7. Lighthouse of Alexandria (Egypt) - Guided ships into the harbor for over 1,500 years

Each wonder represented the pinnacle of ancient engineering and artistic achievement. The Great Pyramid, built around 2580-2510 BCE, originally stood 146.5 meters tall. The Hanging Gardens were considered a marvel of irrigation engineering. The Temple of Artemis was rebuilt multiple times after destruction. The Statue of Zeus was crafted by the renowned sculptor Phidias around 435 BCE.

## Instructions for Testing:

1. Open the browser developer console (F12) to see debug logs
2. Copy each test sample individually
3. Create a new deck using the content
4. Check the console for these logs:
   - `[FlashcardGenerator] Content Analysis Debug:` - Shows word count, complexity analysis
   - `[FlashcardGenerator] Content Analysis Results:` - Shows original vs AI-recommended count
5. Record the number of flashcards actually generated
6. Note any patterns in card generation
7. Compare results to expected ranges

Expected Results:
- Sample 1 (Minimal - 19 words): 1-3 cards
- Sample 2 (Short - 67 words): 3-5 cards  
- Sample 3 (Medium - 140 words): 5-8 cards
- Sample 4 (Comprehensive - 350+ words): 12-18 cards
- Sample 5 (Complex - 650+ words): 20+ cards
- Sample 6 (Very Brief - 4 words): 1 card
- Sample 7 (List-Heavy - 200+ words): 8-12 cards

## Debug Information to Look For:

In the browser console, you should see:
```
[FlashcardGenerator] Content Analysis Debug: {
  wordCount: X,
  sentences: Y,
  paragraphs: Z,
  technicalTerms: A,
  complexity: "simple|moderate|complex",
  complexityScore: B,
  recommendedCardCount: C
}
```

And then:
```
[FlashcardGenerator] Content Analysis Results: {
  wordCount: X,
  complexity: "...",
  originalRequest: 10,
  aiRecommended: C,
  usingCount: C
}
```

If `originalRequest` and `usingCount` are both 10 for all tests, there's still an issue.
If `aiRecommended` and `usingCount` match but vary by content, the system is working correctly.

## Quick Test Commands (for copy-paste testing):

### Test 1 - Minimal (should generate 1-3 cards):
```
The capital of France is Paris. Paris is located in northern France on the River Seine.
```

### Test 2 - Brief List (should generate 2-4 cards):
```
The three primary colors are:
1. Red
2. Blue  
3. Yellow
```

### Test 3 - Medium Content (should generate 8-12 cards):
```
Photosynthesis is the process by which plants convert sunlight into energy. During photosynthesis, plants use chlorophyll to absorb light energy. They combine carbon dioxide from the air with water from the soil to produce glucose (sugar) and oxygen. 

The chemical equation for photosynthesis is: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This process occurs mainly in the leaves of plants, specifically in structures called chloroplasts.

Photosynthesis is essential for life on Earth as it produces oxygen and forms the base of most food chains.
```

If all three tests produce the same number of cards, there's an issue with the AI content analysis implementation.